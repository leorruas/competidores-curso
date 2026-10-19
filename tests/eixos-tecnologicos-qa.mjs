import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const eixos = new Set([
  "Ambiente e Saúde",
  "Controle e Processos Industriais",
  "Desenvolvimento Educacional e Social",
  "Gestão e Negócios",
  "Informação e Comunicação",
  "Infraestrutura",
  "Militar",
  "Produção Alimentícia",
  "Produção Cultural e Design",
  "Produção Industrial",
  "Recursos Naturais",
  "Segurança",
  "Turismo, Hospitalidade e Lazer"
]);

const data = JSON.parse(readFileSync(new URL("../data/cursos-publicados.json", import.meta.url), "utf8"));
const cursos = data.courses;
const eixo = c => c.blocos.find(b => b.tipo === "dados-basicos")?.campos.filter(f => f.rotulo === "Eixo tecnológico") ?? [];
const obter = id => cursos.find(c => c.id === id);

test("todos os cursos têm exatamente um eixo tecnológico do vocabulário MEC", () => {
  assert.ok(cursos.length > 0);
  for (const curso of cursos) {
    const campos = eixo(curso);
    assert.equal(campos.length, 1, curso.id + ": ausente ou duplicado");
    assert.ok(eixos.has(campos[0].valor), curso.id + ": eixo fora da lista MEC: " + campos[0].valor);
  }
});

test("modalidades e casos editoriais seguem o mesmo critério", () => {
  for (const [id, esperado] of [
    ["tecnico-em-meio-ambiente-integrado", "Ambiente e Saúde"],
    ["tecnico-em-meio-ambiente-subsequente", "Ambiente e Saúde"],
    ["tecnico-em-informatica-integrado", "Informação e Comunicação"],
    ["tecnico-em-informatica-eja", "Informação e Comunicação"],
    ["tecnico-em-planejamento-e-controle-da-producao-integrado", "Produção Industrial"],
    ["tecnico-em-planejamento-e-controle-da-producao-eja", "Produção Industrial"],
    ["tecnico-em-biotecnologia-integrado", "Produção Industrial"],
    ["tecnico-em-agroindustria-integrado", "Produção Alimentícia"],
    ["conservacao-e-restauro-tecnologo", "Produção Cultural e Design"],
    ["design-de-interiores-tecnologo", "Produção Cultural e Design"],
    ["medicina-veterinaria-bacharelado", "Ambiente e Saúde"],
    ["direito-bacharelado-arcos", "Desenvolvimento Educacional e Social"]
  ]) {
    const curso = obter(id);
    assert.ok(curso, "curso ausente: " + id);
    assert.equal(eixo(curso)[0]?.valor, esperado, id);
  }
});
