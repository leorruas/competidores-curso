import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const d=JSON.parse(readFileSync("data/cursos-publicados.json","utf8"));
const c=d.courses.find(x=>x.id==="quimica-licenciatura");
const b=c?.blocos||[];
test("F7.41: licenciatura Betim não mistura formação técnica nem propaga projeto preliminar",()=>{
 assert.ok(c);assert.equal(c.nome,"Química");assert.equal(c.nivel,"Graduação");assert.equal(c.tipo,"Licenciatura");assert.deepEqual(c.campi,["Betim"]);
 assert.ok(d.courses.some(x=>x.id==="tecnico-em-quimica-integrado"));
 assert.equal(b.length,23);assert.equal(b.filter(x=>x.tipo==="galeria").length,1);
 const bas=b.find(x=>x.tipo==="dados-basicos").campos;
 assert.ok(bas.some(x=>x.rotulo==="Duração"&&x.valor==="Informação incompleta"));
 assert.ok(bas.some(x=>x.rotulo==="Carga horária total"&&x.valor==="Informação incompleta"));
 assert.ok(bas.some(x=>x.rotulo==="E-mail da coordenação"&&x.valor==="Informação incompleta"));
 const q=b.find(x=>x.tipo==="tabela"&&x.colunas[0]==="Campus");assert.deepEqual(q.linhas,[["Betim","Presencial, com atividades a distância","Noite","Informação incompleta","Informação incompleta","Informação incompleta"]]);
 assert.equal(b.find(x=>x.tipo==="faq"&&x.titulo==="Informações dos campi").itens.length,1);
 assert.deepEqual(b.slice(-2).map(x=>x.titulo),["Forma de ingresso","Mundo do Trabalho"]);
 assert.ok(b.at(-1).conteudo.length>500);
});
test("F7.41: nenhuma conquista falsa antes da primeira turma e documentos internos não expostos",()=>{
 const i=b.findIndex(x=>x.titulo==="Experiências e conquistas dos estudantes");
 assert.ok(i>0);assert.equal(b[i].conteudo,"");assert.equal(b.filter(x=>x.titulo==="Experiências e conquistas dos estudantes").length,1);
 assert.ok(b.find(x=>x.tipo==="introducao").conteudo.length<=280);
 const fa=b.find(x=>x.tipo==="faq"&&!x.titulo);assert.equal(fa.itens.length,4);
 const cont=b.findIndex(x=>x.titulo==="Pós-graduação");assert.ok(b[cont+1].linhas.some(x=>x[0]==="Especialização em Ensino de Ciências e Matemática"&&x[1]==="Bambuí"));
 assert.doesNotMatch(JSON.stringify(c),/PCC|Resolução 63|PPC|20 vagas|40 vagas|3\\.270|405 horas|coord\\.tec\\.quimica|www2?\\.ifmg\\.edu\\.br|Consulta Pública|a coordenação deve/);
 const sorted=[...d.courses].sort((a,b)=>a.nome.localeCompare(b.nome,"pt-BR",{sensitivity:"base",numeric:true})||String(a.tipo||"").localeCompare(String(b.tipo||""),"pt-BR")||a.id.localeCompare(b.id,"pt-BR"));
 assert.deepEqual(d.courses.map(x=>x.id),sorted.map(x=>x.id));
});
