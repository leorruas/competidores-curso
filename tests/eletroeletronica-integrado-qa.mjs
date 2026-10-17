import test from "node:test";import assert from "node:assert/strict";import {readFileSync} from "node:fs";
const data=JSON.parse(readFileSync("data/cursos-publicados.json","utf8")),c=data.courses.find(x=>x.id==="tecnico-em-eletroeletronica-integrado"),b=c?.blocos||[];
test("F7.11: Eletroeletrônica Integrado Ribeirão das Neves distingue oferta estadual",()=>{
 assert.ok(c);assert.deepEqual(c.campi,["Ribeirão das Neves"]);assert.equal(c.tipo,"Integrado");assert.equal(c.modalidade,"Presencial");
 const tab=b.find(x=>x.tipo==="tabela"&&x.colunas?.[0]==="Campus");assert.equal(tab.linhas.length,1);assert.equal(tab.linhas[0][3],"Informação incompleta");
 assert.ok(b[0].campos.some(x=>x.rotulo==="Carga horária total"&&x.valor==="Informação incompleta"));
 assert.ok(!JSON.stringify(c).includes("guilherme.silva@ifmg.edu.br"));
 assert.ok(!JSON.stringify(c).includes("3.330 horas"));
 assert.equal(b.find(x=>x.titulo==="Continue seus estudos no IFMG").conteudo,"");
 assert.deepEqual(b.slice(-2).map(x=>x.titulo),["Forma de ingresso","Mundo do Trabalho"]);
});
test("F7.11: quatro experiências verificadas possuem galeria própria, sem títulos indevidos",()=>{
 const g=b.map((x,i)=>x.tipo==="galeria"?{...x,index:i}:null).filter(Boolean);
 assert.equal(g.length,5);assert.equal(new Set(g.map(x=>x.referencia)).size,5);
 assert.ok(g.every(x=>Array.isArray(x.itens)&&x.itens.length===0&&b[x.index-1].tipo==="texto"));
 const start=b.findIndex(x=>x.titulo==="Experiências e conquistas dos estudantes"),end=b.findIndex((x,i)=>i>start&&x.titulo==="Perguntas frequentes");
 const experience=b.slice(start,end).filter(x=>x.tipo==="texto"&&x.conteudo);
 assert.equal(experience.length,4);assert.ok(experience.every(x=>b[b.indexOf(x)+1].tipo==="galeria"));
 const all=experience.map(x=>x.conteudo).join(" ");
 for(const v of ["2025","2026","Isaque Gonçalves Fidêncio","eXpertGirls","Yvy","COBENGE 2026","controle de videogame"])assert.ok(all.includes(v),v);
 assert.ok(!all.includes("campeãs mundiais"));assert.match(all,/ex-alunos/);
 assert.ok(b.find(x=>x.tipo==="faq"&&!x.titulo).itens.every(x=>!/^O que (é|são)/i.test(x.pergunta)));
});
