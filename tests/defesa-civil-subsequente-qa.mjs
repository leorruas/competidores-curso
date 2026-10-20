import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validarEstruturaCurso} from "../scripts/validar-estrutura.mjs";
const data=JSON.parse(readFileSync("data/cursos-publicados.json","utf8"));
const c=data.courses.find(x=>x.id==="tecnico-em-defesa-civil-subsequente");
const b=c?.blocos||[];
test("F7.47: PPC novo, 20% presencial e contato de curso",()=>{
 assert.ok(c);
 assert.equal(c.tipo,"Subsequente");
 assert.deepEqual(c.campi,["Santa Luzia"]);
 assert.equal(b.length,23);
 const v=key=>b[0].campos.find(x=>x.rotulo===key)?.valor;
 assert.match(v("Carga horária"),/800 horas.*640 horas EaD e 160 horas presenciais/);
 assert.equal(v("Turno"),"Informação incompleta");
 assert.equal(v("Estágio supervisionado"),"Não obrigatório");
 assert.equal(v("E-mail da coordenação"),"ead.defesacivil.santaluzia@ifmg.edu.br");
 assert.deepEqual(validarEstruturaCurso(c),[]);
});
test("F7.47: galeria contextual, experiências vazias, segurança e catálogo alfabético",()=>{
 const exp=b.find(x=>x.titulo==="Experiências e conquistas dos estudantes");
 assert.equal(exp.conteudo,"");
 const g=b.filter(x=>x.tipo==="galeria");
 assert.equal(g.length,1);
 assert.deepEqual(g[0].itens,[]);
 assert.match(b.find(x=>x.titulo==="Aprendizagem prática").conteudo,/presenciais obrigatórias/);
 assert.deepEqual(b.slice(-2).map(x=>x.titulo),["Forma de ingresso","Mundo do Trabalho"]);
 const raw=JSON.stringify(c);
 for(const term of ["840 horas","Defesa Civil*","Benchmark/","ead.defesa.civil.santaluzia@ifmg.edu.br"])
  assert.ok(!raw.includes(term),term);
 const sorted=[...data.courses].sort((a,c)=>a.nome.localeCompare(c.nome,"pt-BR",{sensitivity:"base",numeric:true})||String(a.tipo||"").localeCompare(String(c.tipo||""),"pt-BR")||a.id.localeCompare(c.id,"pt-BR"));
 assert.deepEqual(data.courses.map(x=>x.id),sorted.map(x=>x.id));
});