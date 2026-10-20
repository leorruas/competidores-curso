import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const data=JSON.parse(readFileSync("data/cursos-publicados.json","utf8"));
const c=data.courses.find(x=>x.id==="analise-e-desenvolvimento-de-sistemas-tecnologo"),b=c?.blocos||[];
test("F7.21: ADS tecnológico multicampi preserva PPCs e modalidade",()=>{
 assert.ok(c);assert.equal(c.nome,"Análise e Desenvolvimento de Sistemas");assert.equal(c.tipo,"Tecnólogo");assert.equal(c.nivel,"Graduação");assert.deepEqual(c.campi,["Ouro Preto","Ribeirão das Neves"]);
 assert.ok(b[0].campos.some(x=>x.rotulo==="Carga horária"&&x.valor.includes("2.000 horas")));
 assert.ok(b[0].campos.some(x=>x.rotulo==="Duração"&&x.valor.includes("3 anos")));
 const camp=b.find(x=>x.tipo==="tabela"&&x.colunas?.[0]==="Campus");assert.ok(camp);assert.deepEqual(camp.linhas.map(x=>x[0]),c.campi);
 assert.ok(!camp.linhas[0][1].includes("28%"));assert.match(camp.linhas[1][1],/28% EaD/);
 assert.ok(camp.linhas.every(x=>x[3]==="Informação incompleta"));
 const local=b.find(x=>x.tipo==="faq"&&x.titulo==="Informações dos campi");assert.equal(local.itens.length,2);
 assert.match(local.itens[0].resposta,/200 horas/);assert.match(local.itens[1].resposta,/40 horas/);
 assert.deepEqual(b.slice(-2).map(x=>x.titulo),["Forma de ingresso","Mundo do Trabalho"]);
});
test("F7.21: sem inventar conquistas, com galeria contextual e catálogo alfabético",()=>{
 assert.equal(b.find(x=>x.titulo==="Experiências e conquistas dos estudantes").conteudo,"");
 assert.equal(b.filter(x=>x.tipo==="galeria").length,1);assert.equal(b.find(x=>x.tipo==="galeria").itens.length,0);
 assert.ok(b.find(x=>x.tipo==="faq"&&!x.titulo).itens.length>=4);
 assert.ok(!JSON.stringify(c).includes("moises.pereira@ifmg.edu.br")&&!JSON.stringify(c).includes("Auditoria privada"));
 const sorted=[...data.courses].sort((a,b)=>a.nome.localeCompare(b.nome,"pt-BR",{sensitivity:"base",numeric:true})||String(a.tipo||"").localeCompare(String(b.tipo||""),"pt-BR")||a.id.localeCompare(b.id,"pt-BR"));
 assert.deepEqual(data.courses.map(x=>x.id),sorted.map(x=>x.id));
});
