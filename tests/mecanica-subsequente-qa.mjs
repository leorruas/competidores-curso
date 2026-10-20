import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const data=JSON.parse(readFileSync("data/cursos-publicados.json","utf8"));
const c=data.courses.find(x=>x.id==="tecnico-em-mecanica-subsequente");const b=c?.blocos||[];
test("F7.44: Mecânica Subsequente dois campi com carga e estágio não homogeneizados",()=>{
 assert.ok(c);assert.equal(c.nome,"Técnico em Mecânica");assert.equal(c.tipo,"Subsequente");assert.deepEqual(c.campi,["Congonhas","Conselheiro Lafaiete"]);assert.ok(data.courses.some(x=>x.id==="tecnico-em-mecanica-integrado"&&x.tipo==="Integrado"));
 assert.equal(b.length,23);assert.equal(b.filter(x=>x.tipo==="galeria").length,1);
 const q=b.find(x=>x.tipo==="tabela"&&x.colunas[0]==="Campus");
 assert.deepEqual(q.linhas,[["Congonhas","Presencial","Noite","4 semestres","Informação incompleta","coordtecmec.congonhas@ifmg.edu.br"],["Conselheiro Lafaiete","Presencial (20% EaD na oferta de 2027)","Noite","4 semestres","1.200 horas","coord.meccl@ifmg.edu.br"]]);
 const campus=b.find(x=>x.tipo==="faq"&&x.titulo==="Informações dos campi");assert.equal(campus.itens.length,2);
 assert.match(campus.itens[0].resposta,/360 horas/);assert.match(campus.itens[1].resposta,/estágio é opcional/);
 assert.deepEqual(b.slice(-2).map(x=>x.titulo),["Forma de ingresso","Mundo do Trabalho"]);assert.ok(b.at(-1).conteudo.length>500);
});
test("F9.3: formatura rotineira sai das conquistas do Técnico em Mecânica Subsequente",()=>{
 const i=b.findIndex(x=>x.titulo==="Experiências e conquistas dos estudantes");assert.ok(i>0);assert.equal(b.filter(x=>x.titulo==="Experiências e conquistas dos estudantes").length,1);
 assert.equal(b[i].conteudo,"Informação incompleta");assert.equal(b[i+1].tipo,"texto");
 assert.ok(!b.some(x=>x.tipo==="galeria"&&/Formatura/i.test(x.referencia)));assert.ok(b.find(x=>x.tipo==="introducao").conteudo.length<=280);
 const raw=JSON.stringify(c);
 for(const forbidden of ["Auditoria privada","PPC de outubro","Matriz 2015","1.202 horas","isadora.guedes@ifmg.edu.br","www2.ifmg.edu.br","17,76%","Lafaiete/PPC"])assert.ok(!raw.includes(forbidden),forbidden);
 const sorted=[...data.courses].sort((a,b)=>a.nome.localeCompare(b.nome,"pt-BR",{sensitivity:"base",numeric:true})||String(a.tipo||"").localeCompare(String(b.tipo||""),"pt-BR")||a.id.localeCompare(b.id,"pt-BR"));
 assert.deepEqual(data.courses.map(x=>x.id),sorted.map(x=>x.id));
});