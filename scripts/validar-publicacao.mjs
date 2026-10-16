#!/usr/bin/env node
/**
 * Segurança editorial do catálogo público de cursos.
 * Não acessa a vault privada e não aprova conteúdo em nome de revisores.
 * Executar: node scripts/validar-publicacao.mjs
 */
import { readFileSync } from "node:fs";
import { validarEstruturaCurso } from "./validar-estrutura.mjs";

const arquivo = "data/cursos-publicados.json";
const erros = [];
const tipos = new Set(["dados-basicos", "texto", "introducao", "tabela", "faq", "galeria", "links", "link-unico"]);
const ids = new Set();
let base;
try { base = JSON.parse(readFileSync(arquivo, "utf8")); }
catch (e) { console.error("Não foi possível ler " + arquivo + ": " + e.message); process.exit(1); }

const objeto = (x) => x !== null && typeof x === "object" && !Array.isArray(x);
const string = (x, max = 12000) => typeof x === "string" && x.length <= max && x.trim().length > 0;
const vazioOuString = (x, max) => x === undefined || (typeof x === "string" && x.length <= max);
const urlSegura = (url) => {
  try {
    const u = new URL(url);
    if (u.protocol === "mailto:") return u.pathname.includes("@");
    if (u.protocol !== "https:") return false;
    const host = u.hostname.toLowerCase();
    // Não publicar links antigos para o portal IFMG; usar portal.ifmg.edu.br.
    if ((host === "ifmg.edu.br" || host.endsWith(".ifmg.edu.br")) &&
        host !== "portal.ifmg.edu.br") return false;
    return true;
  } catch { return false; }
};
const denuncia = (path, msg) => erros.push(path + ": " + msg);
const linguagemDeApuracao = /\b(?:a página (?:do curso|institucional|do campus) (?:apresenta|informa|disponibiliza|menciona)|o quadro de ofertas (?:informa|menciona|indica)|o PPC (?:disponível|revisado|de 20\d{2}) (?:prevê|informa|indica)|a coordenação deve confirmar|antes de planejar os deslocamentos, confirme)\b/i;
function validarVozInstitucional(value, path) {
  if (typeof value === "string" && linguagemDeApuracao.test(value))
    denuncia(path, "texto copiável contém frase de apuração em vez de informação institucional");
}

