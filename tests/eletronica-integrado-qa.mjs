import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const data=JSON.parse(readFileSync("data/cursos-publicados.json","utf8"));
const c=data.courses.find(x=>x.id==="tecnico-em-eletronica-integrado");
const b=c?.blocos||[];
test("F7.8: Eletrônica Integrado Sabará segue PS2027 e não mistura subsequente",()=>{
 assert.ok(c);
 assert.deepEqual(c.campi,["Sabará"]);assert.equal(c.tipo,"Integrado");
 assert.match(c.modalidade,/16,67% EaD/);
 const tbl=b.find(x=>x.tipo==="tabela"&&x.colunas?.[0]==="Campus");
 assert.deepEqual(tbl.linhas.map(x=>x[0]),["Sabará"]);
 assert.equal(tbl.linhas[0][3],"coordeletro.sabara@ifmg.edu.br");
 const fields=b[0].campos;
 assert.ok(fields.some(x=>x.rotulo==="Carga horária total"&&x.valor==="3.250 horas"));
 assert.ok(fields.some(x=>x.rotulo==="PPC / matriz para ingressantes em 2027"&&x.valor==="Informação incompleta"));
 assert.equal(b.find(x=>x.titulo==="Continue seus estudos no IFMG").conteudo,"");
 assert.deepEqual(b.slice(-2).map(x=>x.titulo),["Forma de ingresso","Mundo do Trabalho"]);
});
test("F7.8: apenas experiências identificadas 2025+, com galeria por relato",()=>{
 const galleries=b.map((x,i)=>x.tipo==="galeria"?{...x,index:i}:null).filter(Boolean);
 assert.equal(galleries.length,4);
 assert.equal(new Set(galleries.map(x=>x.referencia)).size,4);
 assert.ok(galleries.every(x=>x.itens.length===0&&b[x.index-1].tipo==="texto"));
 const i=b.findIndex(x=>x.titulo==="Experiências e conquistas dos estudantes");
 const j=b.findIndex((x,k)=>k>i&&x.titulo==="Perguntas frequentes");
 const events=b.slice(i,j).filter(x=>x.tipo==="texto"&&x.conteudo);
 assert.equal(events.length,3);
 for(const event of events){let k=b.indexOf(event);assert.equal(b[k+1].tipo,"galeria");}
 assert.match(events[0].conteudo,/14 experimentos no total/);
 assert.match(events[1].conteudo,/Jardim Sensoriar e IFMG \+ Verde/);
 assert.match(events[2].conteudo,/Erick Albino Oliveira/);
 assert.match(events[2].conteudo,/Ana Flávia Barbosa Perdigão/);
 assert.ok(!JSON.stringify(c).includes("Destaque em Projeto de Pesquisa sem identificação"));
 const faqs=b.find(x=>x.tipo==="faq"&&!x.titulo).itens;
 assert.ok(!faqs.some(x=>/^O que (?:é|são)/i.test(x.pergunta)));
});
