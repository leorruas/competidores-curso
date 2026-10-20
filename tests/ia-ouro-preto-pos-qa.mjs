import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validarEstruturaCurso} from "../scripts/validar-estrutura.mjs";

const catalogo=JSON.parse(readFileSync("data/cursos-publicados.json","utf8"));
const id="especializacao-em-inteligencia-artificial";
const curso=catalogo.courses.find(c=>c.id===id);
const blocos=curso?.blocos||[];
const campo=rotulo=>blocos[0]?.campos.find(c=>c.rotulo===rotulo)?.valor;
const texto=titulo=>blocos.find(b=>b.tipo==="texto"&&b.titulo===titulo);

test("F8.6C: pós IA Ouro Preto é especialização em uma sede, não múltiplos campi",()=>{
 assert.ok(curso);
 assert.equal(curso.nome,"Especialização em Inteligência Artificial");
 assert.equal(curso.nivel,"Pós-graduação");
 assert.equal(curso.tipo,"Especialização");
 assert.equal(curso.modalidade,"Presencial");
 assert.deepEqual(curso.campi,["Ouro Preto"]);
 assert.equal(curso.status,"em_validacao");
 assert.equal(curso.publicacao_autorizada,true);
 assert.equal(catalogo.courses.filter(c=>c.id===id).length,1);
 assert.equal(blocos.length,21);
 assert.deepEqual(blocos.slice(-2).map(b=>b.titulo),["Forma de ingresso","Mundo do Trabalho"]);
 assert.deepEqual(validarEstruturaCurso(curso),[]);
});

test("F8.6C: 360h de disciplinas e 60h TCC integram 420h sem duplicação",()=>{
 assert.equal(campo("Eixo tecnológico"),"Informação e Comunicação");
 assert.equal(campo("Duração"),"20 meses");
 assert.match(campo("Carga horária"),/420 horas, sendo 360 de disciplinas e 60 de TCC/);
 assert.match(campo("Trabalho final"),/obrigatório/);
 assert.match(campo("Trabalho final"),/60 horas/);
 assert.equal(campo("Estágio supervisionado"),"Informação incompleta");
 assert.equal(campo("E-mail da coordenação"),undefined);
 const tabela=blocos.find(b=>b.tipo==="tabela"&&b.colunas[0]==="Etapa");
 assert.deepEqual(tabela.colunas,["Etapa","Componente curricular","Carga horária"]);
 assert.equal(tabela.linhas.length,14);
 assert.equal(tabela.linhas.slice(0,-1).reduce((n,x)=>n+Number(x[2].replace(/\D/g,"")),0),420);
 assert.equal(tabela.linhas.filter(x=>x[1]==="Trabalho de Conclusão de Curso"&&x[2]==="60 horas").length,1);
 assert.equal(tabela.linhas.filter(x=>x[2]==="30 horas").length,12);
 assert.deepEqual(tabela.linhas.at(-1),["**Total**","**Doze disciplinas e TCC**","**420 horas**"]);
});

test("F8.6C: modalidade não confunde presencial com encontros remotos",()=>{
 assert.match(campo("Modalidade"),/^Presencial, com 20% das horas das disciplinas em EaD/);
 assert.match(texto("Como acontecem as aulas").conteudo,/encontros remotos síncronos/);
 const campi=blocos.find(b=>b.tipo==="tabela"&&b.colunas[0]==="Campus");
 assert.equal(campi.linhas.length,1);
 assert.equal(campi.linhas[0][0],"Ouro Preto");
 assert.equal(campi.linhas[0][4],"inteligencia.artificial@ifmg.edu.br");
});

test("F8.6C: Aurora é experiência de 2025 com galeria própria",()=>{
 const exp=texto("Experiências e conquistas dos estudantes");
 assert.match(exp.conteudo,/2025/);
 assert.match(exp.conteudo,/Ivanete Fátima de Azevedo/);
 assert.match(exp.conteudo,/chatbot Aurora/);
 assert.match(exp.conteudo,/Diário da Mãe em Construção/);
 const galerias=blocos.filter(b=>b.tipo==="galeria");
 assert.equal(galerias.length,2);
 assert.deepEqual(galerias[0].itens,[]);
 assert.deepEqual(galerias[1].itens,[]);
 assert.equal(blocos[blocos.indexOf(galerias[0])-1].titulo,"Como acontecem as aulas");
 assert.equal(blocos[blocos.indexOf(galerias[1])-1].titulo,exp.titulo);
 assert.ok(!blocos.some(b=>b.titulo==="Continue seus estudos no IFMG"));
});

test("F8.6C: FAQ explica custos por edital e não exporta cobrança histórica",()=>{
 const faq=blocos.find(b=>b.tipo==="faq");
 assert.ok(faq.itens.length>=4,"perguntas originais preservadas");
 const item=faq.itens.find(x=>x.pergunta.includes("cobra mensalidade"));
 assert.ok(item);
 assert.match(item.resposta,/gratuidade, mensalidades e eventual taxa de inscrição/);
 assert.match(item.resposta,/edital de cada oferta/);
 const raw=JSON.stringify(curso);
 for(const bad of ["R$ 15.000","35 vagas","MS Teams","www.ifmg.edu.br","2027/1","Benchmark/","competidores-cursos","inscrições abertas"])assert.ok(!raw.includes(bad),bad);
 assert.match(texto("Forma de ingresso").conteudo,/processo seletivo próprio/);
});
