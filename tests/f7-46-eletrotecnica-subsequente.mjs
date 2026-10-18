import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validarEstruturaCurso } from "../scripts/validar-estrutura.mjs";

const base = JSON.parse(readFileSync(new URL("../data/cursos-publicados.json", import.meta.url), "utf8"));
const id = "tecnico-em-eletrotecnica-subsequente";
const curso = base.courses.find(item => item.id === id);
const txt = titulo => curso.blocos.find(b => b.tipo === "texto" && b.titulo === titulo);
const all = JSON.stringify(curso);

test("F7.46: cadastro separado do integrado, por tipo e campi", () => {
  assert.ok(curso);
  assert.equal(curso.nome, "Técnico em Eletrotécnica");
  assert.equal(curso.tipo, "Subsequente");
  assert.deepEqual(curso.campi, ["Conselheiro Lafaiete", "Ipatinga"]);
  assert.ok(base.courses.some(c => c.id === "tecnico-em-eletrotecnica-integrado"));
  assert.deepEqual(validarEstruturaCurso(curso), []);
});

test("F7.46: dados curriculares não são transferidos entre campi", () => {
  const linhas = curso.blocos.find(b => b.tipo === "tabela" && b.colunas[0] === "Campus").linhas;
  const cl = linhas.find(l => l[0] === "Conselheiro Lafaiete");
  const ip = linhas.find(l => l[0] === "Ipatinga");
  assert.equal(cl[3], "4 semestres");
  assert.equal(cl[4], "1.202 horas");
  assert.equal(ip[3], "3 semestres");
  assert.equal(ip[4], "1.400 horas");
  assert.equal(cl.at(-1), "Informação incompleta");
  assert.equal(ip.at(-1), "Informação incompleta");
  const local = curso.blocos.find(b => b.tipo === "faq" && b.titulo === "Informações dos campi");
  assert.equal(local.itens.length, 2);
  assert.match(local.itens[0].resposta, /não é obrigatório/);
  assert.match(local.itens[1].resposta, /200 horas obrigatórias/);
});

test("F7.46: galeria por experiência, sem atribuir atividade do integrado", () => {
  const galerias = curso.blocos.filter(b => b.tipo === "galeria");
  assert.equal(galerias.length, 2);
  assert.ok(galerias.every(g => g.itens.length === 0));
  const ix = curso.blocos.findIndex(b => b.tipo === "texto" && b.titulo === "Experiências e conquistas dos estudantes");
  assert.match(curso.blocos[ix].conteudo, /27 de fevereiro de 2026/);
  assert.equal(curso.blocos[ix + 1].tipo, "galeria");
  assert.ok(!/bolsistas de Ipatinga|premiados de Ipatinga/i.test(all));
});

test("F7.46: dados e orientação atemporais, encerramento e nenhuma nota privada", () => {
  assert.ok(curso.blocos.at(-2).titulo === "Forma de ingresso");
  assert.ok(curso.blocos.at(-1).titulo === "Mundo do Trabalho");
  assert.match(txt("Forma de ingresso").conteudo, /ensino médio/);
  assert.ok(!/vagas de 2027|40 vagas|1\.204 horas|eduardo\.pereira@ifmg\.edu\.br/i.test(all));
  assert.ok(!/https:\/\/www\.ifmg\.edu\.br/i.test(all));
  assert.ok(!/validacao|revisao_coordenacao|pendencias/.test(Object.keys(curso).join(" ")));
});
