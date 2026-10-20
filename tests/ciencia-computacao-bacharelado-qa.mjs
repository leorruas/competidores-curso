import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const data=JSON.parse(readFileSync("data/cursos-publicados.json","utf8"));
const c=data.courses.find(x=>x.id==="ciencia-da-computacao-bacharelado"),b=c?.blocos||[];
test("F7.22: Ciência da Computação Bacharelado separa Formiga e Ibirité",()=>{
 assert.ok(c);assert.equal(c.nome,"Ciência da Computação");assert.equal(c.tipo,"Bacharelado");assert.deepEqual(c.campi,["Formiga","Ibirité"]);
 const campos=b[0].campos;assert.ok(campos.some(z=>z.rotulo==="Carga horária"&&z.valor.includes("3.205")&&z.valor.includes("Informação incompleta")));
 const t=b.find(x=>x.tipo==="tabela"&&x.colunas?.[0]==="Campus");assert.deepEqual(t.linhas.map(x=>x[0]),c.campi);
 assert.match(t.linhas[0][2],/Manhã e tarde/);assert.match(t.linhas[1][2],/Noite/);assert.match(t.linhas[1][1],/38,3% EaD/);
 assert.equal(t.linhas[0][3],"coord.ccomp.formiga@ifmg.edu.br");assert.equal(t.linhas[1][3],"Informação incompleta");
 const f=b.find(x=>x.tipo==="faq"&&x.titulo==="Informações dos campi");assert.equal(f.itens.length,2);assert.match(f.itens[1].resposta,/TCC.*obrigatório/);assert.match(f.itens[1].resposta,/estágio.*não obrigatório/);
 assert.deepEqual(b.slice(-2).map(x=>x.titulo),["Forma de ingresso","Mundo do Trabalho"]);
});
test("F7.22: duas agendas de TCC com galerias próprias, sem resultados inventados",()=>{
 const e=b.findIndex(x=>x.titulo==="Experiências e conquistas dos estudantes");assert.ok(e>0);
 assert.equal(b.filter(x=>x.tipo==="galeria").length,3);assert.ok(b.filter(x=>x.tipo==="galeria").every(x=>x.itens.length===0));
 assert.match(b[e].conteudo,/abril de 2025/);assert.equal(b[e+1].tipo,"galeria");assert.match(b[e+1].referencia,/Formiga/);
 assert.match(b[e+2].conteudo,/julho de 2026/);assert.equal(b[e+3].tipo,"galeria");assert.match(b[e+3].referencia,/Formiga/);
 assert.ok(!/premiad|aprovado|conquistou|implantado no polo/i.test(b[e].conteudo+" "+b[e+2].conteudo));
 assert.ok(!JSON.stringify(c).includes("eng.controle.automacao.ibirite@ifmg.edu.br"));
 const sorted=[...data.courses].sort((a,b)=>a.nome.localeCompare(b.nome,"pt-BR",{sensitivity:"base",numeric:true})||String(a.tipo||"").localeCompare(String(b.tipo||""),"pt-BR")||a.id.localeCompare(b.id,"pt-BR"));
 assert.deepEqual(data.courses.map(x=>x.id),sorted.map(x=>x.id));
});
