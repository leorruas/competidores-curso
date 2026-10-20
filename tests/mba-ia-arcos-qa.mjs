import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validarEstruturaCurso} from "../scripts/validar-estrutura.mjs";

const catalogo=JSON.parse(readFileSync("data/cursos-publicados.json","utf8"));
const id="mba-em-gestao-de-negocios-com-aplicacoes-de-inteligencia-artificial";
const curso=catalogo.courses.find(c=>c.id===id);
const blocos=curso?.blocos||[];
const campo=rotulo=>blocos[0]?.campos.find(x=>x.rotulo===rotulo)?.valor;
const texto=titulo=>blocos.find(b=>b.tipo==="texto"&&b.titulo===titulo);

test("F8.6B: MBA de Arcos é especialização, registro único e não mestrado",()=>{
 assert.ok(curso);
 assert.equal(curso.nome,"MBA em Gestão de Negócios com Aplicações de Inteligência Artificial");
 assert.equal(curso.nivel,"Pós-graduação");
 assert.equal(curso.tipo,"Especialização");
 assert.equal(curso.modalidade,"EaD");
 assert.deepEqual(curso.campi,["Arcos"]);
 assert.equal(curso.status,"em_validacao");
 assert.equal(curso.publicacao_autorizada,true);
 assert.equal(catalogo.courses.filter(c=>c.id===id).length,1);
 assert.equal(blocos.length,22);
 assert.deepEqual(blocos.slice(-2).map(b=>b.titulo),["Forma de ingresso","Mundo do Trabalho"]);
 assert.deepEqual(validarEstruturaCurso(curso),[]);
});

test("F8.6B: currículo soma 360h em oito componentes sem inventar CH de TCC",()=>{
 assert.equal(campo("Eixo tecnológico"),"Gestão e Negócios");
 assert.equal(campo("Duração"),"12 meses, em dois semestres");
 assert.match(campo("Carga horária"),/360 horas/);
 assert.match(campo("Trabalho final"),/obrigatório/);
 assert.match(campo("Trabalho final"),/carga horária específica: Informação incompleta/);
 assert.equal(campo("Estágio supervisionado"),"Informação incompleta");
 assert.equal(campo("E-mail da coordenação"),"Informação incompleta");
 const m=blocos.find(b=>b.tipo==="tabela"&&b.colunas[0]==="Semestre");
 assert.deepEqual(m.colunas,["Semestre","Componente curricular","Carga horária"]);
 assert.equal(m.linhas.length,9);
 assert.deepEqual(m.linhas.at(-1),["**Total**","**Oito disciplinas em dois semestres**","**360 horas**"]);
 assert.equal(m.linhas.slice(0,-1).reduce((n,r)=>n+Number(r[2].replace(/\D/g,"")),0),360);
 assert.equal(m.linhas.filter(r=>r[0]==="Primeiro").length,4);
 assert.equal(m.linhas.filter(r=>r[0]==="Segundo").length,4);
 assert.match(texto("Trabalho de Conclusão de Curso").conteudo,/produto técnico/);
});

test("F8.6B: FAQ registra possibilidade de cobrança sem anunciar gratuidade",()=>{
 const faq=blocos.find(b=>b.tipo==="faq");
 assert.equal(faq.itens.length,4);
 const custo=faq.itens.find(x=>x.pergunta==="O MBA cobra mensalidades?");
 assert.ok(custo);
 assert.match(custo.resposta,/cobrança de taxas e mensalidades/);
 assert.match(custo.resposta,/possibilidade de ofertas sem cobrança/);
 assert.doesNotMatch(custo.resposta,/é gratuito|sempre gratuito|sem mensalidade obrigatória/i);
 assert.match(texto("Forma de ingresso").conteudo,/processo seletivo próprio/);
});

test("F8.6B: continuidade é vertical, galerias e experiências não são inventadas",()=>{
 assert.ok(texto("Continue seus estudos no IFMG"));
 const progresso=blocos.find(x=>x.tipo==="tabela"&&x.colunas[0]==="Curso");
 assert.ok(progresso);
 assert.equal(progresso.linhas.length,1);
 assert.deepEqual(progresso.linhas[0].slice(0,3),["Mestrado Profissional em Administração","Formiga","Mestrado profissional"]);
 assert.ok(blocos.indexOf(progresso)<blocos.findIndex(b=>b.titulo==="Experiências e conquistas dos estudantes"));
 assert.equal(texto("Experiências e conquistas dos estudantes").conteudo,"");
 const galerias=blocos.filter(b=>b.tipo==="galeria");
 assert.equal(galerias.length,1);
 assert.deepEqual(galerias[0].itens,[]);
 assert.equal(blocos[blocos.indexOf(galerias[0])-1].titulo,"Como funciona a aprendizagem a distância");
});

test("F8.6B: cópia pública não contém dados da auditoria privada ou afirmações de turma ativa",()=>{
 const raw=JSON.stringify(curso);
 for(const forbidden of ["Benchmark/","competidores-cursos","inscrições abertas","2027/1","www.ifmg.edu.br","Portaria 6794","Resolução CONSUP 55"])assert.ok(!raw.includes(forbidden),forbidden);
 assert.ok(!raw.includes("secretaria.pos.arcos@ifmg.edu.br"));
 assert.ok(!raw.includes("taxas e mensalidades zero"));
});

test("F8: cadastro canônico e IA Ouro Preto preservada na PR #60",()=>{
 const labels=["Categoria","Tipo de oferta","Carga horária","Duração","Apresentação","Modalidade","Eixo tecnológico","Campi"];
 assert.deepEqual(blocos[0].campos.slice(0,8).map(x=>x.rotulo),labels);
 assert.ok(campo("Apresentação").length>=50&&campo("Apresentação").length<=180);
 assert.equal(campo("Categoria"),"Cursos de pós-graduação");
 assert.equal(campo("Tipo de oferta"),"Pós-graduação lato sensu");
 assert.equal(campo("Campi"),"Arcos");
 assert.ok(catalogo.courses.some(c=>c.id==="especializacao-em-inteligencia-artificial"));
});
