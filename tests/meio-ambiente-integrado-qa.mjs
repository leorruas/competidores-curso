import test from "node:test";import assert from "node:assert/strict";import {readFileSync} from "node:fs";const data=JSON.parse(readFileSync("data/cursos-publicados.json","utf8"));const c=data.courses.find(x=>x.id==="tecnico-em-meio-ambiente-integrado"),b=c?.blocos||[];
test("F7.13: Meio Ambiente Integrado diferencia GV e nova oferta Santa Luzia",()=>{
 assert.ok(c);assert.deepEqual(c.campi,["Governador Valadares","Santa Luzia"]);assert.equal(c.tipo,"Integrado");
 const t=b.find(x=>x.tipo==="tabela"&&x.colunas?.[0]==="Campus");assert.deepEqual(t.linhas.map(x=>x[0]),c.campi);
 assert.equal(t.linhas[0][3],"coordenacao.tma.gv@ifmg.edu.br");assert.equal(t.linhas[1][3],"Informação incompleta");
 assert.match(t.linhas[1][1],/10,73% EaD/);assert.ok(!/EaD/.test(t.linhas[0][1]));
 const basic=b[0].campos;assert.ok(basic.some(x=>x.rotulo==="Carga horária total"&&x.valor==="Informação incompleta"));
 assert.ok(!JSON.stringify(c).includes("strabalho.santaluzia@ifmg.edu.br"));
 assert.ok(!JSON.stringify(c).includes("curso-tecnico-integrado-em-seguranca-do-trabalho"));
 assert.ok(!JSON.stringify(c).includes("3.420 horas"));
 assert.equal(b.find(x=>x.titulo==="Continue seus estudos no IFMG").conteudo,"");
 assert.deepEqual(b.slice(-2).map(x=>x.titulo),["Forma de ingresso","Mundo do Trabalho"]);
});
test("F7.13: somente duas experiências verificáveis 2025 em GV, com galerias separadas",()=>{
 const g=b.map((x,i)=>x.tipo==="galeria"?{...x,i}:null).filter(Boolean);
 assert.equal(g.length,3);assert.equal(new Set(g.map(x=>x.referencia)).size,3);
 assert.ok(g.every(x=>Array.isArray(x.itens)&&x.itens.length===0&&b[x.i-1].tipo==="texto"));
 const i=b.findIndex(x=>x.titulo==="Experiências e conquistas dos estudantes"),j=b.findIndex((x,k)=>k>i&&x.titulo==="Perguntas frequentes");
 const ex=b.slice(i,j).filter(x=>x.tipo==="texto"&&x.conteudo);
 assert.equal(ex.length,2);assert.ok(ex.every(x=>b[b.indexOf(x)+1].tipo==="galeria"));
 assert.match(ex[0].conteudo,/209 metros/);assert.match(ex[0].conteudo,/2025/);
 assert.match(ex[1].conteudo,/Baguari/);assert.match(ex[1].conteudo,/Edificações/);assert.match(ex[1].conteudo,/Engenharia Ambiental e Sanitária/);
 assert.ok(ex.every(x=>!x.includes("Santa Luzia")));
 assert.ok(b.find(x=>x.tipo==="faq"&&!x.titulo).itens.every(x=>!/^O que (é|são)/i.test(x.pergunta)));
});
