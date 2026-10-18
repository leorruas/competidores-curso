import test from "node:test";import assert from "node:assert/strict";import {readFileSync} from "node:fs";
const data=JSON.parse(readFileSync("data/cursos-publicados.json","utf8"));const c=data.courses.find(x=>x.id==="tecnico-em-mineracao-subsequente");const b=c?.blocos||[];
test("F7.45: técnico Mineração Subsequentente não mistura Integrado nem estágios",()=>{
 assert.ok(c);assert.equal(c.nome,"Técnico em Mineração");assert.equal(c.tipo,"Subsequente");assert.deepEqual(c.campi,["Congonhas","Ouro Preto"]);assert.ok(data.courses.some(x=>x.id==="tecnico-em-mineracao-integrado"&&x.tipo==="Integrado"));
 assert.equal(b.length,23);assert.equal(b.filter(x=>x.tipo==="galeria").length,1);
 const t=b.find(x=>x.tipo==="tabela"&&x.colunas[0]==="Campus");assert.deepEqual(t.linhas,[["Congonhas","Presencial","Noite","4 semestres","1.560 horas","coordtecmin.congonhas@ifmg.edu.br"],["Ouro Preto","Presencial (5% EaD na oferta de 2027)","Noite","4 semestres","1.210 horas","Informação incompleta"]]);
 const l=b.find(x=>x.tipo==="faq"&&x.titulo==="Informações dos campi");assert.equal(l.itens.length,2);assert.match(l.itens[0].resposta,/360 horas de estágio supervisionado obrigatório/);assert.match(l.itens[1].resposta,/O estágio supervisionado é opcional/);assert.match(l.itens[1].resposta,/10 são atividades complementares/);
 assert.deepEqual(b.slice(-2).map(x=>x.titulo),["Forma de ingresso","Mundo do Trabalho"]);assert.ok(b.at(-1).conteudo.length>500);
});
test("F7.45: atividades não comprovadas vazias, uma galeria contextual e fontes isoladas",()=>{
 assert.equal(b.find(x=>x.titulo==="Experiências e conquistas dos estudantes").conteudo,"");const g=b.filter(x=>x.tipo==="galeria");assert.equal(g.length,1);assert.deepEqual(g[0].itens,[]);
 assert.ok(b.find(x=>x.tipo==="introducao").conteudo.length<=280);assert.equal(b.find(x=>x.tipo==="faq"&&!x.titulo).itens.length,5);
 const raw=JSON.stringify(c);for(const forbidden of ["Auditoria privada","PPC 2021","PPC 2024","Samarco","ariana.almeida@ifmg.edu.br","Resolução nº 15","Mineração Integrado,","www.ifmg.edu.br/congonhas","ouropreto.ifmg.edu.br"])assert.ok(!raw.includes(forbidden),forbidden);
 const sorted=[...data.courses].sort((a,b)=>a.nome.localeCompare(b.nome,"pt-BR",{sensitivity:"base",numeric:true})||String(a.tipo||"").localeCompare(String(b.tipo||""),"pt-BR")||a.id.localeCompare(b.id,"pt-BR"));assert.deepEqual(data.courses.map(x=>x.id),sorted.map(x=>x.id));
});