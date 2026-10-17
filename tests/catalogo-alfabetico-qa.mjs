import test from "node:test";import assert from "node:assert/strict";import {readFileSync} from "node:fs";
const d=JSON.parse(readFileSync("data/cursos-publicados.json","utf8"));
test("Catálogo em ordem alfabética do português, independente da ordem de cadastro",()=>{
 const sorted=[...d.courses].sort((a,b)=>a.nome.localeCompare(b.nome,"pt-BR",{sensitivity:"base",numeric:true}) || String(a.tipo||"").localeCompare(String(b.tipo||""),"pt-BR") || a.id.localeCompare(b.id,"pt-BR"));
 assert.deepEqual(d.courses.map(x=>x.id),sorted.map(x=>x.id));
});
test("O título de curso não repete a modalidade Integrado; identificação técnica continua em campo separado",()=>{
 for(const c of d.courses){assert.doesNotMatch(c.nome,/\bIntegrado\b/i,c.id);assert.ok(c.tipo,c.id+": modalidade não pode desaparecer");}
 const c=d.courses.find(x=>x.id==="tecnico-em-administracao-integrado");
 assert.equal(c.nome,"Técnico em Administração");assert.equal(c.tipo,"Integrado");
 assert.ok(c.blocos.some(b=>b.titulo==="Técnico em Administração"));
 assert.ok(c.blocos.some(b=>b.titulo==="Onde o IFMG oferece Técnico em Administração"));
});
