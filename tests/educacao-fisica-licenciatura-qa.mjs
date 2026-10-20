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
test("F9.4: três resultados estudantis concretos, sem semana acadêmica genérica",()=>{
 const e=b.findIndex(x=>x.titulo==="Experiências e conquistas dos estudantes");
 assert.ok(e>0);
 for(const i of [e,e+2,e+4]){
  assert.equal(b[i].tipo,"texto");
  assert.equal(b[i+1].tipo,"galeria");
  assert.equal(b[i+1].itens.length,0);
 }
 assert.equal(b[e+6].titulo,"Perguntas frequentes");
 assert.equal(b.filter(x=>x.tipo==="galeria").length,4);
 assert.match(b[e].conteudo,/artigo/);
 assert.match(b[e+2].conteudo,/Onde estão as meninas/);
 assert.match(b[e+4].conteudo,/ensino de lutas/);
 assert.doesNotMatch(JSON.stringify(c),/Semana da Educação Física 2026|3ª Semana da Educação Física/);
 const sorted=[...data.courses].sort((a,b)=>a.nome.localeCompare(b.nome,"pt-BR",{sensitivity:"base",numeric:true})||String(a.tipo||"").localeCompare(String(b.tipo||""),"pt-BR")||a.id.localeCompare(b.id,"pt-BR"));
 assert.deepEqual(data.courses.map(x=>x.id),sorted.map(x=>x.id));
});
