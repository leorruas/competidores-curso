import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const data=JSON.parse(readFileSync("data/cursos-publicados.json","utf8"));
const c=data.courses.find(x=>x.id==="engenharia-de-controle-e-automacao-bacharelado"),b=c?.blocos??[];
test("F7.29: três campi e diferenças curriculares verificadas",()=>{
 assert.ok(c);assert.equal(c.tipo,"Bacharelado");
 assert.deepEqual(c.campi,["Betim","Ibirité","Sabará"]);
 const t=b.find(x=>x.tipo==="tabela"&&x.colunas[0]==="Campus");
 assert.deepEqual(t.linhas.map(x=>x[0]),c.campi);
 assert.match(t.linhas[1][2],/5,4%/);assert.match(t.linhas[2][2],/11,12%/);
 const f=b.find(x=>x.tipo==="faq"&&x.titulo==="Informações dos campi");
 assert.equal(f.itens.length,3);
 assert.match(f.itens[0].resposta,/360 horas de estágio/);
 assert.match(f.itens[1].resposta,/160 horas de estágio/);
 assert.match(f.itens[2].resposta,/360 horas de estágio/);
 assert.deepEqual(b.slice(-2).map(x=>x.titulo),["Forma de ingresso","Mundo do Trabalho"]);
 assert.ok(!JSON.stringify(c).includes("11,40%"));
});
test("F9.4: projetos acadêmicos mantidos, sem colação rotineira",()=>{
 const i=b.findIndex(x=>x.titulo==="Experiências e conquistas dos estudantes");
 assert.ok(i>0);
 for(const n of [i,i+2]){assert.equal(b[n].tipo,"texto");assert.equal(b[n+1].tipo,"galeria");assert.deepEqual(b[n+1].itens,[]);}
 assert.match(b[i].conteudo,/2025/);assert.match(b[i].conteudo,/Betim/);
 assert.match(b[i+2].conteudo,/julho de 2025/);assert.match(b[i+2].conteudo,/Sabará/);
 assert.equal(b[i+4].titulo,"Perguntas frequentes");
 assert.equal(b.filter(x=>x.tipo==="galeria").length,5);
 assert.equal(b.filter(x=>x.titulo==="Experiências e conquistas dos estudantes").length,1);
 assert.doesNotMatch(JSON.stringify(c),/Colação de grau de bacharéis|Concluintes de Engenharia de Controle e Automação em Sabará/);
 assert.deepEqual(data.courses.map(x=>x.id),[...data.courses].sort((a,b)=>a.nome.localeCompare(b.nome,"pt-BR",{sensitivity:"base",numeric:true})||String(a.tipo||"").localeCompare(String(b.tipo||""),"pt-BR")||a.id.localeCompare(b.id,"pt-BR")).map(x=>x.id));
});
