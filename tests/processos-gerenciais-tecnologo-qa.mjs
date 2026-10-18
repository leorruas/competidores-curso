import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const data=JSON.parse(readFileSync("data/cursos-publicados.json","utf8"));
const c=data.courses.find(x=>x.id==="processos-gerenciais-tecnologo");
const b=c?.blocos||[];
test("F7.40: Processos Gerenciais multicampi preserva os currículos e contatos de cada campus",()=>{
 assert.ok(c); assert.equal(c.nome,"Processos Gerenciais");assert.equal(c.tipo,"Tecnólogo");assert.deepEqual(c.campi,["Ponte Nova","Ribeirão das Neves"]);
 assert.equal(b.length,26);assert.equal(b.filter(x=>x.tipo==="galeria").length,3);
 const offers=b.find(x=>x.tipo==="tabela"&&x.colunas[0]==="Campus");assert.equal(offers.linhas.length,2);
 assert.deepEqual(offers.linhas.map(x=>x[3]),["5 semestres","4 semestres"]);
 assert.equal(offers.linhas[0][5],"coordenacao.processosgerenciais@ifmg.edu.br");assert.equal(offers.linhas[1][5],"Informação incompleta");
 assert.equal(b.find(x=>x.tipo==="faq"&&x.titulo==="Informações dos campi").itens.length,2);
 assert.match(JSON.stringify(b),/384 horas.*24%|24%.*384 horas/);
 assert.deepEqual(b.slice(-2).map(x=>x.titulo),["Forma de ingresso","Mundo do Trabalho"]);
 assert.ok(b.at(-1).conteudo.length>500);
});
test("F7.40: duas experiências PN 2025 e apenas oportunidades em Neves, sem auditoria pública",()=>{
 const i=b.findIndex(x=>x.titulo==="Experiências e conquistas dos estudantes");assert.ok(i>0);
 assert.match(b[i].conteudo,/18 de junho de 2025/);assert.equal(b[i+1].tipo,"galeria");
 assert.match(b[i+2].conteudo,/Harmonia Interior/);assert.equal(b[i+3].tipo,"galeria");
 assert.equal(b.filter(x=>x.titulo==="Experiências e conquistas dos estudantes").length,1);
 assert.match(b.find(x=>x.titulo==="Pesquisa, extensão e oportunidades").conteudo,/Ribeirão das Neves/);
 assert.ok(b.find(x=>x.tipo==="introducao").conteudo.length<=280);
 assert.doesNotMatch(JSON.stringify(c),/Auditoria privada|PPC de dezembro|www2?\\.ifmg\\.edu\\.br|marcos\\.faria@ifmg|20 vagas|40 vagas/);
 assert.ok(data.courses.some(x=>x.id==="administracao-bacharelado"));
});
