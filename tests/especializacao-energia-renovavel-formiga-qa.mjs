import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validarEstruturaCurso } from "../scripts/validar-estrutura.mjs";

const catalogo=JSON.parse(readFileSync("data/cursos-publicados.json","utf8"));
const curso=catalogo.courses.find(c=>c.id==="especializacao-em-sistemas-de-energia-renovavel");
const blocos=curso?.blocos||[];
const texto=titulo=>blocos.find(b=>b.tipo==="texto"&&b.titulo===titulo);
const campo=rotulo=>blocos[0].campos.find(x=>x.rotulo===rotulo)?.valor;

test("F8.3B: especialização de Formiga é uma oferta própria com esquema válido",()=>{
  assert.ok(curso);
  assert.equal(curso.nivel,"Pós-graduação");
  assert.equal(curso.tipo,"Especialização");
  assert.deepEqual(curso.campi,["Formiga"]);
  assert.equal(curso.modalidade,"EaD");
  assert.equal(curso.status,"em_validacao");
  assert.equal(curso.publicacao_autorizada,true);
  assert.equal(catalogo.courses.filter(x=>x.id===curso.id).length,1);
  assert.deepEqual(validarEstruturaCurso(curso),[]);
  assert.equal(blocos.length,22);
  assert.deepEqual(blocos.slice(-2).map(x=>x.titulo),["Forma de ingresso","Mundo do Trabalho"]);
});

test("F8.3B: matriz PPC de agosto de 2026: 420h incluem 45h de projeto final",()=>{
  assert.equal(campo("Eixo tecnológico"),"Controle e Processos Industriais");
  assert.equal(campo("Nível"),"Pós-graduação lato sensu · Especialização");
  assert.equal(campo("Duração"),"Três semestres");
  assert.match(campo("Carga horária"),/420 horas, incluindo 45 horas de Projeto Final/);
  assert.match(campo("Trabalho final"),/obrigatório, 45 horas/);
  assert.equal(campo("E-mail da coordenação"),"Informação incompleta");
  const curriculo=blocos.find(b=>b.tipo==="tabela"&&b.colunas[0]==="Semestre");
  assert.ok(curriculo);
  assert.equal(curriculo.linhas.length,11);
  assert.deepEqual(curriculo.linhas.at(-1),["**Total**","**Três semestres**","**420 horas**"]);
  assert.equal(curriculo.linhas.filter(l=>l[1].includes("Projeto Final")).length,1);
  assert.equal(curriculo.linhas.filter(l=>l[1].includes("Ambientação")).length,1);
  assert.match(texto("Projeto Final de Curso").conteudo,/45 horas/);
  assert.match(texto("Aprendizagem a distância").conteudo,/Moodle/);
  const raw=JSON.stringify(curso);
  for(const wrong of ["420 horas +","360 horas + 60","selecao_2026","07/10/2026","Benchmark/","www.ifmg.edu.br","a coordenação deve confirmar","especialização.formiga@ifmg.edu.br"])
    assert.ok(!raw.includes(wrong),"não publicar conteúdo conflitante ou privado: "+wrong);
});

test("F8.3B: continuidade opcional identifica mestrado pertinente e de nível acima",()=>{
  const pos=blocos.findIndex(b=>b.titulo==="Continue seus estudos no IFMG");
  const experiencias=blocos.findIndex(b=>b.titulo==="Experiências e conquistas dos estudantes");
  assert.ok(pos>0 && pos<experiencias);
  const tabela=blocos[pos+1];
  assert.deepEqual(tabela.colunas,["Curso","Campus","Nível","Relação com o curso"]);
  assert.equal(tabela.linhas.length,1);
  assert.match(tabela.linhas[0][0],/Mestrado Profissional em Sustentabilidade e Tecnologia Ambiental/);
  assert.equal(tabela.linhas[0][1],"Bambuí");
  assert.equal(tabela.linhas[0][2],"Mestrado profissional");
  assert.match(tabela.linhas[0][3],/Tecnologias Ambientais/);
  assert.deepEqual(validarEstruturaCurso(curso),[]);
});

test("F8.3B: projeto final tem linhas próprias e experiências não são inventadas",()=>{
  const investigacao=blocos.find(b=>b.tipo==="tabela"&&b.colunas[0]==="Linha");
  assert.equal(investigacao.linhas.length,3);
  const exp=texto("Experiências e conquistas dos estudantes");
  assert.equal(exp.conteudo,"");
  const gal=blocos.filter(b=>b.tipo==="galeria");
  assert.equal(gal.length,1);
  assert.deepEqual(gal[0].itens,[]);
  assert.equal(blocos[blocos.indexOf(gal[0])-1].titulo,"Aprendizagem a distância");
  const faq=blocos.find(b=>b.tipo==="faq");
  assert.equal(faq.itens.length,4);
  assert.ok(faq.itens.some(x=>x.resposta.includes("420 horas")));
  assert.ok(faq.itens.some(x=>x.resposta.includes("Projeto Final de Curso")));
  assert.ok(blocos.some(b=>b.titulo==="Pesquisa, projetos e oportunidades"));
});
