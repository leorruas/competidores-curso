import test from "node:test";import assert from "node:assert/strict";import {readFileSync} from "node:fs";const data=JSON.parse(readFileSync("data/cursos-publicados.json","utf8"));const c=data.courses.find(x=>x.id==="tecnico-em-metalurgia-integrado"),b=c?.blocos||[];
test("F7.15: Metalurgia integrado tem nome curto e ofertas distintas",()=>{
 assert.ok(c);assert.equal(c.nome,"Técnico em Metalurgia");assert.equal(c.tipo,"Integrado");assert.deepEqual(c.campi,["Ouro Branco","Ouro Preto"]);
 const tab=b.find(x=>x.tipo==="tabela"&&x.colunas?.[0]==="Campus");assert.deepEqual(tab.linhas.map(x=>x[0]),c.campi);
 assert.equal(tab.linhas[0][3],"coord.integradometalurgia.obr@ifmg.edu.br");assert.equal(tab.linhas[1][3],"Informação incompleta");
 assert.ok(b[0].campos.some(x=>x.rotulo==="Carga horária"&&x.valor.includes("Ouro Preto, 3.450 horas")&&x.valor.includes("Ouro Branco, Informação incompleta")));
 assert.ok(!JSON.stringify(c).includes("daniel.fraga@ifmg.edu.br"));
 assert.equal(b.find(x=>x.titulo==="Continue seus estudos no IFMG").conteudo,"");
 assert.deepEqual(b.slice(-2).map(x=>x.titulo),["Forma de ingresso","Mundo do Trabalho"]);
});
test("F7.15: apenas experiências verificadas e galerias correspondentes; mantém catálogo alfabético",()=>{
 const gals=b.map((x,i)=>x.tipo==="galeria"?{...x,i}:null).filter(Boolean);assert.equal(gals.length,3);
 assert.equal(new Set(gals.map(x=>x.referencia)).size,3);assert.ok(gals.every(x=>x.itens.length===0&&b[x.i-1].tipo==="texto"));
 const k=b.findIndex(x=>x.titulo==="Experiências e conquistas dos estudantes"),e=b.findIndex((x,i)=>i>k&&x.titulo==="Perguntas frequentes");
 const events=b.slice(k,e).filter(x=>x.tipo==="texto"&&x.conteudo);assert.equal(events.length,2);
 assert.ok(events.every(x=>b[b.indexOf(x)+1].tipo==="galeria"));
 assert.match(events[0].conteudo,/28 estudantes classificados/);assert.match(events[0].conteudo,/2026/);
 assert.match(events[1].conteudo,/Museu da Inconfidência/);assert.match(events[1].conteudo,/Mineração/);
 assert.ok(events.every(x=>x.conteudo.includes("Ouro Preto")));
 assert.ok(!JSON.stringify(c).includes("III Seminário"));
 assert.ok(b.find(x=>x.tipo==="faq"&&!x.titulo).itens.every(x=>!/^O que (é|são)/i.test(x.pergunta)));
 const names=data.courses.map(x=>x.id);
 const sorted=[...data.courses].sort((a,b)=>a.nome.localeCompare(b.nome,"pt-BR",{sensitivity:"base",numeric:true})||String(a.tipo||"").localeCompare(String(b.tipo||""),"pt-BR")||a.id.localeCompare(b.id,"pt-BR")).map(x=>x.id);
 assert.deepEqual(names,sorted);
});
