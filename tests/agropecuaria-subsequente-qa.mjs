import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const data=JSON.parse(readFileSync("data/cursos-publicados.json","utf8"));
const c=data.courses.find(x=>x.id==="tecnico-em-agropecuaria-subsequente");
const b=c?.blocos||[];
test("F7.43: Técnico Agropecuária Subsequente tem currículo 2025 e não mistura Integrado",()=>{
 assert.ok(c);assert.equal(c.nome,"Técnico em Agropecuária");assert.equal(c.tipo,"Subsequente");assert.deepEqual(c.campi,["Bambuí"]);
 assert.ok(data.courses.some(x=>x.id==="tecnico-em-agropecuaria-integrado"&&x.tipo==="Integrado"));
 assert.equal(b.length,23);assert.equal(b.filter(x=>x.tipo==="galeria").length,1);
 const campos=b.find(x=>x.tipo==="dados-basicos").campos;
 for(const [k,v] of [["Carga horária","1.620 horas"],["Estágio supervisionado obrigatório","240 horas"]])assert.ok(campos.some(x=>x.rotulo===k&&x.valor===v),k);
 const tbl=b.find(x=>x.tipo==="tabela"&&x.colunas[0]==="Campus");
 assert.deepEqual(tbl.linhas,[["Bambuí","Presencial","Manhã e tarde","3 semestres","1.620 horas","Informação incompleta"]]);
 const f=b.find(x=>x.tipo==="faq"&&x.titulo==="Informações dos campi");
 assert.equal(f.itens.length,1);assert.match(f.itens[0].resposta,/240 horas de estágio supervisionado obrigatório/);assert.match(f.itens[0].resposta,/Não exige.*Trabalho de Conclusão/);
 assert.deepEqual(b.slice(-2).map(x=>x.titulo),["Forma de ingresso","Mundo do Trabalho"]);assert.ok(b.at(-1).conteudo.length>500);
});
test("F7.43: conquistas não comprovadas vazias e material privado ausente do JSON",()=>{
 assert.equal(b.find(x=>x.titulo==="Experiências e conquistas dos estudantes").conteudo,"");
 assert.ok(b.find(x=>x.tipo==="introducao").conteudo.length<=280);
 assert.deepEqual(b.filter(x=>x.tipo==="galeria")[0].itens,[]);
 const p=b.findIndex(x=>x.titulo==="Pós-graduação");assert.ok(b[p+1].linhas.some(x=>x[0]==="Mestrado Profissional em Sustentabilidade e Tecnologia Ambiental"));
 for(const forbidden of ["Auditoria privada","PPC 2016","2.040","ivan.vieira@ifmg.edu.br","tecnico-em-agropecuaria-integrado/","PPC_Tecnico"])assert.ok(!JSON.stringify(c).includes(forbidden),forbidden);
 assert.deepEqual(data.courses.map(x=>x.id),[...data.courses].sort((a,b)=>a.nome.localeCompare(b.nome,"pt-BR",{sensitivity:"base",numeric:true})||String(a.tipo||"").localeCompare(String(b.tipo||""),"pt-BR")||a.id.localeCompare(b.id,"pt-BR")).map(x=>x.id));
});
