import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validarEstruturaCurso} from "../scripts/validar-estrutura.mjs";

const catalogo=JSON.parse(readFileSync("data/cursos-publicados.json","utf8"));
const curso=catalogo.courses.find(c=>c.id==="especializacao-em-gestao-da-manutencao");
const blocos=curso?.blocos||[];
const campo=rotulo=>blocos[0].campos.find(x=>x.rotulo===rotulo)?.valor;
const texto=titulo=>blocos.find(b=>b.tipo==="texto"&&b.titulo===titulo);

test("F8.6A: especialização de Arcos é oferta própria, aprovada mas sem turma presumida",()=>{
 assert.ok(curso);
 assert.equal(curso.nome,"Especialização em Gestão da Manutenção");
 assert.equal(curso.nivel,"Pós-graduação");
 assert.equal(curso.tipo,"Especialização");
 assert.equal(curso.modalidade,"EaD");
 assert.deepEqual(curso.campi,["Arcos"]);
 assert.equal(curso.status,"em_validacao");
 assert.equal(curso.publicacao_autorizada,true);
 assert.equal(catalogo.courses.filter(x=>x.id===curso.id).length,1);
 assert.equal(blocos.length,21);
 assert.deepEqual(validarEstruturaCurso(curso),[]);
 assert.deepEqual(blocos.slice(-2).map(x=>x.titulo),["Forma de ingresso","Mundo do Trabalho"]);
 assert.match(texto("Onde o IFMG prevê oferecer a especialização").conteudo,/aprovou a criação/);
 assert.equal(texto("Experiências e conquistas dos estudantes").conteudo,"");
});

test("F8.6A: matriz 480 horas inclui 60h de trabalho final sem duplicação",()=>{
 assert.equal(campo("Eixo tecnológico"),"Controle e Processos Industriais");
 assert.match(campo("Carga horária total"),/480 horas, incluindo 60 horas/);
 assert.match(campo("Trabalho final"),/60 horas/);
 assert.match(campo("Duração"),/12 meses/);
 assert.equal(campo("Estágio supervisionado"),"Informação incompleta");
 const m=blocos.find(b=>b.tipo==="tabela"&&b.colunas[0]==="Semestre");
 assert.deepEqual(m.colunas,["Semestre","Componente curricular","Carga horária"]);
 assert.equal(m.linhas.length,17);
 assert.deepEqual(m.linhas.at(-1),["**Total**","**Dois semestres**","**480 horas**"]);
 assert.equal(m.linhas.slice(0,-1).reduce((a,x)=>a+Number(x[2].replace(/\D/g,"")),0),480);
 assert.equal(m.linhas.filter(x=>x[1]==="Trabalho Prático de Conclusão de Curso"&&x[2]==="60 horas").length,1);
 assert.equal(m.linhas.filter(x=>x[0]==="Primeiro").length,8);
 assert.equal(m.linhas.filter(x=>x[0]==="Segundo").length,8);
});

test("F8.6A: TCC e Moodle seguem PPC e regulamento de 2026",()=>{
 assert.match(texto("Aprendizagem a distância").conteudo,/Moodle/);
});

test("F8.6A: TCC admite artigo ou produto técnico sem prometer ausência de avaliações presenciais",()=>{
 const tcc=texto("Trabalho Prático de Conclusão de Curso").conteudo;
 assert.match(tcc,/individualmente ou em dupla/);
 assert.match(tcc,/artigo/);
 assert.match(tcc,/produto técnico aplicado/);
 assert.match(texto("Exemplos de produtos técnicos").conteudo,/planos de manutenção/);
 assert.match(texto("Exemplos de produtos técnicos").conteudo,/painéis de indicadores/);
 const raw=JSON.stringify(curso);
 assert.doesNotMatch(raw,/não (?:há|terá) atividades presenciais|nunca haverá encontro presencial/i);
 assert.ok(!blocos.some(b=>b.titulo==="Continue seus estudos no IFMG"));
});

test("F8.6A: contato não ativado, sem experiências nem evidências privadas no guia",()=>{
 assert.equal(campo("E-mail da coordenação"),"Informação incompleta");
 assert.equal(texto("Experiências e conquistas dos estudantes").conteudo,"");
 const gal=blocos.filter(x=>x.tipo==="galeria");
 assert.equal(gal.length,1);
 assert.deepEqual(gal[0].itens,[]);
 assert.equal(blocos[blocos.indexOf(gal[0])-1].titulo,"Aprendizagem a distância");
 const tcc=texto("Trabalho Prático de Conclusão de Curso").conteudo;
 assert.match(tcc,/artigo/);
 assert.match(tcc,/produto técnico aplicado/);
 assert.match(tcc,/individualmente ou em dupla/);
 assert.match(texto("Exemplos de produtos técnicos").conteudo,/matrizes de criticidade de ativos/);
 assert.ok(!blocos.some(b=>b.titulo==="Continue seus estudos no IFMG"));
 assert.equal(blocos.find(x=>x.tipo==="faq").itens.length,4);
 const raw=JSON.stringify(curso);
 for(const bad of ["Benchmark/","competidores-cursos","será ativado em breve","pos.manutencao.arcos@ifmg.edu.br","2027/1","inscrições abertas","Portaria de autorização","www.ifmg.edu.br"])assert.ok(!raw.includes(bad),bad);
});
