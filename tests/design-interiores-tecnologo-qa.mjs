import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const data=JSON.parse(readFileSync("data/cursos-publicados.json","utf8"));
const c=data.courses.find(x=>x.id==="design-de-interiores-tecnologo"),b=c?.blocos||[];
test("F7.25: Design de Interiores é tecnólogo, PPC 2025, 1690h, 3 anos, 11,54% EaD",()=>{
 assert.ok(c);assert.equal(c.nome,"Design de Interiores");assert.equal(c.tipo,"Tecnólogo");assert.equal(c.nivel,"Graduação");assert.deepEqual(c.campi,["Santa Luzia"]);
 const f=b[0].campos;assert.ok(f.some(x=>x.rotulo==="Carga horária"&&x.valor==="1.690 horas"));
 assert.ok(f.some(x=>x.rotulo==="Duração"&&x.valor.includes("3 anos")));
 assert.ok(f.some(x=>x.rotulo==="PPC / matriz"&&x.valor.includes("2025")));
 assert.ok(f.some(x=>x.rotulo==="Modalidade"&&x.valor.includes("11,54% EaD")));
 assert.equal(f.find(x=>x.rotulo==="E-mail da coordenação").valor,"des.interiores.santaluzia@ifmg.edu.br");
 const tab=b.find(x=>x.tipo==="tabela"&&x.colunas?.[0]==="Campus");assert.deepEqual(tab.linhas,[["Santa Luzia","Presencial (11,54% EaD na oferta de 2027)","Noite · 3 anos","des.interiores.santaluzia@ifmg.edu.br"]]);
 const faq=b.find(x=>x.tipo==="faq"&&x.titulo==="Informações dos campi");assert.equal(faq.itens.length,1);assert.match(faq.itens[0].resposta,/TCC é obrigatório \(90 horas\)/);assert.match(faq.itens[0].resposta,/estágio é não obrigatório/);
 assert.deepEqual(b.slice(-2).map(x=>x.titulo),["Forma de ingresso","Mundo do Trabalho"]);
 assert.ok(!JSON.stringify(c).includes("1.740 horas")&&!JSON.stringify(c).includes("TCC é obrigatório (120"));
});
test("F7.25: catálogo Laboratório Verde de 2025 como experiência comprovada, com galeria própria",()=>{
 const i=b.findIndex(x=>x.titulo==="Experiências e conquistas dos estudantes");assert.ok(i>0);
 assert.match(b[i].conteudo,/outubro de 2025/);assert.match(b[i].conteudo,/Laboratório Verde/);assert.match(b[i].conteudo,/bolsista/);assert.match(b[i].conteudo,/voluntário/);
 assert.equal(b[i+1].tipo,"galeria");assert.match(b[i+1].referencia,/Laboratório Verde/);
 const galleries=b.filter(x=>x.tipo==="galeria");assert.equal(galleries.length,2);assert.ok(galleries.every(x=>x.itens.length===0));
 assert.ok(b.find(x=>x.tipo==="faq"&&!x.titulo).itens.length>=4);
 const sorted=[...data.courses].sort((a,b)=>a.nome.localeCompare(b.nome,"pt-BR",{sensitivity:"base",numeric:true})||String(a.tipo||"").localeCompare(String(b.tipo||""),"pt-BR")||a.id.localeCompare(b.id,"pt-BR"));
 assert.deepEqual(data.courses.map(x=>x.id),sorted.map(x=>x.id));
});
