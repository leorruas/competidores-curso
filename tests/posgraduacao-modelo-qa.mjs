import test from "node:test";
import assert from "node:assert/strict";
import { validarEstruturaCurso } from "../scripts/validar-estrutura.mjs";

// Contrato sintético: testa o modelo antes de adicionar cursos ou dados à main.
function pilotoPos(tipo) {
  const mestrado = tipo === "Mestrado profissional";
  const nome = mestrado ? "Mestrado Profissional em Administração" :
    "Especialização em Sistemas de Energia Renovável";
  const campos = [
    {rotulo:"Curso",valor:nome},
    {rotulo:"Nível",valor:mestrado ? "Pós-graduação stricto sensu" : "Pós-graduação lato sensu"},
    {rotulo:"Duração",valor:mestrado ? "24 meses" : "Três semestres"},
    {rotulo:"Carga horária total",valor:mestrado ? "Informação incompleta" : "420 horas"},
    {rotulo:"E-mail da coordenação",valor:"Informação incompleta"},
    ...(mestrado
      ? [{rotulo:"Integralização",valor:"30 créditos, incluindo dissertação"}]
      : [{rotulo:"Trabalho final",valor:"Projeto Final de Curso obrigatório: 45 horas"}])
  ];
  return {
    id: mestrado ? "mestrado-profissional-em-administracao" : "especializacao-em-energia-renovavel",
    nome, nivel:"Pós-graduação", tipo, campi:["Formiga"], modalidade:mestrado?"Presencial":"EaD",
    status:"em_validacao", publicacao_autorizada:false,
    blocos: [
      {tipo:"dados-basicos",campos},
      {tipo:"texto",titulo:nome,conteudo:"Formação de pós-graduação com pesquisa e projeto."},
      {tipo:"introducao",conteudo:"Conheça atividades de pós-graduação no IFMG."},
      {tipo:"texto",titulo:mestrado ? "Linhas de pesquisa" : "Projeto Final de Curso",
        conteudo:mestrado?"Finanças comportamentais e finanças corporativas.":"Projeto técnico aplicado."},
      {tipo:"galeria",referencia:"Ambientes e atividades de pós-graduação em Formiga",itens:[]},
      {tipo:"texto",titulo:"Onde o IFMG oferece o curso",conteudo:"O Campus Formiga oferece esta formação."},
      {tipo:"tabela",colunas:["Campus","Modalidade","E-mail da coordenação"],
        linhas:[["Formiga",mestrado?"Presencial":"EaD","Informação incompleta"]]},
      {tipo:"texto",titulo:"Experiências e conquistas dos estudantes",
        conteudo:mestrado?"Uma dissertação defendida em 2025 investigou finanças.":""},
      ...(mestrado ? [{tipo:"galeria",referencia:"Dissertação de finanças defendida no ano de 2025",itens:[]}] : []),
      {tipo:"texto",titulo:"Perguntas frequentes",conteudo:""},
      {tipo:"faq",itens:[{pergunta:"É necessário concluir graduação?",resposta:"Sim, conforme a seleção específica."}]},
      {tipo:"texto",titulo:"Forma de ingresso",conteudo:"O ingresso ocorre por edital específico."},
      {tipo:"texto",titulo:"Mundo do Trabalho",conteudo:"Desenvolvimento de atividades de pesquisa aplicada."}
    ]
  };
}

test("F8.3A: especialização sem continuidade de graduação passa na estrutura", () => {
  const curso = pilotoPos("Especialização");
  assert.equal(curso.blocos.some(b=>b.titulo==="Continue seus estudos no IFMG"),false);
  assert.deepEqual(validarEstruturaCurso(curso),[]);
  assert.ok(curso.blocos[0].campos.some(c=>c.rotulo==="Trabalho final"));
  assert.equal(curso.blocos.filter(b=>b.tipo==="galeria").length,1);
});

test("F8.3A: mestrado distingue créditos e dissertação, com galeria para relato", () => {
  const curso = pilotoPos("Mestrado profissional");
  assert.deepEqual(validarEstruturaCurso(curso),[]);
  assert.ok(curso.blocos[0].campos.some(c=>c.rotulo==="Integralização"&&c.valor.includes("créditos")));
  assert.equal(curso.blocos.filter(b=>b.tipo==="galeria").length,2);
});

test("F8.3A: técnico e graduação ainda exigem continuidade dos estudos", () => {
  for (const nivel of ["Técnico","Graduação"]) {
    const curso = pilotoPos("Especialização");
    curso.nivel = nivel;
    assert.ok(validarEstruturaCurso(curso).some(e=>e.includes("Continue seus estudos no IFMG")),nivel);
  }
});

test("F8.3A: exigências editoriais restantes valem também para pós-graduação", () => {
  const semGaleria = pilotoPos("Especialização");
  semGaleria.blocos = semGaleria.blocos.filter(b=>b.tipo!=="galeria");
  assert.ok(validarEstruturaCurso(semGaleria).some(e=>e.includes("sem nenhum bloco de galeria")));

  const tabela = pilotoPos("Especialização");
  tabela.blocos.find(b=>b.tipo==="tabela").linhas = [["Campus incorreto","EaD","Informação incompleta"]];
  assert.ok(validarEstruturaCurso(tabela).some(e=>e.includes("listar exatamente os campi")));

  const final = pilotoPos("Mestrado profissional");
  final.blocos.push({tipo:"texto",titulo:"Apêndice",conteudo:"Depois do encerramento"});
  assert.ok(validarEstruturaCurso(final).some(e=>e.includes("dois últimos blocos")));

  const relato = pilotoPos("Mestrado profissional");
  const i = relato.blocos.findIndex(b=>b.titulo==="Experiências e conquistas dos estudantes");
  relato.blocos.splice(i+1,1);
  assert.ok(validarEstruturaCurso(relato).some(e=>e.includes("deve ter galeria imediatamente depois")));
});
