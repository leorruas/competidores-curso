import test from "node:test";import assert from "node:assert/strict";import {readFileSync} from "node:fs";const data=JSON.parse(readFileSync("data/cursos-publicados.json","utf8"));const c=data.courses.find(x=>x.id==="tecnico-em-meio-ambiente-integrado"),b=c?.blocos||[];
test("F7.13: Meio Ambiente Integrado diferencia GV e nova oferta Santa Luzia",()=>{
 assert.ok(c);assert.deepEqual(c.campi,["Governador Valadares","Santa Luzia"]);assert.equal(c.tipo,"Integrado");
 const t=b.find(x=>x.tipo==="tabela"&&x.colunas?.[0]==="Campus");assert.deepEqual(t.linhas.map(x=>x[0]),c.campi);
 assert.equal(t.linhas[0][3],"coordenacao.tma.gv@ifmg.edu.br");assert.equal(t.linhas[1][3],"Informação incompleta");
 assert.match(t.linhas[1][1],/10,73% EaD/);assert.ok(!/EaD/.test(t.linhas[0][1]));
 const basic=b[0].campos;assert.ok(basic.some(x=>x.rotulo==="Carga horária"&&x.valor==="Informação incompleta"));
 assert.ok(!JSON.stringify(c).includes("strabalho.santaluzia@ifmg.edu.br"));
 assert.ok(!JSON.stringify(c).includes("curso-tecnico-integrado-em-seguranca-do-trabalho"));
 assert.ok(!JSON.stringify(c).includes("3.420 horas"));
 assert.equal(b.find(x=>x.titulo==="Continue seus estudos no IFMG").conteudo,"");
 assert.deepEqual(b.slice(-2).map(x=>x.titulo),["Forma de ingresso","Mundo do Trabalho"]);
});
test("F9.4: prêmio da Jornada de Foguetes sem visita técnica na seção de conquistas",()=>{
 const i=b.findIndex(x=>x.titulo==="Experiências e conquistas dos estudantes");
 assert.ok(i>0);
 assert.match(b[i].conteudo,/troféu de campeão/);
 assert.match(b[i].conteudo,/209 metros/);
 assert.match(b[i].conteudo,/Governador Valadares/);
 assert.equal(b[i+1].titulo,"Perguntas frequentes");
 assert.equal(b.filter(x=>x.tipo==="galeria").length,1);
 assert.doesNotMatch(JSON.stringify(c),/Visita à Usina Hidrelétrica de Baguari/);
 assert.ok(b.find(x=>x.tipo==="faq"&&!x.titulo).itens.every(x=>!/^O que (é|são)/i.test(x.pergunta)));
});
