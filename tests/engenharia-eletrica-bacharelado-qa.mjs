import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const courses=JSON.parse(readFileSync("data/cursos-publicados.json","utf8")).courses;
const c=courses.find(x=>x.id==="engenharia-eletrica-bacharelado"),b=c?.blocos??[];
test("F7.30: três campi distintos, turnos, PPCs e contatos",()=>{
 assert.ok(c);assert.equal(c.nome,"Engenharia Elétrica");assert.equal(c.tipo,"Bacharelado");
 assert.deepEqual(c.campi,["Formiga","Ipatinga","Itabirito"]);
 const t=b.find(x=>x.tipo==="tabela"&&x.colunas[0]==="Campus");
 assert.deepEqual(t.linhas.map(x=>x[0]),c.campi);
 assert.equal(t.linhas[1][1],"Manhã, tarde e noite");
 assert.equal(t.linhas[1][5],"Informação incompleta");
 assert.equal(t.linhas[0][5],"eng.eletrica.formiga@ifmg.edu.br");
 assert.equal(t.linhas[2][5],"eng.eletrica.itabirito@ifmg.edu.br");
 const loc=b.find(x=>x.tipo==="faq"&&x.titulo==="Informações dos campi");
 assert.equal(loc.itens.length,3);
 assert.match(loc.itens[0].resposta,/160 horas de estágio/);
 assert.match(loc.itens[0].resposta,/30 horas/);
 assert.match(loc.itens[1].resposta,/160 horas de estágio/);
 assert.match(loc.itens[1].resposta,/TCC obrigatório de 40 horas/);
 assert.match(loc.itens[2].resposta,/180 horas de estágio/);
 assert.match(loc.itens[2].resposta,/120 horas/);
 assert.deepEqual(b.slice(-2).map(x=>x.titulo),["Forma de ingresso","Mundo do Trabalho"]);
});
test("F7.30: cinco experiências 2025+ com galerias próprias e três galerias contextuais",()=>{
 const i=b.findIndex(x=>x.titulo==="Experiências e conquistas dos estudantes");
 assert.ok(i>0);for(const n of [i,i+2,i+4,i+6,i+8]){
   assert.equal(b[n].tipo,"texto");
   assert.equal(b[n+1].tipo,"galeria");assert.deepEqual(b[n+1].itens,[]);
 }
 assert.match(b[i].conteudo,/Cemig/);
 assert.match(b[i+2].conteudo,/COBENGE/);
 assert.match(b[i+4].conteudo,/julho de 2025/);
 assert.match(b[i+6].conteudo,/junho de 2026/);
 assert.match(b[i+8].conteudo,/egressos/);
 assert.match(b[i+8].conteudo,/Bristol/);
 assert.equal(b.filter(x=>x.tipo==="galeria").length,8);
 assert.equal(b.filter(x=>x.titulo==="Experiências e conquistas dos estudantes").length,1);
 const sorted=[...courses].sort((a,b)=>a.nome.localeCompare(b.nome,"pt-BR",{sensitivity:"base",numeric:true})||String(a.tipo||"").localeCompare(String(b.tipo||""),"pt-BR")||a.id.localeCompare(b.id,"pt-BR"));
 assert.deepEqual(courses.map(x=>x.id),sorted.map(x=>x.id));
});
