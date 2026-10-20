import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { auditarCursos } from "../scripts/auditar-backlog-editorial.mjs";

const all = JSON.parse(readFileSync("data/cursos-publicados.json","utf8")).courses;

test("auditoria emite inventário transversal sem excluir cursos",()=>{
  const result=auditarCursos(all);
  assert.equal(result.resumo.cursos,all.length);
  assert.ok(result.resumo.continuidadeComSubtituloSeparado>0);
  assert.ok(result.resumo.tituloFaqIsolado>0);
  assert.ok(result.resumo.linksForaDoLugar>0);
  assert.ok(result.resumo.faqSemCotas>0);
  assert.ok(result.achados.some(x=>x.curso==="tecnico-em-mecanica-integrado"&&x.tipo==="conquista-revisar"));
  assert.ok(result.achados.some(x=>x.curso==="tecnico-em-mecanica-integrado"&&x.tipo==="links-deslocados"));
});

test("auditoria identifica FAQ, links e casos suspeitos em cursos sintéticos",()=>{
  const curso={id:"piloto",blocos:[
    {tipo:"texto",titulo:"Continue seus estudos no IFMG",conteudo:""},
    {tipo:"texto",titulo:"Graduação",conteudo:""},
    {tipo:"tabela",colunas:["Curso"],linhas:[["Exemplo"]]},
    {tipo:"texto",titulo:"Experiências e conquistas dos estudantes",conteudo:"Formatura do ano."},
    {tipo:"galeria",itens:[]},
    {tipo:"texto",titulo:"Perguntas frequentes",conteudo:""},
    {tipo:"faq",itens:[{pergunta:"Como ingressar?",resposta:"Exemplo."}]},
    {tipo:"texto",titulo:"Outras modalidades relacionadas",conteudo:"Outra oferta."},
    {tipo:"links",itens:[]}
  ]};
  const result=auditarCursos([curso]);
  assert.equal(result.resumo.continuidadeComSubtituloSeparado,1);
  assert.equal(result.resumo.tituloFaqIsolado,1);
  assert.equal(result.resumo.linksForaDoLugar,1);
  assert.equal(result.resumo.faqSemIngresso,0);
  assert.equal(result.resumo.faqSemCotas,1);
  assert.equal(result.resumo.faqSemAssistencia,1);
  assert.equal(result.resumo.possiveisConquistasRotineiras,1);
  assert.ok(result.achados.every(x=>x.curso==="piloto"));
});
