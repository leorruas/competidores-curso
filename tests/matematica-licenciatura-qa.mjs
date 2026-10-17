import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const data=JSON.parse(readFileSync("data/cursos-publicados.json","utf8"));
const c=data.courses.find(x=>x.id==="matematica-licenciatura");
const b=c?.blocos||[];

test("F7.38: Matemática multicampi diferencia Formiga de São João Evangelista",()=>{
 assert.ok(c);
 assert.equal(c.nome,"Matemática");
 assert.equal(c.tipo,"Licenciatura");
 assert.deepEqual(c.campi,["Formiga","São João Evangelista"]);
 const basic=b.find(x=>x.tipo==="dados-basicos").campos;
 assert.ok(basic.some(x=>x.rotulo==="Carga horária total"&&x.valor==="Informação incompleta para as matrizes de 2027"));
 const table=b.find(x=>x.tipo==="tabela"&&x.colunas[0]==="Campus");
 assert.deepEqual(table.linhas,[
 ["Formiga","Presencial (25% EaD na oferta de 2027)","Noite","8 semestres","Informação incompleta","matematica.formiga@ifmg.edu.br"],
 ["São João Evangelista","Presencial","Noite","8 semestres","Informação incompleta","lic.matematica.sje@ifmg.edu.br"]
 ]);
 const local=b.find(x=>x.tipo==="faq"&&x.titulo==="Informações dos campi");
 assert.equal(local.itens.length,2);
 assert.match(local.itens[0].resposta,/25% de atividades EaD/);
 assert.match(local.itens[0].resposta,/Formiga|campus|graduação/i);
 assert.match(local.itens[1].resposta,/São João Evangelista|campus|graduação/i);
 const faq=b.find(x=>x.tipo==="faq"&&!x.titulo);
 assert.equal(faq.itens.length,4);
 assert.match(faq.itens[1].resposta,/estágio supervisionado obrigatório/);
 assert.match(faq.itens[1].resposta,/podem exigir disponibilidade fora do período noturno/);
 assert.ok(b.find(x=>x.tipo==="introducao").conteudo.length<=280);
 assert.deepEqual(b.slice(-2).map(x=>x.titulo),["Forma de ingresso","Mundo do Trabalho"]);
 assert.ok(b.at(-1).conteudo.length>500);
});

test("F7.38: experiências comprovadas, três galerias e auditoria privada isolada",()=>{
 assert.equal(b.length,26);
 assert.equal(b.filter(x=>x.tipo==="galeria").length,3);
 assert.equal(b.filter(x=>x.titulo==="Experiências e conquistas dos estudantes").length,1);
 const i=b.findIndex(x=>x.titulo==="Experiências e conquistas dos estudantes");
 assert.ok(i>0);
 for(const k of [i,i+2]){
  assert.equal(b[k].tipo,"texto");
  assert.equal(b[k+1].tipo,"galeria");
  assert.deepEqual(b[k+1].itens,[]);
 }
 assert.match(b[i].conteudo,/julho de 2026/);
 assert.match(b[i].conteudo,/escolas da cidade/);
 assert.match(b[i+2].conteudo,/junho de 2026/);
 assert.match(b[i+2].conteudo,/Encontro Institucional/);
 const p=b.findIndex(x=>x.titulo==="Pós-graduação");
 assert.ok(b[p+1].linhas.some(x=>x[0]==="Especialização em Educação Matemática e suas Tecnologias"&&x[1]==="São João Evangelista (EaD)"));
 assert.ok(b[p+1].linhas.some(x=>x[0]==="Especialização em Educação Matemática"&&x[1]==="Sabará"));
 const txt=JSON.stringify(c);
 assert.doesNotMatch(txt,/Auditoria privada|Mineirando Medalhas|PPC Formiga|2\.805|3\.305|3\.210|www2?\.ifmg\.edu\.br/);
 assert.deepEqual(data.courses.map(x=>x.id),[...data.courses].sort((a,b)=>a.nome.localeCompare(b.nome,"pt-BR",{sensitivity:"base",numeric:true})||String(a.tipo||"").localeCompare(String(b.tipo||""),"pt-BR")||a.id.localeCompare(b.id,"pt-BR")).map(x=>x.id));
});
