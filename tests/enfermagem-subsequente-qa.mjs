import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validarEstruturaCurso} from "../scripts/validar-estrutura.mjs";
const data=JSON.parse(readFileSync("data/cursos-publicados.json","utf8"));
const c=data.courses.find(x=>x.id==="tecnico-em-enfermagem-subsequente");
const b=c?.blocos||[];
const field=r=>b[0].campos.find(x=>x.rotulo===r)?.valor;
const section=t=>b.find(x=>x.tipo==="texto"&&x.titulo===t);
test("F7.49: curso novo é subsequente Piumhi, noturno presencial e piso 1200h",()=>{
 assert.ok(c);assert.equal(c.nome,"Técnico em Enfermagem");
 assert.equal(c.tipo,"Subsequente");assert.deepEqual(c.campi,["Piumhi"]);
 assert.equal(c.modalidade,"Presencial");
 assert.equal(field("Turno"),"Noite");
 assert.equal(field("Duração prevista"),"2 anos (4 semestres)");
 assert.match(field("Carga horária da formação"),/Mínimo de 1.200 horas/);
 assert.match(field("Carga horária da formação"),/Informação incompleta/);
 assert.equal(field("Estágio supervisionado"),"Informação incompleta");
 assert.equal(field("E-mail da coordenação"),"Informação incompleta");
 assert.equal(b.length,23);
 assert.deepEqual(validarEstruturaCurso(c),[]);
});
test("F7.49: experiência vazia e galeria contextual com requisitos Wagtail",()=>{
 assert.equal(section("Experiências e conquistas dos estudantes").conteudo,"");
 const g=b.filter(x=>x.tipo==="galeria");assert.equal(g.length,1);
 assert.deepEqual(g[0].itens,[]);
 assert.equal(b[b.indexOf(g[0])-1].titulo,"Aprendizagem prática");
 assert.deepEqual(b.slice(-2).map(x=>x.titulo),["Forma de ingresso","Mundo do Trabalho"]);
 assert.ok(b.at(-1).conteudo.length>500);
});
test("F7.49: não converter PCC provisório em PPC e não inventar bacharelado",()=>{
 const raw=JSON.stringify(c);
 for(const forbidden of ["1.600 horas","400 horas de estágio","400h de estágio","de.piumhi@ifmg.edu.br","PCC","Resolução CONSUP","Bacharelado em Enfermagem","20% da carga horária","aula inaugural","2026/1"]){
  assert.ok(!raw.includes(forbidden),forbidden);
 }
 assert.match(section("Mundo do Trabalho").conteudo,/Coren/);
 assert.match(section("Mundo do Trabalho").conteudo,/supervisão de enfermeiro/);
 assert.ok(b.find(x=>x.tipo==="introducao").conteudo.length<=280);
 const sorted=[...data.courses].sort((a,z)=>a.nome.localeCompare(z.nome,"pt-BR",{sensitivity:"base",numeric:true})||String(a.tipo||"").localeCompare(String(z.tipo||""),"pt-BR")||a.id.localeCompare(z.id,"pt-BR"));
 assert.deepEqual(data.courses.map(x=>x.id),sorted.map(x=>x.id));
});