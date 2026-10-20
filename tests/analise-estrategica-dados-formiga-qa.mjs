import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validarEstruturaCurso} from "../scripts/validar-estrutura.mjs";

const catalogo=JSON.parse(readFileSync("data/cursos-publicados.json","utf8"));
const curso=catalogo.courses.find(x=>x.id==="especializacao-em-analise-estrategica-de-dados");
const blocos=curso?.blocos||[];
const campo=rotulo=>blocos[0].campos.find(x=>x.rotulo===rotulo)?.valor;
const texto=titulo=>blocos.find(x=>x.tipo==="texto"&&x.titulo===titulo);

test("F8.4A: especialização de Formiga é uma página independente",()=>{
  assert.ok(curso);
  assert.equal(curso.nome,"Especialização em Análise Estratégica de Dados");
  assert.equal(curso.nivel,"Pós-graduação");
  assert.equal(curso.tipo,"Especialização");
  assert.deepEqual(curso.campi,["Formiga"]);
  assert.equal(curso.modalidade,"EaD");
  assert.equal(curso.status,"em_validacao");
  assert.equal(curso.publicacao_autorizada,true);
  assert.equal(catalogo.courses.filter(x=>x.id===curso.id).length,1);
  assert.equal(blocos.length,22);
  assert.deepEqual(validarEstruturaCurso(curso),[]);
  assert.deepEqual(blocos.slice(-2).map(b=>b.titulo),["Forma de ingresso","Mundo do Trabalho"]);
});

test("F8.4A: 375 horas oficiais sem inventar carga específica de TCC",()=>{
  assert.equal(campo("Eixo tecnológico"),"Informação e Comunicação");
  assert.equal(campo("Carga horária"),"375 horas");
  assert.equal(campo("Duração"),"Três semestres");
  assert.equal(campo("Categoria"),"Cursos de pós-graduação");
  assert.equal(campo("Tipo de oferta"),"Pós-graduação lato sensu");
  assert.match(campo("Trabalho final"),/TCC obrigatório/);
  assert.match(campo("Trabalho final"),/Informação incompleta/);
  assert.equal(campo("E-mail da coordenação"),"Informação incompleta");
  const matriz=blocos.find(b=>b.tipo==="tabela"&&b.colunas[0]==="Semestre");
  assert.ok(matriz);
  assert.equal(matriz.linhas.length,10);
  assert.deepEqual(matriz.linhas.at(-1),["**Total**","**Três semestres**","**375 horas**"]);
  assert.equal(matriz.linhas.slice(0,-1).reduce((a,row)=>a+Number(row[2].replace(/\D/g,"")),0),375);
  assert.match(texto("Aprendizagem a distância").conteudo,/Moodle/);
  assert.match(texto("Trabalho de Conclusão de Curso").conteudo,/obrigatório/);
  const tcc=JSON.stringify({campo:campo("Trabalho final"),texto:texto("Trabalho de Conclusão de Curso"),faq:blocos.find(b=>b.tipo==="faq").itens});
  assert.doesNotMatch(tcc,/TCC.{0,50}(?:30\s*h|sem carga horária adicional|sem atribuição de horas)/i);
  assert.doesNotMatch(tcc,/matriz disponível|Minuta|PPC de abril/);
});

test("F8.4A: continuidade vertical é mestrado com afinidade em Finanças",()=>{
  const i=blocos.findIndex(b=>b.titulo==="Continue seus estudos no IFMG");
  const exp=blocos.findIndex(b=>b.titulo==="Experiências e conquistas dos estudantes");
  assert.ok(i>0&&i<exp);
  const t=blocos[i+1];
  assert.deepEqual(t.colunas,["Curso","Campus","Nível","Relação com o curso"]);
  assert.equal(t.linhas.length,1);
  assert.deepEqual(t.linhas[0].slice(0,3),["Mestrado Profissional em Administração","Formiga","Mestrado profissional"]);
  assert.match(t.linhas[0][3],/Finanças|financeiros/);
});

test("F8.4A: galeria contextual vazia, sem experiências inventadas nem fontes privadas",()=>{
  const gal=blocos.filter(b=>b.tipo==="galeria");
  assert.equal(gal.length,1);
  assert.deepEqual(gal[0].itens,[]);
  assert.equal(blocos[blocos.indexOf(gal[0])-1].titulo,"Aprendizagem a distância");
  assert.equal(texto("Experiências e conquistas dos estudantes").conteudo,"");
  assert.equal(blocos.find(b=>b.tipo==="faq").itens.length,4);
  assert.equal(blocos.filter(b=>b.tipo==="tabela"&&b.colunas[0]==="Campus").length,1);
  const raw=JSON.stringify(curso);
  for(const x of ["Benchmark/","competidores-cursos","Minuta","FGEANED.010","Portaria 6795","inscrições abertas","www.ifmg.edu.br","a coordenação deve confirmar"])assert.ok(!raw.includes(x),x);
});

test("F8.4A: oito campos de cadastro e curso Ouro Preto preservado",()=>{
 const esperado=["Categoria","Tipo de oferta","Carga horária","Duração","Apresentação","Modalidade","Eixo tecnológico","Campi"];
 assert.deepEqual(blocos[0].campos.slice(0,8).map(x=>x.rotulo),esperado);
 assert.ok(campo("Apresentação").length>=50&&campo("Apresentação").length<=180);
 assert.equal(campo("Campi"),"Formiga");
 assert.ok(catalogo.courses.some(x=>x.id==="especializacao-em-inteligencia-artificial"));
});
