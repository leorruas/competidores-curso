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


test("dados básicos seguem ordem de cadastro e apresentação com até 180 caracteres", () => {
  const ordem = ["Categoria","Tipo de oferta","Carga horária","Duração","Apresentação","Modalidade","Eixo tecnológico","Campi"];
  for (const curso of catalogo.courses) {
    const campos = curso.blocos[0].campos;
    assert.deepEqual(campos.slice(0, 8).map(c => c.rotulo), ordem, curso.id);
    assert.ok(campos[4].valor.length >= 50 && campos[4].valor.length <= 180, curso.id);
    assert.equal(campos[7].valor, curso.campi.join("; "), curso.id);
  }
});

test("rejeita campo deslocado, apresentação acima do limite e tipo incompatível", () => {
  const original = catalogo.courses.find(c => c.id === "administracao-bacharelado");
  const foraDeOrdem = structuredClone(original);
  [foraDeOrdem.blocos[0].campos[2], foraDeOrdem.blocos[0].campos[3]] =
    [foraDeOrdem.blocos[0].campos[3], foraDeOrdem.blocos[0].campos[2]];
  assert.ok(validarEstruturaCurso(foraDeOrdem).some(e => e.includes("ordem obrigatória")));
  const longo = structuredClone(original);
  longo.blocos[0].campos[4].valor = "A".repeat(181);
  assert.ok(validarEstruturaCurso(longo).some(e => e.includes("180 caracteres")));
  const trocado = structuredClone(original);
  trocado.blocos[0].campos[1].valor = "Licenciaturas";
  assert.ok(validarEstruturaCurso(trocado).some(e => e.includes("tipo de oferta incompatível")));
});

test("todas as tabelas do catálogo mantêm cabeçalho selecionado e legenda em branco", () => {
  let count=0;
  for(const course of catalogo.courses) for(const b of course.blocos) {
    if(b.tipo!=="tabela")continue;
    count++;
    assert.equal(b.cabecalhoPrimeiraLinha,true,course.id);
    assert.ok(b.legenda === undefined || b.legenda === "",course.id);
  }
  assert.ok(count >= catalogo.courses.length);
});

test("validação estrutural rejeita tabela nova sem cabeçalho ou com legenda", () => {
  const first = structuredClone(catalogo.courses[0]);
  const idx=first.blocos.findIndex(b=>b.tipo==="tabela");
  delete first.blocos[idx].cabecalhoPrimeiraLinha;
  assert.ok(validarEstruturaCurso(first).some(x=>x.includes("primeira linha como cabeçalho")));
  first.blocos[idx].cabecalhoPrimeiraLinha=true;
  first.blocos[idx].legenda="Legenda desnecessária";
  assert.ok(validarEstruturaCurso(first).some(x=>x.includes("Legenda da tabela deve ficar em branco")));
  delete first.blocos[idx].legenda;
  assert.deepEqual(validarEstruturaCurso(first),[]);
});
