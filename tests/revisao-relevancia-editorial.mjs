import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const data=JSON.parse(readFileSync("data/cursos-publicados.json","utf8"));
const get=id=>data.courses.find(c=>c.id===id);
test("FAQ de Automação Industrial orienta decisões sem perguntas de glossário",()=>{
 const c=get("tecnico-em-automacao-industrial-integrado");
 const faq=c.blocos.find(b=>b.tipo==="faq"&&!b.titulo);
 assert.ok(faq);
 assert.ok(!faq.itens.some(i=>/O que são CLPs e sistemas supervisórios/i.test(i.pergunta)));
 assert.ok(faq.itens.some(i=>/estágio|TCC/i.test(i.pergunta)));
 assert.ok(c.blocos.some(b=>b.tipo==="tabela"&&JSON.stringify(b).includes("controladores lógicos programáveis")));
});
test("Engenharia Mecânica não apresenta projeto sem identificação verificável ou galeria vazia associada",()=>{
 const c=get("engenharia-mecanica-bacharelado");
 assert.ok(c);
 assert.ok(!c.blocos.some(b=>/Outro projeto tratou do \*\*ensino de química/i.test(b.conteudo||"")));
 assert.ok(!c.blocos.some(b=>b.referencia==="Projeto de ensino de química · Betim"));
 assert.ok(c.blocos.some(b=>b.referencia==="Pesquisa de impressão 3D · Betim"));
});
