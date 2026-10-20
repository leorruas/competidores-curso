import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const data=JSON.parse(readFileSync("data/cursos-publicados.json","utf8"));
const c=data.courses.find(x=>x.id==="tecnico-em-nutricao-e-dietetica-integrado"),b=c?.blocos||[];
test("F7.17: Nutrição e Dietética integrado SJE com nome curto e contato funcional",()=>{
 assert.ok(c);assert.equal(c.nome,"Técnico em Nutrição e Dietética");assert.equal(c.tipo,"Integrado");assert.deepEqual(c.campi,["São João Evangelista"]);
 const tab=b.find(x=>x.tipo==="tabela"&&x.colunas?.[0]==="Campus");assert.deepEqual(tab.linhas,[["São João Evangelista","Presencial","Manhã e tarde","ctnd.sje@ifmg.edu.br"]]);
 for(const rotulo of ["Duração","Carga horária"])assert.ok(b[0].campos.some(z=>z.rotulo===rotulo&&z.valor==="Informação incompleta"));
 assert.ok(!b[0].campos.some(z=>z.rotulo==="E-mail da coordenação"));
 assert.ok(!JSON.stringify(c).includes("3820")&&!JSON.stringify(c).includes("3.820")&&!JSON.stringify(c).includes("3.600"));
 assert.equal(b.find(x=>x.titulo==="Continue seus estudos no IFMG").conteudo,"");assert.deepEqual(b.slice(-2).map(x=>x.titulo),["Forma de ingresso","Mundo do Trabalho"]);
});
test("F7.17: não inventa projetos; respeita estrutura, perguntas úteis e ordenação",()=>{
 assert.equal(b.find(x=>x.titulo==="Experiências e conquistas dos estudantes").conteudo,"");
 const gals=b.filter(z=>z.tipo==="galeria");assert.equal(gals.length,1);assert.equal(gals[0].itens.length,0);
 const local=b.find(z=>z.tipo==="faq"&&z.titulo==="Informações dos campi");assert.equal(local.itens.length,1);
 const faq=b.find(z=>z.tipo==="faq"&&!z.titulo);assert.equal(faq.itens.length,3);assert.ok(faq.itens.every(x=>!/^O que (é|são)/i.test(x.pergunta)));
 assert.ok(!JSON.stringify(c).includes("Auditoria privada"));assert.ok(!JSON.stringify(c).includes("www.sje.ifmg.edu.br"));
 const sorted=[...data.courses].sort((a,b)=>a.nome.localeCompare(b.nome,"pt-BR",{sensitivity:"base",numeric:true})||String(a.tipo||"").localeCompare(String(b.tipo||""),"pt-BR")||a.id.localeCompare(b.id,"pt-BR"));
 assert.deepEqual(data.courses.map(x=>x.id),sorted.map(x=>x.id));
});
