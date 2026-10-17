import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const data=JSON.parse(readFileSync("data/cursos-publicados.json","utf8"));
const c=data.courses.find(x=>x.id==="tecnico-em-agrimensura-integrado"),b=c?.blocos||[];
test("F7.16: Agrimensura integrado SJE tem oferta 2027, nome curto e dados não inventados",()=>{
 assert.ok(c);assert.equal(c.nome,"Técnico em Agrimensura");assert.equal(c.tipo,"Integrado");assert.deepEqual(c.campi,["São João Evangelista"]);
 const t=b.find(x=>x.tipo==="tabela"&&x.colunas?.[0]==="Campus");assert.deepEqual(t.linhas.map(x=>x[0]),c.campi);assert.equal(t.linhas[0][3],"Informação incompleta");
 for(const label of ["Duração","Carga horária total","PPC / matriz dos ingressantes em 2027","E-mail da coordenação"])assert.ok(b[0].campos.some(x=>x.rotulo===label&&x.valor==="Informação incompleta"),label);
 assert.ok(!JSON.stringify(c).includes("ctas.sje@ifmg.edu.br"));assert.ok(!JSON.stringify(c).includes("agrimensura.sje@ifmg.edu.br"));
 assert.equal(b.find(x=>x.titulo==="Continue seus estudos no IFMG").conteudo,"");assert.deepEqual(b.slice(-2).map(x=>x.titulo),["Forma de ingresso","Mundo do Trabalho"]);
});
test("F7.16: experiências não comprovadas permanecem vazias e catálogo alfabético",()=>{
 assert.equal(b.find(x=>x.titulo==="Experiências e conquistas dos estudantes").conteudo,"");
 const gal=b.filter(x=>x.tipo==="galeria");assert.equal(gal.length,1);assert.equal(gal[0].itens.length,0);
 assert.ok(b.find(x=>x.tipo==="faq"&&x.titulo==="Informações dos campi").itens.length===1);
 assert.ok(b.find(x=>x.tipo==="faq"&&!x.titulo).itens.every(x=>!/^O que (é|são)/i.test(x.pergunta)));
 assert.ok(!JSON.stringify(c).includes("Auditoria privada"));
 const sorted=[...data.courses].sort((a,b)=>a.nome.localeCompare(b.nome,"pt-BR",{sensitivity:"base",numeric:true})||String(a.tipo||"").localeCompare(String(b.tipo||""),"pt-BR")||a.id.localeCompare(b.id,"pt-BR"));
 assert.deepEqual(data.courses.map(x=>x.id),sorted.map(x=>x.id));
});
