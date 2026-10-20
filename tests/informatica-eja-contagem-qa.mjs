import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validarEstruturaCurso} from "../scripts/validar-estrutura.mjs";

const data=JSON.parse(readFileSync("data/cursos-publicados.json","utf8"));
const c=data.courses.find(x=>x.id==="tecnico-em-informatica-eja");
const regular=data.courses.find(x=>x.id==="tecnico-em-informatica-integrado");
const ds=data.courses.find(x=>x.id==="tecnico-em-desenvolvimento-de-sistemas-integrado");
const blocos=c?.blocos||[];
const field=rotulo=>blocos[0].campos.find(x=>x.rotulo===rotulo)?.valor;
const text=titulo=>blocos.find(x=>x.tipo==="texto"&&x.titulo===titulo);
test("F7.P4: curso Informática EJA Contagem independente dos integrados regulares",()=>{
 assert.ok(c&&regular&&ds);
 assert.equal(c.nome,"Técnico em Informática");
 assert.equal(c.nivel,"Técnico");
 assert.equal(c.tipo,"Integrado EJA");
 assert.deepEqual(c.campi,["Contagem"]);
 assert.equal(c.modalidade,"Presencial");
 assert.deepEqual(regular.campi,["Bambuí","Formiga","Ibirité","Ouro Branco","Ponte Nova","Ribeirão das Neves","Sabará","São João Evangelista"]);
 assert.deepEqual(ds.campi,["Contagem","Itabirito"]);
 assert.notEqual(c.id,regular.id);
 assert.equal(data.courses.filter(x=>x.id===c.id).length,1);
 assert.equal(blocos.length,23);
 assert.deepEqual(validarEstruturaCurso(c),[]);
 assert.equal(field("Campi"),"Contagem");
 assert.equal(field("Turno"),undefined);
 assert.equal(field("Tipo de oferta"),"Técnico integrado EJA");
 assert.ok(blocos.find(x=>x.tipo==="introducao").conteudo.length<=280);
 assert.deepEqual(blocos.slice(-2).map(x=>x.titulo),["Forma de ingresso","Mundo do Trabalho"]);
});
test("F7.P4: público de 18 anos ou mais e médio incompleto, currículo não inventado",()=>{
 assert.match(text("Para quem é o curso").conteudo,/18 anos ou mais/);
 assert.match(text("Forma de ingresso").conteudo,/ainda não ter concluído o ensino médio/);
 assert.equal(field("Eixo tecnológico"),"Informação e Comunicação");
 for(const key of ["Duração","Carga horária","Estágio supervisionado","Trabalho de Conclusão de Curso"])
  assert.equal(field(key),"Informação incompleta",key);
 const table=blocos.find(x=>x.tipo==="tabela"&&x.colunas?.[0]==="Campus");
 assert.deepEqual(table.colunas,["Campus","Modalidade","Turno","Duração mínima","Carga horária total","E-mail da coordenação"]);
 assert.deepEqual(table.linhas,[["Contagem","Presencial","Noite","Informação incompleta","Informação incompleta","Informação incompleta"]]);
 assert.equal(blocos[blocos.indexOf(table)+1].titulo,"Campus Contagem");
 assert.ok(!blocos.some(x=>x.tipo==="faq"&&x.titulo==="Informações dos campi"));
 const raw=JSON.stringify(c);
 for(const forbidden of ["40 vagas","1.021/2026","2027","vestibular@ifmg.edu.br","assuntosinstitucionais.contagem@ifmg.edu.br","192 horas","PPC 2026","www.ifmg.edu.br","Mulheres Mil","Programa Mulheres Mil","estágio não obrigatório","TCC não obrigatório"])
 assert.ok(!raw.includes(forbidden),forbidden);
});
test("F7.P4: FAQ, galeria, continuidade e perfil profissional conforme regras Wagtail",()=>{
 assert.equal(text("Experiências e conquistas dos estudantes").conteudo,"");
 const gallery=blocos.filter(x=>x.tipo==="galeria");
 assert.equal(gallery.length,1);
 assert.deepEqual(gallery[0].itens,[]);
 assert.equal(blocos[blocos.indexOf(gallery[0])-1].titulo,"Aprendizagem prática");
 assert.match(gallery[0].referencia,/Contagem/);
 const faq=blocos.find(x=>x.tipo==="faq"&&!x.titulo);
 assert.ok(faq.itens.length>=4,"perguntas originais preservadas");
 assert.ok(faq.itens.some(x=>x.pergunta.includes("Desenvolvimento de Sistemas")));
 assert.ok(faq.itens.some(x=>x.pergunta.includes("graduação")));
 assert.ok(faq.itens.some(x=>x.resposta.includes("18 anos ou mais")));
 const i=blocos.findIndex(x=>x.titulo==="Continue seus estudos no IFMG");
 assert.equal(blocos[i].conteudo,"");
 assert.equal(blocos[i+1].titulo,"Graduação");
 assert.ok(blocos[i+2].linhas.some(x=>x[0].includes("Análise e Desenvolvimento de Sistemas")));
 assert.equal(blocos[i+3].titulo,"Pós-graduação");
 assert.ok(blocos[i+4].linhas.some(x=>x[0].includes("Especialização em Inteligência Artificial")));
 assert.ok(text("Mundo do Trabalho").conteudo.length>500);
});
test("F7.P4: ordem alfabética do catálogo preservada",()=>{
 const ordered=[...data.courses].sort((a,b)=>a.nome.localeCompare(b.nome,"pt-BR",{sensitivity:"base",numeric:true})||String(a.tipo||"").localeCompare(String(b.tipo||""),"pt-BR")||a.id.localeCompare(b.id,"pt-BR"));
 assert.deepEqual(data.courses.map(x=>x.id),ordered.map(x=>x.id));
});
