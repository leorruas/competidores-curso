import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const {courses}=JSON.parse(readFileSync("data/cursos-publicados.json","utf8"));
const c=courses.find(x=>x.id==="tecnico-em-mecanica-integrado");
const b=c?.blocos||[];
test("F7.4: Técnico em Mecânica Integrado agrupa os quatro campi da matriz 2027",()=>{
 assert.ok(c);
 assert.deepEqual(c.campi,["Arcos","Betim","Congonhas","Conselheiro Lafaiete"]);
 assert.equal(c.tipo,"Integrado");
 assert.match(c.modalidade,/Arcos: 6% EaD/);
 const t=b.find(x=>x.tipo==="tabela"&&x.colunas?.[0]==="Campus");
 assert.deepEqual(t.linhas.map(r=>r[0]),c.campi);
 assert.deepEqual(t.linhas.map(r=>r[3]),["tec.mecanica.arcos@ifmg.edu.br","coord.tec.mecanica@ifmg.edu.br","coordtecmec.congonhas@ifmg.edu.br","coord.meccl@ifmg.edu.br"]);
 const local=b.find(x=>x.tipo==="faq"&&x.titulo==="Informações dos campi");
 assert.equal(local.itens.length,4);
 assert.ok(b.some(x=>x.tipo==="faq"&&!x.titulo));
});
test("F9.3: Mecânica Integrado preserva apenas galeria pertinente de práticas",()=>{
 const gs=b.filter(x=>x.tipo==="galeria");
 assert.equal(gs.length,1);
 assert.equal(new Set(gs.map(x=>x.referencia)).size,1);
 assert.ok(gs.every(x=>Array.isArray(x.itens)&&x.itens.length===0));
 for(const ix of b.map((x,i)=>x.tipo==="galeria"?i:-1).filter(i=>i>=0))assert.equal(b[ix-1].tipo,"texto");
 assert.equal(b.find(x=>x.titulo==="Experiências e conquistas dos estudantes").conteudo,"Informação incompleta");
 assert.ok(!b.some(x=>x.tipo==="texto"&&/João Lucas Vieira Campos/.test(x.conteudo||"")));
 assert.ok(!b.some(x=>x.tipo==="texto"&&/27 de fevereiro de 2026/.test(x.conteudo||"")));
 assert.deepEqual(b.slice(-2).map(x=>x.titulo),["Forma de ingresso","Mundo do Trabalho"]);
});
