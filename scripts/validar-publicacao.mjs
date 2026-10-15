#!/usr/bin/env node
/**
 * Segurança editorial do catálogo público de cursos.
 * Não acessa a vault privada e não aprova conteúdo em nome de revisores.
 * Executar: node scripts/validar-publicacao.mjs
 */
import { readFileSync } from "node:fs";

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
    return u.protocol === "https:" || (u.protocol === "mailto:" && u.pathname.includes("@"));
  } catch { return false; }
};
const denuncia = (path, msg) => erros.push(path + ": " + msg);
const saneamento = /(?:competidores-cursos(?:\.git)?|(?:^|\/)Benchmark\/|(?:^|\/)páginas de cursos\/|c:\\users\\|file:\/\/|\[!CAUTION\]|\[!NOTE\]|\[!TIP\]|informação faltante|a confirmar com a coordena[cç][aã]o|pend[eê]ncia de fonte|\bconflitante\b|\bnda\b)/i;
function checaVazamento(value, path) {
  if (typeof value === "string" && saneamento.test(value)) denuncia(path, "possível referência à vault privada ou texto não homologado");
  else if (Array.isArray(value)) value.forEach((x,i) => checaVazamento(x,path+"["+i+"]"));
  else if (objeto(value)) Object.entries(value).forEach(([k,v]) => checaVazamento(v,path+"."+k));
}
function validarBloco(b, p) {
  if (!objeto(b) || !tipos.has(b.tipo)) { denuncia(p, "tipo de bloco inválido"); return; }
  if (!vazioOuString(b.titulo, 200)) denuncia(p+".titulo", "título inválido");
  if (!vazioOuString(b.instrucao, 3500)) denuncia(p+".instrucao", "instrução inválida");
  if (b.tipo === "texto" && !vazioOuString(b.conteudo, 12000)) denuncia(p+".conteudo", "texto inválido");
  if (b.tipo === "introducao" && (!string(b.conteudo, 280) || b.conteudo.length > 280)) denuncia(p+".conteudo", "Introdução deve ter de 1 a 280 caracteres");
  if (b.tipo === "dados-basicos" && (!Array.isArray(b.campos) || !b.campos.length || !b.campos.every(x => objeto(x) && string(x.rotulo,160) && string(x.valor,500)))) denuncia(p+".campos","campos inválidos");
  if (b.tipo === "tabela" && (!Array.isArray(b.colunas) || !b.colunas.length || !b.colunas.every(x => string(x,160)) || !Array.isArray(b.linhas) || !b.linhas.every(row => Array.isArray(row) && row.length === b.colunas.length && row.every(x => string(x,1200))))) denuncia(p, "tabela inválida ou número de colunas divergente");
  if (b.tipo === "faq" && (!Array.isArray(b.itens) || !b.itens.length || !b.itens.every(x => objeto(x) && string(x.pergunta,300) && string(x.resposta,2000)))) denuncia(p,"FAQ precisa de perguntas e respostas");
  if (b.tipo === "links" && (!Array.isArray(b.itens) || !b.itens.length || !b.itens.every(x => objeto(x) && string(x.rotulo,160) && urlSegura(x.url)))) denuncia(p,"links inválidos");
  if (b.tipo === "link-unico" && (!objeto(b.link) || !string(b.link.rotulo,160) || !urlSegura(b.link.url) || !vazioOuString(b.link.descricao,250))) denuncia(p,"link único inválido");
  if (b.tipo === "galeria" && (!Array.isArray(b.itens) || !b.itens.length || !b.itens.every(x => objeto(x) && string(x.url,500) && x.url.startsWith("https:") && string(x.legenda,300) && string(x.alt,300)))) denuncia(p,"galeria exige imagens autorizadas, legendas e textos alternativos");
}
if (!objeto(base) || base.schemaVersion !== 1 || !Array.isArray(base.courses)) denuncia(arquivo, "schemaVersion 1 e courses[] são obrigatórios");
else base.courses.forEach((curso,i) => {
  const p = "courses["+i+"]";
  if (!objeto(curso)) { denuncia(p, "curso inválido"); return; }
  if (curso.publicacao_autorizada !== true || curso.status !== "aprovado_para_divulgacao") denuncia(p, "curso sem autorização explícita: não deve existir no JSON público");
  if (!string(curso.id,140) || !/^[a-z0-9][a-z0-9-]*$/.test(curso.id)) denuncia(p+".id","identificador não estável");
  else { if (ids.has(curso.id)) denuncia(p+".id","identificador duplicado"); ids.add(curso.id); }
  if (!string(curso.nome,200) || !string(curso.nivel,100)) denuncia(p,"nome/nível obrigatórios");
  if (!vazioOuString(curso.tipo,100) || !vazioOuString(curso.modalidade,220) || !vazioOuString(curso.descricao,1000)) denuncia(p,"tipo, modalidade ou descrição inválida");
  if (!Array.isArray(curso.campi) || !curso.campi.length || !curso.campi.every(x => string(x,150))) denuncia(p+".campi", "campus precisa ser informado");
  if (!Array.isArray(curso.blocos) || !curso.blocos.length) denuncia(p+".blocos", "blocos obrigatórios");
  else curso.blocos.forEach((b,j) => validarBloco(b,p+".blocos["+j+"]"));
  checaVazamento(curso,p);
});
if (erros.length) { console.error("ERROS DE PUBLICAÇÃO ("+erros.length+"):\n" + erros.map(x=>" - "+x).join("\n")); process.exit(1); }
console.log("Catálogo validado: " + base.courses.length + " curso(s) aprovados; nenhuma violação estrutural ou referência interna detectada.");
console.log("Aviso: a validação automática não substitui a revisão editorial e acadêmica.");
