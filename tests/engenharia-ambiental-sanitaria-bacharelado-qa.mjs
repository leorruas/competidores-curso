import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const data = JSON.parse(readFileSync("data/cursos-publicados.json", "utf8"));
const course = data.courses.find(x => x.id === "engenharia-ambiental-e-sanitaria-bacharelado");
const blocks = course?.blocos ?? [];
test("F7.27: bacharelado EAS Governador Valadares e PPC atualizado", () => {
  assert.ok(course);
  assert.equal(course.nome, "Engenharia Ambiental e Sanitária");
  assert.equal(course.tipo, "Bacharelado");
  assert.deepEqual(course.campi, ["Governador Valadares"]);
  const fields = Object.fromEntries(blocks[0].campos.map(x => [x.rotulo, x.valor]));
  assert.equal(fields["Carga horária total"], "3.600 horas");
  assert.match(fields["PPC / matriz"], /2026/);
  assert.equal(fields["E-mail da coordenação"], "coordenacao.eas.gv@ifmg.edu.br");
  assert.match(fields["Turno"], /Manhã e noite/);
  const campusTable = blocks.find(x => x.tipo === "tabela" && x.colunas[0] === "Campus");
  assert.equal(campusTable.linhas.length, 1);
  const faq = blocks.find(x => x.tipo === "faq" && !x.titulo);
  assert.ok(faq.itens.some(x => /300 horas/.test(x.resposta) && /4º período/.test(x.resposta)));
  assert.ok(faq.itens.some(x => /100 horas/.test(x.resposta)));
  assert.deepEqual(blocks.slice(-2).map(x => x.titulo), ["Forma de ingresso", "Mundo do Trabalho"]);
  assert.ok(!JSON.stringify(course).includes("3.993,33"));
});
test("F7.27: três experiências 2025, galerias próprias, egressa COP30", () => {
  const first = blocks.findIndex(x => x.titulo === "Experiências e conquistas dos estudantes");
  assert.ok(first > 0);
  for (const i of [first, first + 2, first + 4]) {
    assert.equal(blocks[i].tipo, "texto");
    assert.equal(blocks[i+1].tipo, "galeria");
    assert.equal(blocks[i+1].itens.length, 0);
  }
  assert.match(blocks[first].conteudo, /janeiro de 2025/);
  assert.match(blocks[first + 2].conteudo, /outubro de 2025/);
  assert.match(blocks[first + 4].conteudo, /egressa/);
  assert.match(blocks[first + 4].conteudo, /novembro de 2025/);
  assert.equal(blocks.filter(x => x.tipo === "galeria").length, 4);
  const sorted = [...data.courses].sort((a,b) => a.nome.localeCompare(b.nome, "pt-BR", {sensitivity:"base", numeric:true}) || String(a.tipo||"").localeCompare(String(b.tipo||""), "pt-BR") || a.id.localeCompare(b.id, "pt-BR"));
  assert.deepEqual(data.courses.map(x => x.id), sorted.map(x => x.id));
});
