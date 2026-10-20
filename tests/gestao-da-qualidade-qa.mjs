import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const data=JSON.parse(readFileSync("data/cursos-publicados.json","utf8"));
const c=data.courses.find(x=>x.id==="gestao-da-qualidade-tecnologo");
const b=c?.blocos||[];

test("F7.34: Gestão da Qualidade Ouro Preto e PPC 2025",()=>{
 assert.ok(c);
 assert.equal(c.nome,"Gestão da Qualidade");
 assert.equal(c.tipo,"Tecnólogo");
 assert.deepEqual(c.campi,["Ouro Preto"]);
 const basic=b.find(x=>x.tipo==="dados-basicos").campos;
 assert.ok(basic.some(x=>x.rotulo==="Carga horária"&&x.valor==="1.660 horas"));
 assert.ok(!basic.some(x=>x.rotulo==="E-mail da coordenação"));
 const table=b.find(x=>x.tipo==="tabela"&&x.colunas[0]==="Campus");
 assert.deepEqual(table.linhas,[["Ouro Preto","Presencial (27,7% EaD)","Noite","6 semestres","1.660 horas","Informação incompleta"]]);
 const local=b.find(x=>x.tipo==="faq"&&x.titulo==="Informações dos campi");
 assert.match(local.itens[0].resposta,/170 horas/);
 assert.match(local.itens[0].resposta,/55 horas/);
 assert.match(local.itens[0].resposta,/TCC obrigatório de 30 horas/);
 assert.match(local.itens[0].resposta,/estágio curricular é opcional/);
 assert.ok(b.find(x=>x.tipo==="introducao").conteudo.length<=280);
 assert.deepEqual(b.slice(-2).map(x=>x.titulo),["Forma de ingresso","Mundo do Trabalho"]);
});

test("F9.4: Gestão da Qualidade não apresenta visitas de rotina como conquistas",()=>{
 assert.equal(b.length,23);
 assert.equal(b.filter(x=>x.tipo==="galeria").length,1);
 const i=b.findIndex(x=>x.titulo==="Experiências e conquistas dos estudantes");
 assert.ok(i>0);
 assert.equal(b.filter(x=>x.titulo==="Experiências e conquistas dos estudantes").length,1);
 assert.equal(b[i].conteudo,"");
 assert.equal(b[i+1].titulo,"Perguntas frequentes");
 assert.ok(!b.some(x=>x.tipo==="galeria"&&/Escola Família Agrícola|Cordisburgo e Diamantina/.test(x.referencia||"")));
 const t=b.find(x=>x.tipo==="tabela"&&x.colunas[0]==="Curso");
 assert.ok(t.linhas.some(x=>x[0]==="Processos Gerenciais (Tecnólogo)"&&x[1]==="Ponte Nova e Ribeirão das Neves"));
 const txt=JSON.stringify(c);
 assert.doesNotMatch(txt,/Auditoria privada|adriano\\.martins@ifmg\\.edu\\.br|https:\\/\\/www2?\\.ifmg\\.edu\\.br/);
 assert.deepEqual(data.courses.map(x=>x.id),[...data.courses].sort((a,b)=>a.nome.localeCompare(b.nome,"pt-BR",{sensitivity:"base",numeric:true})||String(a.tipo||"").localeCompare(String(b.tipo||""),"pt-BR")||a.id.localeCompare(b.id,"pt-BR")).map(x=>x.id));
});
