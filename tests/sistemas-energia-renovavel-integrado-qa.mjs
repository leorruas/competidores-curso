import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const data=JSON.parse(readFileSync("data/cursos-publicados.json","utf8"));
const c=data.courses.find(x=>x.id==="tecnico-em-sistemas-de-energia-renovavel-integrado"), b=c?.blocos||[];
test("F7.19: Sistemas de Energia Renovável integrado Ibirité usa PPC 2026 e oferta 2027",()=>{
 assert.ok(c);assert.equal(c.nome,"Técnico em Sistemas de Energia Renovável");assert.equal(c.tipo,"Integrado");assert.deepEqual(c.campi,["Ibirité"]);
 assert.ok(b[0].campos.some(x=>x.rotulo==="Carga horária"&&x.valor==="3.200 horas"));
 assert.ok(b[0].campos.some(x=>x.rotulo==="Duração"&&x.valor==="3 anos"));
 assert.ok(b[0].campos.some(x=>x.rotulo==="Modalidade"&&x.valor.includes("8,3% EaD")));
 const t=b.find(x=>x.tipo==="tabela"&&x.colunas?.[0]==="Campus");assert.deepEqual(t.linhas,[["Ibirité","Presencial (8,3% EaD)","Manhã e tarde","energia.ibirite@ifmg.edu.br"]]);
 assert.equal(b.find(x=>x.titulo==="Continue seus estudos no IFMG").conteudo,"");assert.deepEqual(b.slice(-2).map(x=>x.titulo),["Forma de ingresso","Mundo do Trabalho"]);
 const f=b.find(x=>x.tipo==="faq"&&!x.titulo);assert.ok(f.itens.some(x=>/estágio obrigatório/.test(x.pergunta)&&/não obrigatório/.test(x.resposta)));
 assert.ok(f.itens.some(x=>/TCC/.test(x.pergunta)&&/Trabalho Prático Final obrigatório/.test(x.resposta)));
});
test("F9.4: visita curricular não preenche conquistas nem gera tarefa de galeria",()=>{
 const e=b.findIndex(x=>x.titulo==="Experiências e conquistas dos estudantes");assert.ok(e>0);
 assert.equal(b[e].conteudo,"");assert.equal(b[e+1].titulo,"Perguntas frequentes");
 assert.equal(b.filter(x=>x.titulo==="Experiências e conquistas dos estudantes").length,1);
 assert.ok(!b.some(x=>x.tipo==="galeria"&&/Sabará|Darcy|formação do povo brasileiro/i.test(x.referencia||"")));
 assert.ok(!JSON.stringify(c).includes("Darcy Ribeiro"));
 assert.ok(b.some(x=>x.titulo==="Aprendizagem prática"&&/Trabalho Prático Final de 50 horas/.test(x.conteudo)));
 assert.ok(!JSON.stringify(c).includes("Canguru")&&!JSON.stringify(c).includes("Auditoria privada"));
 assert.ok(b.find(x=>x.tipo==="faq"&&x.titulo==="Informações dos campi").itens.length===1);
 const sorted=[...data.courses].sort((a,b)=>a.nome.localeCompare(b.nome,"pt-BR",{sensitivity:"base",numeric:true})||String(a.tipo||"").localeCompare(String(b.tipo||""),"pt-BR")||a.id.localeCompare(b.id,"pt-BR"));
 assert.deepEqual(data.courses.map(x=>x.id),sorted.map(x=>x.id));
});
