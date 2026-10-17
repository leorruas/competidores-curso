import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const data=JSON.parse(readFileSync("data/cursos-publicados.json","utf8"));
const c=data.courses.find(x=>x.id==="fisica-licenciatura"),b=c?.blocos||[];
test("F7.31: Física licenciatura multicampi e PPCs de 2023/2026",()=>{
 assert.ok(c);assert.equal(c.nome,"Física");assert.equal(c.tipo,"Licenciatura");
 assert.deepEqual(c.campi,["Bambuí","Congonhas","Ouro Preto"]);
 const table=b.find(x=>x.tipo==="tabela"&&x.colunas[0]==="Campus");
 assert.deepEqual(table.linhas.map(x=>x[0]),c.campi);
 assert.equal(table.linhas[0][4],"Informação incompleta");
 assert.equal(table.linhas[0][5],"Informação incompleta");
 assert.equal(table.linhas[1][4],"3.220 horas");
 assert.equal(table.linhas[1][5],"lic.fisica.congonhas@ifmg.edu.br");
 assert.equal(table.linhas[2][4],"3.225 horas");
 assert.equal(table.linhas[2][5],"Informação incompleta");
 assert.match(table.linhas[2][2],/12,1%/);
 const local=b.find(x=>x.tipo==="faq"&&x.titulo==="Informações dos campi");
 assert.equal(local.itens.length,3);
 assert.match(local.itens[1].resposta,/400 horas/);
 assert.match(local.itens[1].resposta,/TCC é obrigatório/);
 assert.match(local.itens[2].resposta,/400 horas/);
 assert.match(local.itens[2].resposta,/150 horas/);
 assert.match(local.itens[2].resposta,/TCC I/);
 assert.deepEqual(b.slice(-2).map(x=>x.titulo),["Forma de ingresso","Mundo do Trabalho"]);
});
test("F7.31: experiência 2025-2026 e galeria específica sem inventar participação",()=>{
 const i=b.findIndex(x=>x.titulo==="Experiências e conquistas dos estudantes");
 assert.ok(i>0);
 for(const j of [i,i+2,i+4]){assert.equal(b[j].tipo,"texto");assert.equal(b[j+1].tipo,"galeria");assert.deepEqual(b[j+1].itens,[]);}
 assert.match(b[i].conteudo,/59 bolsistas em conjunto/);
 assert.match(b[i+2].conteudo,/Centro de Ciências/);
 assert.match(b[i+4].conteudo,/setembro de 2025/);
 assert.equal(b.filter(x=>x.tipo==="galeria").length,6);
 assert.equal(b.filter(x=>x.titulo==="Experiências e conquistas dos estudantes").length,1);
 assert.deepEqual(data.courses.map(x=>x.id),[...data.courses].sort((a,b)=>a.nome.localeCompare(b.nome,"pt-BR",{sensitivity:"base",numeric:true})||String(a.tipo||"").localeCompare(String(b.tipo||""),"pt-BR")||a.id.localeCompare(b.id,"pt-BR")).map(x=>x.id));
});
