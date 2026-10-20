import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const data=JSON.parse(readFileSync("data/cursos-publicados.json","utf8"));
const c=data.courses.find(x=>x.id==="conservacao-e-restauro-tecnologo"),b=c?.blocos||[];
test("F7.24: Conservação e Restauro é tecnólogo, PPC 2023 vigente, 2550h, três anos",()=>{
 assert.ok(c);assert.equal(c.nome,"Conservação e Restauro");assert.equal(c.tipo,"Tecnólogo");assert.equal(c.nivel,"Graduação");assert.deepEqual(c.campi,["Ouro Preto"]);
 const f=b[0].campos;assert.ok(f.some(x=>x.rotulo==="Carga horária"&&x.valor==="2.550 horas"));
 assert.ok(f.some(x=>x.rotulo==="Duração"&&x.valor.includes("3 anos")));
 assert.ok(!f.some(x=>x.rotulo==="PPC / matriz"));
 assert.ok(!f.some(x=>x.rotulo==="E-mail da coordenação"));
 const t=b.find(x=>x.tipo==="tabela"&&x.colunas?.[0]==="Campus");assert.deepEqual(t.linhas,[["Ouro Preto","Presencial","Noite · 3 anos","Informação incompleta"]]);
 const local=b.find(x=>x.tipo==="faq"&&x.titulo==="Informações dos campi");assert.equal(local.itens.length,1);
 assert.match(local.itens[0].resposta,/TCC é obrigatório/);assert.match(local.itens[0].resposta,/estágio é não obrigatório/);
 assert.deepEqual(b.slice(-2).map(x=>x.titulo),["Forma de ingresso","Mundo do Trabalho"]);
 assert.ok(!JSON.stringify(c).includes("Bacharelado em Conservação e Restauro"));
});
test("F7.24: três experiências reais 2025 seguidas de galerias vazias",()=>{
 const e=b.findIndex(x=>x.titulo==="Experiências e conquistas dos estudantes");assert.ok(e>=0);
 const gals=b.filter(x=>x.tipo==="galeria");assert.equal(gals.length,4);assert.ok(gals.every(x=>x.itens.length===0));
 for(const i of [e,e+2,e+4]){assert.equal(b[i].tipo,"texto");assert.equal(b[i+1].tipo,"galeria");}
 assert.match(b[e].conteudo,/fevereiro de 2025/);assert.match(b[e].conteudo,/Canteiro Experimental/);
 assert.match(b[e+2].conteudo,/março de 2025/);assert.match(b[e+2].conteudo,/fevereiro de 2025/);assert.match(b[e+2].conteudo,/Bragança/);
 assert.match(b[e+4].conteudo,/novembro de 2025/);assert.match(b[e+4].conteudo,/Caminho-Tronco/);
 const faqs=b.find(x=>x.tipo==="faq"&&!x.titulo);assert.ok(faqs.itens.length>=4);
 const sorted=[...data.courses].sort((a,b)=>a.nome.localeCompare(b.nome,"pt-BR",{sensitivity:"base",numeric:true})||String(a.tipo||"").localeCompare(String(b.tipo||""),"pt-BR")||a.id.localeCompare(b.id,"pt-BR"));
 assert.deepEqual(data.courses.map(x=>x.id),sorted.map(x=>x.id));
});
