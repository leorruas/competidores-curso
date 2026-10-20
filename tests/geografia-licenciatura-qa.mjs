import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const data=JSON.parse(readFileSync("data/cursos-publicados.json","utf8"));
const c=data.courses.find(x=>x.id==="geografia-licenciatura");
const b=c?.blocos||[];

test("F7.32: Geografia Ouro Preto usa matriz vigente e organização da licenciatura",()=>{
 assert.ok(c);
 assert.equal(c.nome,"Geografia");
 assert.equal(c.tipo,"Licenciatura");
 assert.deepEqual(c.campi,["Ouro Preto"]);
 assert.equal(c.modalidade,"Presencial");
 const basicos=b.find(x=>x.tipo==="dados-basicos");
 assert.ok(basicos.campos.some(x=>x.rotulo==="Carga horária"&&x.valor==="3.200 horas"));
 assert.ok(!basicos.campos.some(x=>x.rotulo==="E-mail da coordenação"));
 const tabela=b.find(x=>x.tipo==="tabela"&&x.colunas[0]==="Campus");
 assert.equal(tabela.linhas.length,1);
 assert.equal(tabela.linhas[0][0],"Ouro Preto");
 assert.equal(tabela.linhas[0][4],"3.200 horas");
 assert.equal(tabela.linhas[0][5],"Informação incompleta");
 const local=b.find(x=>x.tipo==="faq"&&x.titulo==="Informações dos campi");
 assert.equal(local.itens.length,1);
 assert.match(local.itens[0].resposta,/100 horas de atividades em escolas/);
 assert.match(local.itens[0].resposta,/30 horas de aulas/);
 assert.match(local.itens[0].resposta,/T[rR]abalho de Conclusão/);
 assert.deepEqual(b.slice(-2).map(x=>x.titulo),["Forma de ingresso","Mundo do Trabalho"]);
});

test("F9.4: Geografia mantém pesquisa publicada e remove visitas de rotina",()=>{
 assert.equal(b.length,23);
 assert.equal(b.filter(x=>x.tipo==="galeria").length,1);
 const i=b.findIndex(x=>x.titulo==="Experiências e conquistas dos estudantes");
 assert.ok(i>0);
 assert.equal(b.filter(x=>x.titulo==="Experiências e conquistas dos estudantes").length,1);
 assert.match(b[i].conteudo,/Caminhos da sustentabilidade na educação de jovens e adultos/);
 assert.match(b[i].conteudo,/setembro de 2026/);
 assert.equal(b[i+1].titulo,"Perguntas frequentes");
 assert.ok(!b.some(x=>x.tipo==="galeria"&&/Vale do Aço|Escola Família Agrícola|EJA/.test(x.referencia||"")));
 const pos=b.findIndex(x=>x.titulo==="Pós-graduação");
 assert.ok(b[pos+1].linhas.some(x=>x[0].includes("PROFGEO")&&x[1].includes("Ouro Preto")));
 const txt=JSON.stringify(c);
 assert.doesNotMatch(txt,/Auditoria privada|igor\\.santos@ifmg\\.edu\\.br|https:\\/\\/www2?\\.ifmg\\.edu\\.br/);
 assert.deepEqual(data.courses.map(x=>x.id),[...data.courses].sort((a,b)=>a.nome.localeCompare(b.nome,"pt-BR",{sensitivity:"base",numeric:true})||String(a.tipo||"").localeCompare(String(b.tipo||""),"pt-BR")||a.id.localeCompare(b.id,"pt-BR")).map(x=>x.id));
});
