import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const data=JSON.parse(readFileSync("data/cursos-publicados.json","utf8"));
const c=data.courses.find(x=>x.id==="inteligencia-artificial-bacharelado");
const b=c?.blocos||[];

test("F7.35: Inteligência Artificial bacharelado Bambuí, 2027 sem dados curriculares inventados",()=>{
 assert.ok(c);
 assert.equal(c.nome,"Inteligência Artificial");
 assert.equal(c.tipo,"Bacharelado");
 assert.deepEqual(c.campi,["Bambuí"]);
 const basicos=b.find(x=>x.tipo==="dados-basicos")?.campos||[];
 assert.ok(basicos.some(x=>x.rotulo==="Carga horária"&&x.valor==="3.200 horas"));
 assert.ok(!basicos.some(x=>x.rotulo==="E-mail da coordenação"));
 const tabela=b.find(x=>x.tipo==="tabela"&&x.colunas[0]==="Campus");
 assert.deepEqual(tabela.linhas,[["Bambuí","Manhã e tarde","Presencial, com componentes EaD","8 semestres","3.200 horas","ia.bambui@ifmg.edu.br"]]);
 assert.ok(b.find(x=>x.tipo==="introducao")?.conteudo.length<=280);
 const FAQ=b.find(x=>x.tipo==="faq"&&!x.titulo);
 assert.ok(FAQ);
 assert.equal(FAQ.itens.length,3);
 assert.ok(FAQ.itens.every(x=>!/(?:estágio|tcc|trabalho de conclusão)/i.test(x.pergunta)));
 assert.deepEqual(b.slice(-2).map(x=>x.titulo),["Forma de ingresso","Mundo do Trabalho"]);
 assert.ok(b.at(-1).conteudo.length>500);
});

test("F7.35: projetos de cursos anteriores não são atribuídos ao bacharelado novo",()=>{
 assert.equal(b.length,27);
 assert.equal(b.filter(x=>x.tipo==="galeria").length,3);
 const study=b.findIndex(x=>x.titulo==="Pesquisa do campus com IA aplicada à saúde");
 assert.ok(study>0);
 assert.match(b[study].conteudo,/estudante do \*\*Bacharelado em Engenharia de Computação\*\*/);
 assert.match(b[study].conteudo,/julho de 2026/);
 assert.equal(b[study+1].tipo,"galeria");
 const fast=b.findIndex(x=>x.titulo==="FAST desenvolve tecnologia para a Prefeitura de Bambuí");
 assert.ok(fast>0);
 assert.match(b[fast].conteudo,/estudantes de Engenharia de Computação/);
 assert.match(b[fast].conteudo,/setembro de 2026/);
 assert.equal(b[fast+1].tipo,"galeria");
 assert.equal(b.filter(x=>x.titulo==="Experiências e conquistas dos estudantes").length,1);
 assert.equal(b.find(x=>x.titulo==="Experiências e conquistas dos estudantes").conteudo,"Informação incompleta");
 assert.ok(b.filter(x=>x.tipo==="galeria").every(x=>x.itens.length===0));
 const pos=b.findIndex(x=>x.titulo==="Pós-graduação");
 assert.ok(b[pos+1].linhas.some(x=>x[0]==="Especialização em Inteligência Artificial"&&x[1]==="Ouro Preto"));
 const txt=JSON.stringify(c);
 assert.doesNotMatch(txt,/Auditoria privada|ciniro\.nametala@ifmg\.edu\.br|https:\/\/www2?\.ifmg\.edu\.br|12% EaD/);
 assert.deepEqual(data.courses.map(x=>x.id),[...data.courses].sort((a,b)=>a.nome.localeCompare(b.nome,"pt-BR",{sensitivity:"base",numeric:true})||String(a.tipo||"").localeCompare(String(b.tipo||""),"pt-BR")||a.id.localeCompare(b.id,"pt-BR")).map(x=>x.id));
});
