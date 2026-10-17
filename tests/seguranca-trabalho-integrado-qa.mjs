import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const data=JSON.parse(readFileSync("data/cursos-publicados.json","utf8"));
const c=data.courses.find(x=>x.id==="tecnico-em-seguranca-do-trabalho-integrado"),b=c?.blocos||[];
test("F7.20: segurança do trabalho integrado multicampi, contato verificável e currículo não especulado",()=>{
 assert.ok(c);assert.equal(c.nome,"Técnico em Segurança do Trabalho");assert.equal(c.tipo,"Integrado");assert.deepEqual(c.campi,["Conselheiro Lafaiete","Governador Valadares","Santa Luzia"]);
 assert.ok(b[0].campos.some(x=>x.rotulo==="Carga horária total"&&x.valor.includes("Informação incompleta")));
 const tab=b.find(x=>x.tipo==="tabela"&&x.colunas?.[0]==="Campus");assert.deepEqual(tab.linhas.map(x=>x[0]),c.campi);
 assert.equal(tab.linhas[0][3],"Informação incompleta");assert.equal(tab.linhas[1][3],"coordenacao.tst.gv@ifmg.edu.br");assert.equal(tab.linhas[2][3],"Informação incompleta");
 assert.ok(!JSON.stringify(c).includes("3.275")&&!JSON.stringify(c).includes("3753")&&!JSON.stringify(c).includes("strabalho.santaluzia@ifmg.edu.br"));
 assert.deepEqual(b.slice(-2).map(x=>x.titulo),["Forma de ingresso","Mundo do Trabalho"]);
});
test("F7.20: experiências 2025-26 de GV com 3 galerias próprias, sem atribuir a novos campi",()=>{
 const exp=b.findIndex(x=>x.titulo==="Experiências e conquistas dos estudantes");assert.ok(exp>=0);
 const gals=b.filter(x=>x.tipo==="galeria");assert.equal(gals.length,4);assert.ok(gals.every(x=>x.itens.length===0));
 const texts=b.slice(exp+1).filter(x=>x.tipo==="texto"&&!x.titulo);
 assert.equal(texts.length,2);const experiences=[b[exp],...texts];
 for(const e of experiences){const idx=b.indexOf(e);assert.equal(b[idx+1].tipo,"galeria");assert.match(e.conteudo,/Governador Valadares/);}
 assert.match(experiences[0].conteudo,/2025/);assert.match(experiences[1].conteudo,/maio de 2026/);assert.match(experiences[2].conteudo,/outubro de 2026/);
 assert.equal(b.find(x=>x.tipo==="faq"&&x.titulo==="Informações dos campi").itens.length,3);assert.ok(b.find(x=>x.tipo==="faq"&&!x.titulo).itens.length>=4);
 const sorted=[...data.courses].sort((a,b)=>a.nome.localeCompare(b.nome,"pt-BR",{sensitivity:"base",numeric:true})||String(a.tipo||"").localeCompare(String(b.tipo||""),"pt-BR")||a.id.localeCompare(b.id,"pt-BR"));
 assert.deepEqual(data.courses.map(x=>x.id),sorted.map(x=>x.id));
});
