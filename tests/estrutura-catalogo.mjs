import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validarEstruturaCurso } from "../scripts/validar-estrutura.mjs";

const catalogo = JSON.parse(readFileSync("data/cursos-publicados.json", "utf8"));

test("todos os cursos obedecem ao contrato sem contagem fixa de itens", () => {
  const ids = new Set();
  for (const c of catalogo.courses) {
    assert.ok(!ids.has(c.id), "ID duplicado: " + c.id);
    ids.add(c.id);
    assert.deepEqual(validarEstruturaCurso(c), [], "estrutura de " + c.id);
  }
  assert.ok(ids.has("tecnico-em-edificacoes-integrado"), "curso piloto removido");
});

test("um curso novo pode ser incluído sem atualizar listas de ID e galerias", () => {
  const novo = structuredClone(catalogo.courses.find(c => c.id === "tecnico-em-biotecnologia-integrado"));
  novo.id = "novo-curso-simulacao";
  novo.nome = "Curso de teste";
  assert.deepEqual(validarEstruturaCurso(novo), []);
});

test("impede retirada de galeria após experiência de estudante", () => {
  const c = structuredClone(catalogo.courses.find(c => c.id === "tecnico-em-biotecnologia-integrado"));
  const i = c.blocos.findIndex(b => b.titulo === "Experiências e conquistas dos estudantes");
  c.blocos.splice(i + 1, 1);
  assert.ok(validarEstruturaCurso(c).some(x => x.includes("imediatamente depois")));
});

test("impede galeria órfã e referência duplicada", () => {
  const c = structuredClone(catalogo.courses.find(c => c.id === "tecnico-em-biotecnologia-integrado"));
  const i = c.blocos.findIndex(b => b.tipo === "galeria");
  c.blocos[i].referencia = c.blocos.find((b, k) => k !== i && b.tipo === "galeria").referencia;
  assert.ok(validarEstruturaCurso(c).some(x => x.includes("repetida")));
  c.blocos.splice(i - 1, 1);
  assert.ok(validarEstruturaCurso(c).some(x => x.includes("galeria")));
});

test("impede remover campus da tabela ou alterar seções finais", () => {
  const c = structuredClone(catalogo.courses.find(c => c.id === "tecnico-em-automacao-industrial-integrado"));
  const t = c.blocos.find(b => b.tipo === "tabela" && b.colunas[0] === "Campus");
  t.linhas.pop();
  assert.ok(validarEstruturaCurso(c).some(x => x.includes("exatamente os campi")));
  c.blocos.pop();
  assert.ok(validarEstruturaCurso(c).some(x => x.includes("dois últimos")));
});
