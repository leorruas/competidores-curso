import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validarEstruturaCurso} from "../scripts/validar-estrutura.mjs";

const base=JSON.parse(readFileSync(new URL("../data/cursos-publicados.json",import.meta.url),"utf8"));
const c=base.courses.find(x=>x.id==="tecnico-em-seguranca-do-trabalho-subsequente");
const blocos=c?.blocos||[];
const dados=r=>blocos[0].campos.find(x=>x.rotulo===r)?.valor;
const texto=t=>blocos.find(x=>x.tipo==="texto"&&x.titulo===t);
const table=blocos.find(x=>x.tipo==="tabela"&&x.colunas[0]==="Campus");
const campus=blocos.find(x=>x.tipo==="faq"&&x.titulo==="Informações dos campi");

test("F7.53: subsequente próprio, três campi do PS2027, 24 blocos",()=>{
  assert.ok(c);
  assert.equal(c.tipo,"Subsequente");
  assert.equal(c.nome,"Técnico em Segurança do Trabalho");
  assert.deepEqual(c.campi,["Governador Valadares","Ouro Preto","Santa Luzia"]);
  assert.ok(base.courses.some(x=>x.id==="tecnico-em-seguranca-do-trabalho-integrado"));
  assert.deepEqual(validarEstruturaCurso(c),[]);
  assert.equal(blocos.length,24);
  assert.equal(dados("Eixo tecnológico"),"Segurança");
  assert.match(dados("Duração"),/Governador Valadares: 3 semestres/);
  assert.match(dados("Duração"),/Ouro Preto e Santa Luzia: 4 semestres/);
  assert.ok(blocos.find(x=>x.tipo==="introducao").conteudo.length<=280);
  assert.deepEqual(blocos.slice(-2).map(x=>x.titulo),["Forma de ingresso","Mundo do Trabalho"]);
});

test("F7.53: cargas e contatos pertencem a cada campus",()=>{
  assert.equal(table.linhas.length,3);
  const gv=table.linhas.find(x=>x[0]==="Governador Valadares");
  const op=table.linhas.find(x=>x[0]==="Ouro Preto");
  const sl=table.linhas.find(x=>x[0]==="Santa Luzia");
  assert.deepEqual(gv.slice(3),["3 semestres","1.200 horas","coordenacao.tst.gv@ifmg.edu.br"]);
  assert.deepEqual(op.slice(3),["4 semestres","1.200 horas","Informação incompleta"]);
  assert.deepEqual(sl.slice(3),["4 semestres","1.320 horas","strabalho.santaluzia@ifmg.edu.br"]);
  assert.match(sl[1],/4,54% EaD/);
  assert.doesNotMatch(gv[1]+op[1],/4,54/);
  assert.ok(campus.itens.length>=3,"perguntas originais preservadas");
  assert.match(campus.itens[1].resposta,/1.095 horas de disciplinas e 105 horas de atividades complementares obrigatórias/);
  assert.match(campus.itens[2].resposta,/120 horas obrigatórias de estágio supervisionado ou TCC/);
  assert.match(dados("Estágio supervisionado"),/Governador Valadares: não obrigatório/);
  assert.match(dados("Trabalho de Conclusão de Curso"),/Governador Valadares: Informação incompleta/);
});

test("F7.53: não confunde estágio, TCC e complementares",()=>{
  const faq=blocos.find(x=>x.tipo==="faq"&&!x.titulo);
  assert.ok(faq.itens.length>=4,"perguntas originais preservadas");
  assert.match(faq.itens[2].resposta,/105 horas de atividades complementares/);
  assert.match(faq.itens[2].resposta,/120 horas de estágio supervisionado ou de TCC/);
  assert.match(faq.itens[2].resposta,/Governador Valadares.*120 horas para quem optar por realizá-lo/);
  assert.match(faq.itens[3].resposta,/4,54%/);
  assert.match(dados("Carga horária"),/1.095 horas de disciplinas/);
  assert.match(dados("Carga horária"),/1.200 horas de disciplinas e 120 horas de estágio ou TCC/);
});

test("F7.53: experiência Vale 2025 é do subsequente GV, com galeria própria",()=>{
  const idx=blocos.findIndex(x=>x.tipo==="texto"&&x.titulo==="Experiências e conquistas dos estudantes");
  assert.equal(idx>=0,true);
  assert.match(blocos[idx].conteudo,/1º de julho de 2025/);
  assert.match(blocos[idx].conteudo,/Técnico em Segurança do Trabalho Subsequente do Campus Governador Valadares/);
  assert.match(blocos[idx].conteudo,/Dojô de Segurança/);
  assert.equal(blocos[idx+1].tipo,"galeria");
  const galleries=blocos.filter(x=>x.tipo==="galeria");
  assert.equal(galleries.length,2);
  assert.ok(galleries.every(x=>x.itens.length===0));
  assert.equal(blocos[blocos.indexOf(galleries[0])-1].titulo,"Aprendizagem prática");
  assert.ok(!blocos.some(x=>x.titulo==="Reconhecimentos e premiações"));
  const all=JSON.stringify(c);
  for(const bad of ["renata.antipoff@ifmg.edu.br","2026.1","40 vagas","70 vagas","PPC de 2024","SIEST 2026","SIEST 2025","Benchmark/","Museu da Inconfidência","estágio de 105 horas obrigatório"]) assert.ok(!all.includes(bad),bad);
  assert.ok(!all.includes("https://www.ifmg.edu.br/"));
  const sorted=[...base.courses].sort((a,b)=>a.nome.localeCompare(b.nome,"pt-BR",{sensitivity:"base",numeric:true})||String(a.tipo||"").localeCompare(String(b.tipo||""),"pt-BR")||a.id.localeCompare(b.id,"pt-BR"));
  assert.deepEqual(base.courses.map(x=>x.id),sorted.map(x=>x.id));
});
