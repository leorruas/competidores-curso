import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const all=JSON.parse(readFileSync("data/cursos-publicados.json","utf8")).courses;
const c=all.find(x=>x.id==="engenharia-civil-bacharelado"),b=c?.blocos||[];
test("F7.28 três ofertas locais e currículos distintos",()=>{
 assert.ok(c);assert.deepEqual(c.campi,["Governador Valadares","Piumhi","Santa Luzia"]);
 const t=b.find(x=>x.tipo==="tabela"&&x.colunas[0]==="Campus");
 assert.deepEqual(t.linhas.map(x=>x[0]),c.campi);
 assert.equal(t.linhas[1][4],"Informação incompleta");
 const f=b.find(x=>x.tipo==="faq"&&x.titulo==="Informações dos campi");
 assert.equal(f.itens.length,3);
 assert.match(f.itens[0].resposta,/160 horas de estágio/);
 assert.match(f.itens[2].resposta,/180 horas de estágio/);
 assert.deepEqual(b.slice(-2).map(x=>x.titulo),["Forma de ingresso","Mundo do Trabalho"]);
});
test("F9.4: avaliação e Destaque Acadêmico mantidos, sem seleção de monitores",()=>{
 const i=b.findIndex(x=>x.titulo==="Experiências e conquistas dos estudantes");
 assert.ok(i>0);
 for(const n of [i,i+2]){assert.equal(b[n].tipo,"texto");assert.equal(b[n+1].tipo,"galeria");assert.deepEqual(b[n+1].itens,[]);}
 assert.match(b[i].conteudo,/2026/);
 assert.match(b[i+2].conteudo,/Destaque Acadêmico/);
 assert.equal(b[i+4].titulo,"Perguntas frequentes");
 assert.equal(b.filter(x=>x.tipo==="galeria").length,5);
 assert.doesNotMatch(JSON.stringify(c),/selecionados para monitoria|Seleção de monitores bolsistas em Cálculo I/);
});
