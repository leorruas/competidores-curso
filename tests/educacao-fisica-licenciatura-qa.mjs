import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const data=JSON.parse(readFileSync("data/cursos-publicados.json","utf8"));
const c=data.courses.find(x=>x.id==="educacao-fisica-licenciatura"),b=c?.blocos||[];
test("F7.26: licenciatura em Educação Física Bambuí, PPC 2025, estágio e TCC",()=>{
 assert.ok(c);assert.equal(c.nome,"Educação Física");assert.equal(c.tipo,"Licenciatura");assert.deepEqual(c.campi,["Bambuí"]);
 const f=b[0].campos;assert.equal(f.find(x=>x.rotulo==="Carga horária").valor,"3.270 horas");
 assert.equal(f.find(x=>x.rotulo==="E-mail da coordenação")?.valor,undefined);
 assert.match(JSON.stringify(b),/400 horas/);assert.match(JSON.stringify(b),/TCC/);
 assert.deepEqual(b.slice(-2).map(x=>x.titulo),["Forma de ingresso","Mundo do Trabalho"]);
 const t=b.find(x=>x.tipo==="tabela"&&x.colunas?.[0]==="Campus");assert.equal(t.linhas.length,1);assert.equal(t.linhas[0][0],"Bambuí");
});
test("F7.26: quatro experiências verificadas desde 2025, cada uma seguida de galeria",()=>{
 const e=b.findIndex(x=>x.titulo==="Experiências e conquistas dos estudantes");assert.ok(e>0);
 for(const i of [e,e+2,e+4,e+6]){assert.equal(b[i].tipo,"texto");assert.equal(b[i+1].tipo,"galeria");assert.equal(b[i+1].itens.length,0);}
 assert.equal(b.filter(x=>x.tipo==="galeria").length,5);
 const sorted=[...data.courses].sort((a,b)=>a.nome.localeCompare(b.nome,"pt-BR",{sensitivity:"base",numeric:true})||String(a.tipo||"").localeCompare(String(b.tipo||""),"pt-BR")||a.id.localeCompare(b.id,"pt-BR"));
 assert.deepEqual(data.courses.map(x=>x.id),sorted.map(x=>x.id));
});
