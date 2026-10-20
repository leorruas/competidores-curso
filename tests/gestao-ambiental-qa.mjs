import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const data=JSON.parse(readFileSync("data/cursos-publicados.json","utf8"));
const c=data.courses.find(x=>x.id==="gestao-ambiental-tecnologo");
const b=c?.blocos||[];

test("F7.33: Gestão Ambiental tecnólogo GV, currículo 2026, estágio e coordenação",()=>{
 assert.ok(c);
 assert.equal(c.nome,"Gestão Ambiental");
 assert.equal(c.tipo,"Tecnólogo");
 assert.deepEqual(c.campi,["Governador Valadares"]);
 assert.equal(c.modalidade,"Presencial");
 const basicos=b.find(x=>x.tipo==="dados-basicos")?.campos||[];
 assert.ok(basicos.some(x=>x.rotulo==="Carga horária"&&x.valor==="1.700 horas"));
 assert.ok(!basicos.some(x=>x.rotulo==="E-mail da coordenação"));
 const table=b.find(x=>x.tipo==="tabela"&&x.colunas[0]==="Campus");
 assert.deepEqual(table.linhas, [["Governador Valadares","Presencial","Noite","4 semestres","1.700 horas","coordenacao.tga.gv@ifmg.edu.br"]]);
 const local=b.find(x=>x.tipo==="faq"&&x.titulo==="Informações dos campi");
 assert.match(local.itens[0].resposta,/100 horas/);
 assert.match(local.itens[0].resposta,/terceiro período/);
 assert.match(local.itens[0].resposta,/170 horas/);
 assert.match(local.itens[0].resposta,/175 horas/);
 assert.ok(b.find(x=>x.tipo==="introducao").conteudo.length<=280);
 assert.deepEqual(b.slice(-2).map(x=>x.titulo),["Forma de ingresso","Mundo do Trabalho"]);
});
test("F7.33: experiências datadas 2025, galerias e auditoria restrita",()=>{
 assert.equal(b.length,26);
 assert.equal(b.filter(x=>x.tipo==="galeria").length,3);
 const i=b.findIndex(x=>x.titulo==="Experiências e conquistas dos estudantes");
 assert.ok(i>0);
 assert.equal(b.filter(x=>x.titulo==="Experiências e conquistas dos estudantes").length,1);
 for(const k of [i,i+2]){
  assert.equal(b[k].tipo,"texto");
  assert.equal(b[k+1].tipo,"galeria");
  assert.deepEqual(b[k+1].itens,[]);
 }
 assert.match(b[i].conteudo,/29 de janeiro de 2025/);
 assert.match(b[i].conteudo,/Cenibra/);
 assert.match(b[i+2].conteudo,/5 de junho de 2025/);
 assert.match(b[i+2].conteudo,/egresso de Gestão Ambiental/);
 const p=b.findIndex(x=>x.titulo==="Pós-graduação");
 assert.ok(b[p+1].linhas.some(x=>x[0]==="Especialização em Meio Ambiente"&&x[1].includes("São João Evangelista")));
 assert.ok(b[p+1].linhas.some(x=>x[0].includes("Sustentabilidade e Tecnologia Ambiental")&&x[1]==="Bambuí"));
 const copy=JSON.stringify(c);
 assert.doesNotMatch(copy,/Auditoria privada|matriz privada|TCC obrigatório|coordenacao\.enc\.gv@ifmg\.edu\.br|https:\/\/www2?\.ifmg\.edu\.br/);
 assert.deepEqual(data.courses.map(x=>x.id),[...data.courses].sort((a,b)=>a.nome.localeCompare(b.nome,"pt-BR",{sensitivity:"base",numeric:true})||String(a.tipo||"").localeCompare(String(b.tipo||""),"pt-BR")||a.id.localeCompare(b.id,"pt-BR")).map(x=>x.id));
});
