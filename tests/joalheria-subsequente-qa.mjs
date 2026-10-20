import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validarEstruturaCurso} from "../scripts/validar-estrutura.mjs";
const data=JSON.parse(readFileSync("data/cursos-publicados.json","utf8"));
const c=data.courses.find(x=>x.id==="tecnico-em-joalheria-subsequente");
const b=c?.blocos||[];
const campo=r=>b[0].campos.find(x=>x.rotulo===r)?.valor;
const sec=t=>b.find(x=>x.tipo==="texto"&&x.titulo===t);
test("F7.50: Joalheria subsequente noturno Ouro Preto, PPC 1200h e 20% EaD",()=>{
 assert.ok(c);assert.equal(c.nome,"Técnico em Joalheria");assert.equal(c.tipo,"Subsequente");
 assert.deepEqual(c.campi,["Ouro Preto"]);assert.equal(c.modalidade,"Presencial");
 assert.equal(b.length,23);assert.deepEqual(validarEstruturaCurso(c),[]);
 assert.equal(campo("Carga horária"),"1.200 horas (960 presenciais e 240 EaD)");
 assert.equal(campo("Duração"),"2 anos (4 semestres)");
 assert.equal(campo("Turno"),undefined);
 assert.match(campo("Modalidade"),/20% de atividades EaD/);
 assert.equal(campo("Estágio supervisionado"),"Não obrigatório");
 assert.equal(campo("Trabalho de Conclusão de Curso"),"Não obrigatório");
 assert.equal(campo("E-mail da coordenação"),undefined);
});
test("F7.50: projeto integrado é disciplina, sem estágio, TCC ou AC obrigatórios",()=>{
 const f=b.find(x=>x.tipo==="faq"&&!x.titulo);assert.equal(f.itens.length,4);
 assert.match(f.itens[2].resposta,/estágio supervisionado é opcional/);
 assert.match(f.itens[2].resposta,/não há TCC obrigatório/);
 assert.match(f.itens[2].resposta,/Design de Joias IV/);
 assert.match(f.itens[2].resposta,/atividades complementares/);
 assert.match(sec("O que você vai estudar").conteudo,/lapidação/);
 assert.match(sec("Mundo do Trabalho").conteudo,/ourivesaria/);
 assert.deepEqual(b.slice(-2).map(x=>x.titulo),["Forma de ingresso","Mundo do Trabalho"]);
});
test("F7.50: sem inventar participação em aula anunciada nem exportar auditoria",()=>{
 assert.equal(sec("Experiências e conquistas dos estudantes").conteudo,"");
 const gs=b.filter(x=>x.tipo==="galeria");assert.equal(gs.length,1);
 assert.deepEqual(gs[0].itens,[]);
 assert.equal(b[b.indexOf(gs[0])-1].titulo,"Aprendizagem prática");
 const raw=JSON.stringify(c);
 for(const t of ["bene.deveza@ifmg.edu.br","Benedito Matozinhos","aula aberta","18 de outubro de 2025","PPC novembro/2023","Anexo 4","Benchmark/","www.ifmg.edu.br"])
  assert.ok(!raw.includes(t),t);
 assert.ok(b.find(x=>x.tipo==="introducao").conteudo.length<=280);
 const sorted=[...data.courses].sort((a,z)=>a.nome.localeCompare(z.nome,"pt-BR",{sensitivity:"base",numeric:true})||String(a.tipo||"").localeCompare(String(z.tipo||""),"pt-BR")||a.id.localeCompare(z.id,"pt-BR"));
 assert.deepEqual(data.courses.map(x=>x.id),sorted.map(x=>x.id));
});