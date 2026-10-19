import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validarEstruturaCurso} from "../scripts/validar-estrutura.mjs";
const data=JSON.parse(readFileSync("data/cursos-publicados.json","utf8"));
const c=data.courses.find(x=>x.id==="tecnico-em-desenvolvimento-de-sistemas-integrado");
const b=c?.blocos||[];
const field=r=>b[0].campos.find(x=>x.rotulo===r)?.valor;
const section=t=>b.find(x=>x.tipo==="texto"&&x.titulo===t);

test("F7.P1: mesmo grupo integrado para Contagem e Itabirito, sem duplicar página",()=>{
 assert.ok(c);
 assert.deepEqual(c.campi,["Contagem","Itabirito"]);
 assert.equal(data.courses.filter(x=>x.id===c.id).length,1);
 assert.equal(c.tipo,"Integrado");
 assert.equal(c.modalidade,"Presencial");
 assert.equal(b.length,26);
 assert.deepEqual(validarEstruturaCurso(c),[]);
 assert.equal(field("Campi"),"Contagem; Itabirito");
 assert.equal(field("Turno"),"Manhã e tarde");
 assert.ok(b.find(x=>x.tipo==="introducao").conteudo.length<=280);
 assert.doesNotMatch(b.find(x=>x.tipo==="introducao").conteudo,/apenas Itabirito/);
 assert.deepEqual(b.slice(-2).map(x=>x.titulo),["Forma de ingresso","Mundo do Trabalho"]);
});
test("F7.P1: duas ofertas na tabela com pendências próprias, sem importar PPC",()=>{
 const t=b.find(x=>x.tipo==="tabela"&&x.colunas?.[0]==="Campus");
 assert.deepEqual(t.colunas,["Campus","Modalidade","Turno","Duração mínima","Carga horária total","E-mail da coordenação"]);
 assert.deepEqual(t.linhas,[
  ["Contagem","Presencial","Manhã e tarde","Informação incompleta","Informação incompleta","Informação incompleta"],
  ["Itabirito","Presencial","Manhã e tarde","Informação incompleta","Informação incompleta","Informação incompleta"]
 ]);
 for(const rotulo of ["Duração mínima","Carga horária total","Estágio supervisionado","Trabalho de Conclusão de Curso","E-mail da coordenação"])
   assert.equal(field(rotulo),"Informação incompleta");
 const i=b.indexOf(t);
 assert.equal(b[i+1].titulo,"Campus Contagem");
 assert.equal(b[i+2].titulo,"Campus Itabirito");
 assert.ok(!b.some(x=>x.tipo==="faq"&&x.titulo==="Informações dos campi"));
 assert.match(section("Campus Contagem").conteudo,/primeiros cursos regulares/);
 assert.match(section("Campus Itabirito").conteudo,/sistemas para web/);
});
test("F7.P1: não transfere atividades do Integrado de outros campi nem dados do edital para o público",()=>{
 assert.equal(section("Experiências e conquistas dos estudantes").conteudo,"");
 const galleries=b.filter(x=>x.tipo==="galeria");
 assert.equal(galleries.length,1);
 assert.equal(galleries[0].itens.length,0);
 assert.match(galleries[0].referencia,/Contagem e Itabirito/);
 assert.equal(b[b.indexOf(galleries[0])-1].titulo,"Aprendizagem prática");
 assert.equal(section("Continue seus estudos no IFMG").conteudo,"");
 assert.equal(section("Graduação").conteudo,"");
 assert.equal(section("Pós-graduação").conteudo,"");
 const str=JSON.stringify(c);
 for(const forbidden of ["40 vagas","30 vagas","1.020/2026","3.210 horas","assuntosinstitucionais.contagem@ifmg.edu.br","PPC de Contagem","2027","Auditoria privada","Consulta pública","2026"]) assert.ok(!str.includes(forbidden),forbidden);
 const faq=b.find(x=>x.tipo==="faq"&&!x.titulo);
 assert.equal(faq.itens.length,4);
 assert.ok(faq.itens.some(x=>x.pergunta.includes("Informática EJA de Contagem")));
 assert.ok(faq.itens.some(x=>x.pergunta.includes("graduação em Análise e Desenvolvimento de Sistemas")));
 assert.ok(!faq.itens.some(x=>x.pergunta.includes("já recebe estudantes")));
 assert.match(section("Forma de ingresso").conteudo,/regras próprias para cada oferta/);
});
