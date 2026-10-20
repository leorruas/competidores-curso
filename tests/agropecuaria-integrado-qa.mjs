import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const data=JSON.parse(readFileSync("data/cursos-publicados.json","utf8"));
const c=data.courses.find(x=>x.id==="tecnico-em-agropecuaria-integrado");
const b=c?.blocos||[];
test("F7.9: Agropecuária integrada diferencia dois campi, sem importar PPC antigo",()=>{
 assert.ok(c);assert.equal(c.tipo,"Integrado");assert.deepEqual(c.campi,["Bambuí","São João Evangelista"]);
 assert.equal(c.modalidade,"Presencial");
 const table=b.find(x=>x.tipo==="tabela"&&x.colunas?.[0]==="Campus");assert.deepEqual(table.linhas.map(x=>x[0]),c.campi);
 assert.equal(table.linhas[0][3],"Informação incompleta");assert.equal(table.linhas[1][3],"agropecuaria.sje@ifmg.edu.br");
 assert.ok(b[0].campos.some(x=>x.rotulo==="Carga horária"&&x.valor==="Informação incompleta"));
 assert.ok(!JSON.stringify(c).includes("4.600 horas"));
 assert.equal(b.find(x=>x.titulo==="Continue seus estudos no IFMG").conteudo,"");
 assert.deepEqual(b.slice(-2).map(x=>x.titulo),["Forma de ingresso","Mundo do Trabalho"]);
});
test("F7.9: classificação OBFEP 2025 comprovada e galerias contextuais sem casos inventados",()=>{
 const galleries=b.map((x,i)=>x.tipo==="galeria"?{...x,index:i}:null).filter(Boolean);
 assert.equal(galleries.length,2);assert.equal(new Set(galleries.map(x=>x.referencia)).size,2);
 assert.ok(galleries.every(x=>Array.isArray(x.itens)&&x.itens.length===0&&b[x.index-1].tipo==="texto"));
 const exp=b.find(x=>x.titulo==="Experiências e conquistas dos estudantes");
 assert.match(exp.conteudo,/cinco estudantes/);assert.match(exp.conteudo,/segunda fase/);assert.match(exp.conteudo,/2025/);
 assert.ok(!/medalhas|campeões|premiados/.test(exp.conteudo));
 assert.equal(b[b.indexOf(exp)+1].tipo,"galeria");
 assert.ok(!JSON.stringify(c).includes("Sanitaristas Mirins"));
 assert.equal(b.find(x=>x.tipo==="faq"&&!x.titulo).itens.filter(x=>/^O que (?:é|são) /i.test(x.pergunta)).length,0);
});
