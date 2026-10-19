import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validarEstruturaCurso} from "../scripts/validar-estrutura.mjs";

const base=JSON.parse(readFileSync("data/cursos-publicados.json","utf8"));
const c=base.courses.find(x=>x.id==="mestrado-profissional-em-administracao");
const blocos=c?.blocos||[];
const campo=rotulo=>blocos[0].campos.find(x=>x.rotulo===rotulo)?.valor;
const text=titulo=>blocos.find(x=>x.tipo==="texto"&&x.titulo===titulo);

test("F8.3C: mestrado Formiga é curso stricto sensu independente",()=>{
  assert.ok(c);
  assert.equal(c.nome,"Mestrado Profissional em Administração");
  assert.equal(c.nivel,"Pós-graduação");
  assert.equal(c.tipo,"Mestrado profissional");
  assert.deepEqual(c.campi,["Formiga"]);
  assert.equal(c.modalidade,"Presencial");
  assert.equal(c.publicacao_autorizada,true);
  assert.equal(c.status,"em_validacao");
  assert.equal(base.courses.filter(x=>x.id===c.id).length,1);
  assert.equal(blocos.length,22);
  assert.deepEqual(validarEstruturaCurso(c),[]);
  assert.deepEqual(blocos.slice(-2).map(x=>x.titulo),["Forma de ingresso","Mundo do Trabalho"]);
});

test("F8.3C: dados do regulamento PPGA 01-2026 e créditos não viram carga total declarada",()=>{
  assert.equal(campo("Eixo tecnológico"),"Gestão e Negócios");
  assert.match(campo("Nível"),/Pós-graduação stricto sensu/);
  assert.equal(campo("Área de concentração"),"Finanças");
  assert.equal(campo("Duração"),"24 meses");
  assert.equal(campo("Turno"),"Integral");
  assert.match(campo("Integralização"),/30 créditos/);
  assert.equal(campo("Carga horária total"),"Informação incompleta");
  assert.equal(campo("E-mail da coordenação"),"Informação incompleta");
  assert.match(campo("Trabalho final"),/Dissertação com defesa/);
  const tabela=blocos.find(x=>x.tipo==="tabela"&&x.colunas[0]==="Componente curricular");
  assert.ok(tabela);
  assert.deepEqual(tabela.linhas.map(x=>Number(x[1])),[12,12,2,4,30]);
  assert.deepEqual(tabela.linhas.at(-1),["Total de créditos","30","450"]);
  assert.match(text("Como funciona a pesquisa").conteudo,/exame de qualificação/);
});

test("F8.3C: duas linhas de pesquisa, modalidade e FAQ verificáveis",()=>{
  const linhas=blocos.find(x=>x.tipo==="tabela"&&x.colunas[0]==="Linha de pesquisa");
  assert.deepEqual(linhas.linhas.map(x=>x[0]),[
    "Finanças Comportamentais e Tomada de Decisões",
    "Finanças Corporativas e Investimentos"
  ]);
  const faq=blocos.find(x=>x.tipo==="faq");
  assert.equal(faq.itens.length,4);
  assert.ok(faq.itens.some(x=>x.resposta.includes("remoto ou híbrido")));
  assert.ok(faq.itens.some(x=>x.resposta.includes("dissertação")));
  assert.ok(text("Forma de ingresso").conteudo.includes("graduação"));
  assert.ok(!blocos.some(x=>x.titulo==="Continue seus estudos no IFMG"),
    "Sem doutorado relacionado do IFMG comprovado, não criar continuidade vazia");
});

test("F8.3C: dissertações de 2025 têm galerias próprias, sem imagens inventadas",()=>{
  const galerias=blocos.filter(x=>x.tipo==="galeria");
  assert.equal(galerias.length,3);
  assert.ok(galerias.every(x=>x.itens.length===0&&x.referencia.length>10));
  const experiencias=blocos.findIndex(x=>x.titulo==="Experiências e conquistas dos estudantes");
  assert.match(blocos[experiencias].conteudo,/2025/);
  assert.match(blocos[experiencias].conteudo,/Patrícia Fátima Rodrigues Pereira/);
  assert.equal(blocos[experiencias+1].tipo,"galeria");
  const pesquisa=blocos.findIndex(x=>x.titulo==="Pesquisas sobre decisões e comportamento financeiro");
  assert.match(blocos[pesquisa].conteudo,/Kelma Maria Leal Faria/);
  assert.equal(blocos[pesquisa+1].tipo,"galeria");
  const raw=JSON.stringify(c);
  for(const invalido of ["Benchmark/","competidores-cursos","www.ifmg.edu.br","Portaria 5901/2025",
    "selecao_2026","Revisão da coordenação","inscrições abertas"])
    assert.ok(!raw.includes(invalido),invalido);
});
