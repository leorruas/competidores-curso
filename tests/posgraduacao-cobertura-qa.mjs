import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validarEstruturaCurso } from "../scripts/validar-estrutura.mjs";

const { courses } = JSON.parse(readFileSync(new URL("../data/cursos-publicados.json", import.meta.url)));
const get = id => {
  const c = courses.find(c => c.id === id);
  assert.ok(c, id);
  return c;
};
const value = (c, label) => c.blocos[0].campos.find(f => f.rotulo === label)?.valor;
const campusTable = c => c.blocos.find(b => b.tipo === "tabela" && b.colunas[0] === "Campus");
const text = c => JSON.stringify(c.blocos);

test("F8.8: cobertura documental de lato sensu e dos quatro mestrados", () => {
  const pos = courses.filter(c => c.nivel === "Pós-graduação");
  assert.ok(pos.length >= 37);
  assert.equal(new Set(pos.map(c => c.id)).size, pos.length);
  for (const id of [
    "mestrado-em-educacao-profissional-e-tecnologica-profept",
    "mestrado-profissional-em-ensino-de-geografia-em-rede-nacional-profgeo",
    "mestrado-profissional-em-sustentabilidade-e-tecnologia-ambiental",
    "mestrado-profissional-em-administracao"
  ]) {
    const c = get(id);
    assert.equal(c.tipo, "Mestrado profissional");
    assert.equal(value(c, "Tipo de oferta"), "Mestrado");
    assert.ok(!c.blocos.some(b => b.titulo === "Continue seus estudos no IFMG"), "sem doutorado presumido");
  }
  assert.equal(get("mba-em-gestao-de-negocios-com-aplicacoes-de-inteligencia-artificial").tipo, "Especialização");
});

test("F8.8: ênfases e polos não criam cursos ou campi artificiais", () => {
  const docencia = get("especializacao-em-docencia");
  assert.deepEqual(docencia.campi, ["Arcos", "Ponte Nova", "Ipatinga"]);
  assert.ok(!courses.some(c => c.id === "especializacao-em-docencia-com-enfase-em-educacao-inclusiva"));
  const row = campusTable(docencia).linhas.find(r => r[0] === "Ipatinga");
  assert.match(row[1], /2024–2025.*sem previsão de novas turmas/);
  assert.notEqual(get("especializacao-em-docencia-na-ept-via-programa-uab").id, docencia.id);
  assert.deepEqual(get("especializacao-em-administracao-publica").campi, ["Ouro Preto"]);
  assert.deepEqual(get("especializacao-em-ensino-de-ciencias-e-matematica").campi, ["Bambuí"]);
  assert.match(value(get("especializacao-em-ensino-de-ciencias-e-matematica"), "Modalidade"), /EaD/);
  assert.equal(courses.filter(c => c.id === "especializacao-em-gestao").length, 1);
});

test("F8.8: Educação de Neves e Educação Básica de Piumhi permanecem distintas", () => {
  assert.deepEqual(get("especializacao-em-educacao").campi, ["Ribeirão das Neves"]);
  const piumhi = get("especializacao-em-educacao-basica-teoria-e-pratica");
  assert.deepEqual(piumhi.campi, ["Piumhi"]);
  assert.match(piumhi.nome, /Educação Básica: Teoria e Prática/);
});

test("F8.8: inconsistências documentais não viram números ou modalidade definitivos", () => {
  for (const id of ["especializacao-em-agrimensura", "especializacao-em-educacao", "especializacao-em-ensino-de-lingua-portuguesa-e-literatura-na-educacao-basica"])
    assert.equal(value(get(id), "Carga horária"), "Informação incompleta", id);
  assert.equal(value(get("especializacao-em-docencia-na-ept-via-programa-uab"), "Duração"), "Informação incompleta");
  for (const id of ["especializacao-em-praticas-avaliativas", "mestrado-profissional-em-ensino-de-geografia-em-rede-nacional-profgeo"])
    assert.equal(value(get(id), "Modalidade"), "Informação incompleta", id);
  assert.match(value(get("especializacao-em-matematica-para-o-ensino-nos-anos-iniciais-da-educacao-basica"), "Carga horária"), /375.*total com TCC: Informação incompleta/);
  assert.doesNotMatch(value(get("mestrado-profissional-em-sustentabilidade-e-tecnologia-ambiental"), "Carga horária"), /360/);
});

test("F8.8: Agrimensura tem encontros presenciais e Segurança preserva diferenças locais", () => {
  assert.match(value(get("especializacao-em-agrimensura"), "Modalidade"), /encontros presenciais obrigatórios/);
  const rows = campusTable(get("especializacao-em-engenharia-de-seguranca-do-trabalho")).linhas;
  assert.match(rows.find(r => r[0] === "Arcos")[3], /650/);
  const gv = rows.find(r => r[0] === "Governador Valadares");
  assert.match(gv[1], /Presencial.*20%/);
  assert.match(gv[3], /600/);
  assert.equal(gv.at(-1), "possegurancadotrabalho.ifmggv@ifmg.edu.br");
});

test("F8.8: IA aplicada de Formiga não se confunde com IA de Ouro Preto ou MBA de Arcos", () => {
  const c = get("especializacao-em-inteligencia-artificial-aplicada-a-estrategia-e-inovacao-empresarial");
  assert.deepEqual(c.campi, ["Formiga"]);
  assert.equal(value(c, "Carga horária"), "435 horas");
  assert.match(value(c, "Trabalho final"), /Produto ou relatório técnico.*Laboratório/);
  assert.notEqual(c.id, get("especializacao-em-inteligencia-artificial").id);
  assert.equal(campusTable(c).linhas[0].at(-1), "Informação incompleta");
});

test("F8.8: formação adicional em Sistemas Inteligentes preserva TCC incluído no total", () => {
  const c = get("especializacao-em-engenharia-de-sistemas-inteligentes");
  assert.deepEqual(c.campi, ["Bambuí"]);
  assert.equal(value(c, "Carga horária"), "510 horas");
  assert.equal(value(c, "Duração"), "15 meses");
  assert.match(value(c, "Trabalho final"), /60 horas incluídas nas 510/);
  assert.doesNotMatch(text(c), /inscrições abertas|turmas anuais garantidas/i);
});

test("F8.8: novos roteiros respeitam o cadastro e não acrescentam galerias vazias", () => {
  const original = new Set(["especializacao-em-gestao-da-manutencao", "especializacao-em-inteligencia-artificial", "especializacao-em-sistemas-de-energia-renovavel", "mestrado-profissional-em-administracao"]);
  for (const c of courses.filter(c => c.nivel === "Pós-graduação" && !original.has(c.id))) {
    assert.deepEqual(validarEstruturaCurso(c), [], c.id);
    assert.equal(c.publicacao_autorizada, true);
    assert.equal(c.status, "em_validacao");
    assert.ok(!c.blocos.some(b => b.tipo === "galeria"), c.id);
    assert.ok(campusTable(c), c.id);
    assert.ok(campusTable(c).colunas.includes("E-mail da coordenação"), c.id);
    const local = c.blocos[c.blocos.indexOf(campusTable(c)) + 1];
    assert.equal(local.tipo,"faq",c.id);
    assert.equal(local.titulo,"Informações dos campi",c.id);
    assert.deepEqual(local.itens.map(q=>q.pergunta),c.campi.map(n=>"Campus "+n),c.id);
    for (const b of c.blocos.filter(b => b.tipo === "tabela")) {
      assert.equal(b.cabecalhoPrimeiraLinha, true, c.id);
      assert.ok(!b.legenda, c.id);
    }
  }
});
