import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const data=JSON.parse(readFileSync("data/cursos-publicados.json","utf8"));
const c=data.courses.find(x=>x.id==="ciencias-biologicas-licenciatura"),b=c?.blocos||[];
test("F7.23: Ciências Biológicas Licenciatura reúne Bambuí e SJE sem inventar currículo de 2027",()=>{
 assert.ok(c);assert.equal(c.nome,"Ciências Biológicas");assert.equal(c.tipo,"Licenciatura");assert.equal(c.nivel,"Graduação");assert.deepEqual(c.campi,["Bambuí","São João Evangelista"]);
 const fields=b[0].campos;assert.ok(fields.some(x=>x.rotulo==="Duração"&&x.valor.includes("Informação incompleta")));
 assert.ok(fields.some(x=>x.rotulo==="Carga horária"&&x.valor.includes("Informação incompleta")));
 assert.ok(!fields.some(x=>x.rotulo==="PPC / matriz"));
 const t=b.find(x=>x.tipo==="tabela"&&x.colunas?.[0]==="Campus");assert.deepEqual(t.linhas,[["Bambuí","Presencial","Noite","Informação incompleta"],["São João Evangelista","Presencial","Noite","Informação incompleta"]]);
 assert.equal(b.find(x=>x.tipo==="faq"&&x.titulo==="Informações dos campi").itens.length,2);
 assert.deepEqual(b.slice(-2).map(x=>x.titulo),["Forma de ingresso","Mundo do Trabalho"]);
});
test("F9.4: PIBID Bambuí preservado, sem anúncio de banca tratado como conquista",()=>{
 const i=b.findIndex(x=>x.titulo==="Experiências e conquistas dos estudantes");
 assert.ok(i>=0);
 assert.equal(b[i].conteudo, "");
 assert.equal(b[i+1].titulo,"Perguntas frequentes");
 assert.match(b.find(x=>x.titulo==="Pesquisa, extensão e oportunidades").conteudo,/23 e 24 de setembro de 2025/);
 assert.ok(!b.some(x=>x.tipo==="galeria"&&/Campanha de Valorização/.test(x.referencia||"")));
 assert.doesNotMatch(JSON.stringify(c),/Divulgação de defesa pública de TCC|8 de janeiro de 2026/);
 assert.ok(!JSON.stringify(c).includes("anderson.melo@ifmg.edu.br")&&!JSON.stringify(c).includes("lic.biologicas.sje@ifmg.edu.br"));
 const sorted=[...data.courses].sort((a,b)=>a.nome.localeCompare(b.nome,"pt-BR",{sensitivity:"base",numeric:true})||String(a.tipo||"").localeCompare(String(b.tipo||""),"pt-BR")||a.id.localeCompare(b.id,"pt-BR"));
 assert.deepEqual(data.courses.map(x=>x.id),sorted.map(x=>x.id));
});
