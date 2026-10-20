import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validarEstruturaCurso} from "../scripts/validar-estrutura.mjs";

const catalogo=JSON.parse(readFileSync("data/cursos-publicados.json","utf8"));
const curso=catalogo.courses.find(x=>x.id==="mestrado-profissional-em-sustentabilidade-e-tecnologia-ambiental");
const blocos=curso?.blocos||[];
const campo=r=>blocos[0].campos.find(x=>x.rotulo===r)?.valor;
const texto=t=>blocos.find(x=>x.tipo==="texto"&&x.titulo===t);

test("F8.4B: MPSTA é mestrado próprio de Bambuí com estrutura validável",()=>{
  assert.ok(curso);
  assert.equal(curso.nivel,"Pós-graduação");
  assert.equal(curso.tipo,"Mestrado profissional");
  assert.equal(curso.modalidade,"Presencial");
  assert.deepEqual(curso.campi,["Bambuí"]);
  assert.equal(curso.status,"em_validacao");
  assert.equal(curso.publicacao_autorizada,true);
  assert.equal(catalogo.courses.filter(x=>x.id===curso.id).length,1);
  assert.equal(blocos.length,22);
  assert.deepEqual(validarEstruturaCurso(curso),[]);
  assert.deepEqual(blocos.slice(-2).map(x=>x.titulo),["Forma de ingresso","Mundo do Trabalho"]);
});

test("F8.4B: créditos sem converter indevidamente em carga total, com contato público",()=>{
  assert.equal(campo("Eixo tecnológico"),"Ambiente e Saúde");
  assert.equal(campo("Categoria"),"Cursos de pós-graduação");
  assert.equal(campo("Tipo de oferta"),"Mestrado");
  assert.match(campo("Integralização"),/Mínimo de 24 créditos/);
  assert.match(campo("Integralização"),/15 horas/);
  assert.equal(campo("Duração"),"24 meses");
  assert.equal(campo("Carga horária"),"Informação incompleta");
  assert.equal(campo("Estágio supervisionado"),"Informação incompleta");
  assert.equal(campo("E-mail da coordenação"),"coordenacao.mpsta@ifmg.edu.br");
  assert.match(campo("Trabalho final"),/Dissertação com defesa/);
  assert.match(campo("Trabalho final"),/Produção Técnica e Tecnológica/);
  assert.ok(!blocos.some(x=>x.titulo==="Continue seus estudos no IFMG"));
  assert.equal(campo("Carga horária"),"Informação incompleta");
});

test("F8.4B: três linhas e presencialidade não viram quadro fixo nem multicampi",()=>{
  const linhas=blocos.find(b=>b.tipo==="tabela"&&b.colunas[0]==="Linha de pesquisa");
  assert.deepEqual(linhas.linhas.map(x=>x[0]),["Ecologia Aplicada","Tecnologias Ambientais","Planejamento e Gestão Ambiental"]);
  const campus=blocos.find(b=>b.tipo==="tabela"&&b.colunas[0]==="Campus");
  assert.deepEqual(campus.linhas.map(x=>x[0]),["Bambuí"]);
  assert.match(campus.linhas[0][1],/Presencial/);
  assert.match(texto("Como acontecem as aulas e atividades").conteudo,/híbrido/);
});

test("F8.4B: a pesquisa de 2026 tem galeria própria e não há conquista fictícia",()=>{
  const experiencias=blocos.findIndex(x=>x.titulo==="Experiências e conquistas dos estudantes");
  assert.ok(experiencias>0);
  assert.match(blocos[experiencias].conteudo,/Jeicilene Barros Carvalho/);
  assert.match(blocos[experiencias].conteudo,/2026/);
  assert.match(blocos[experiencias].conteudo,/69 indivíduos de nove espécies/);
  assert.equal(blocos[experiencias+1].tipo,"galeria");
  const gals=blocos.filter(x=>x.tipo==="galeria");
  assert.equal(gals.length,2);
  assert.ok(gals.every(x=>x.itens.length===0&&x.referencia.length>20));
  assert.equal(blocos[blocos.indexOf(gals[0])-1].titulo,"Como acontecem as aulas e atividades");
  assert.equal(blocos.find(x=>x.tipo==="faq").itens.length,4);
  const raw=JSON.stringify(curso);
  for(const term of ["Benchmark/","competidores-cursos","Regulamento_do_MPSTA","Resolução nº 5","Edital 1062","www.bambui.ifmg.edu.br","a coordenação deve confirmar","inscrições abertas"])
    assert.ok(!raw.includes(term),term);
});

test("F8: cadastro canônico e IA Ouro Preto preservada na PR #58",()=>{
 const labels=["Categoria","Tipo de oferta","Carga horária","Duração","Apresentação","Modalidade","Eixo tecnológico","Campi"];
 assert.deepEqual(blocos[0].campos.slice(0,8).map(x=>x.rotulo),labels);
 assert.ok(campo("Apresentação").length>=50&&campo("Apresentação").length<=180);
 assert.equal(campo("Categoria"),"Cursos de pós-graduação");
 assert.equal(campo("Tipo de oferta"),"Mestrado");
 assert.equal(campo("Campi"),"Bambuí");
 assert.ok(catalogo.courses.some(c=>c.id==="especializacao-em-inteligencia-artificial"));
});