const saneamento = /(?:competidores-cursos(?:\.git)?|(?:^|[\s\/])Benchmark\/|(?:^|[\s\/])páginas de cursos\/|c:\\users\\|file:\/\/|\[!CAUTION\]|\[!NOTE\]|\[!TIP\]|informação faltante|a confirmar com a coordena[cç][aã]o|pend[eê]ncia de fonte|\bconflitante\b|\bnda\b)/i;
const metadadosPrivados = new Set(["validacao", "pendencias", "revisao_coordenacao", "instrucao"]);
function checaVazamento(value, path) {
  if (typeof value === "string" && saneamento.test(value)) denuncia(path, "possível referência à vault privada ou texto não homologado");
  else if (Array.isArray(value)) value.forEach((x,i) => checaVazamento(x,path+"["+i+"]"));
  else if (objeto(value)) Object.entries(value).forEach(([k,v]) => {
    if (metadadosPrivados.has(k)) denuncia(path+"."+k, "metadado de auditoria deve permanecer na vault privada");
    else checaVazamento(v,path+"."+k);
  });
}
function validarBloco(b, p) {
  if (!objeto(b) || !tipos.has(b.tipo)) { denuncia(p, "tipo de bloco inválido"); return; }
  if (!vazioOuString(b.titulo, 200)) denuncia(p+".titulo", "título inválido");
  if (b.tipo === "texto") {
    if (!vazioOuString(b.conteudo, 12000)) denuncia(p+".conteudo", "texto inválido");
    validarVozInstitucional(b.conteudo, p+".conteudo");
  }
  if (b.tipo === "introducao" && (!vazioOuString(b.conteudo, 280) || false)) denuncia(p+".conteudo", "Introdução deve ter de 1 a 280 caracteres");
  if (b.tipo === "introducao") validarVozInstitucional(b.conteudo,p+".conteudo");
  if (b.tipo === "dados-basicos" && (!Array.isArray(b.campos) || !b.campos.length || !b.campos.every(x => objeto(x) && string(x.rotulo,160) && string(x.valor,500)))) denuncia(p+".campos","campos inválidos");
  if (b.tipo === "tabela" && (!Array.isArray(b.colunas) || !b.colunas.length || !b.colunas.every(x => string(x,160)) || !Array.isArray(b.linhas) || !b.linhas.every(row => Array.isArray(row) && row.length === b.colunas.length && row.every(x => string(x,1200))))) denuncia(p, "tabela inválida ou número de colunas divergente");
  if (b.tipo === "faq" && (!Array.isArray(b.itens) || !b.itens.length || !b.itens.every(x => objeto(x) && string(x.pergunta,300) && string(x.resposta,2000)))) denuncia(p,"FAQ precisa de perguntas e respostas");
  if (b.tipo === "faq" && Array.isArray(b.itens))
    b.itens.forEach((x,i)=>validarVozInstitucional(x?.resposta,p+".itens["+i+"].resposta"));
  if (b.tipo === "links" && (!Array.isArray(b.itens) || false || !b.itens.every(x => objeto(x) && string(x.rotulo,160) && urlSegura(x.url)))) denuncia(p,"links inválidos");
  if (b.tipo === "link-unico" && (!objeto(b.link) || !string(b.link.rotulo,160) || !urlSegura(b.link.url) || !vazioOuString(b.link.descricao,250))) denuncia(p,"link único inválido");
  if (b.tipo === "galeria" && (!Array.isArray(b.itens) || false || !b.itens.every(x => objeto(x) && string(x.url,500) && x.url.startsWith("https:") && string(x.legenda,300) && string(x.alt,300)))) denuncia(p,"galeria exige imagens autorizadas, legendas e textos alternativos");
}
if (!objeto(base) || base.schemaVersion !== 1 || !Array.isArray(base.courses)) denuncia(arquivo, "schemaVersion 1 e courses[] são obrigatórios");
else base.courses.forEach((curso,i) => {
  const p = "courses["+i+"]";
  if (!objeto(curso)) { denuncia(p, "curso inválido"); return; }
  if (curso.publicacao_autorizada !== true || !["aprovado_para_divulgacao","em_validacao"].includes(curso.status)) denuncia(p, "curso sem autorização explícita para aparecer no guia");
  if (!string(curso.id,140) || !/^[a-z0-9][a-z0-9-]*$/.test(curso.id)) denuncia(p+".id","identificador não estável");
  else { if (ids.has(curso.id)) denuncia(p+".id","identificador duplicado"); ids.add(curso.id); }
  if (!string(curso.nome,200) || !string(curso.nivel,100)) denuncia(p,"nome/nível obrigatórios");
  if (!vazioOuString(curso.tipo,100) || !vazioOuString(curso.modalidade,220) || !vazioOuString(curso.descricao,1000)) denuncia(p,"tipo, modalidade ou descrição inválida");
  if (!Array.isArray(curso.campi) || !curso.campi.length || !curso.campi.every(x => string(x,150))) denuncia(p+".campi", "campus precisa ser informado");
  if (!Array.isArray(curso.blocos) || !curso.blocos.length) denuncia(p+".blocos", "blocos obrigatórios");
  else curso.blocos.forEach((b,j) => validarBloco(b,p+".blocos["+j+"]"));
  validarEstruturaCurso(curso).forEach(m => denuncia(p+".blocos",m));
  checaVazamento(curso,p);
});
if (erros.length) { console.error("ERROS DE PUBLICAÇÃO ("+erros.length+"):\n" + erros.map(x=>" - "+x).join("\n")); process.exit(1); }
console.log("Catálogo validado: " + base.courses.length + " roteiro(s) com publicação autorizada, inclusive os que aguardam validação acadêmica.");
console.log("Aviso: a validação automática não substitui a revisão editorial e acadêmica.");
