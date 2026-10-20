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
test("F9.4: classificação na OBMEP, sem visita ao museu como conquista",()=>{
 const i=b.findIndex(x=>x.titulo==="Experiências e conquistas dos estudantes");
 assert.ok(i>0);
 assert.match(b[i].conteudo,/28 estudantes classificados/);
 assert.match(b[i].conteudo,/segunda fase/);
 assert.match(b[i].conteudo,/classificação não representa premiação/);
 assert.equal(b[i+1].titulo,"Perguntas frequentes");
 assert.equal(b.filter(x=>x.tipo==="galeria").length,1);
 assert.doesNotMatch(JSON.stringify(c),/Museu da Inconfidência/);
 assert.ok(!JSON.stringify(c).includes("III Seminário"));
 assert.ok(b.find(x=>x.tipo==="faq"&&!x.titulo).itens.every(x=>!/^O que (é|são)/i.test(x.pergunta)));
 const sorted=[...data.courses].sort((a,b)=>a.nome.localeCompare(b.nome,"pt-BR",{sensitivity:"base",numeric:true})||String(a.tipo||"").localeCompare(String(b.tipo||""),"pt-BR")||a.id.localeCompare(b.id,"pt-BR"));
 assert.deepEqual(data.courses.map(x=>x.id),sorted.map(x=>x.id));
});
