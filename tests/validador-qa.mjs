import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const base = JSON.parse(readFileSync(
  fileURLToPath(new URL("../data/cursos-publicados.json", import.meta.url)), "utf8"
));
const validator = fileURLToPath(new URL("../scripts/validar-publicacao.mjs", import.meta.url));

function runValidation(mutate) {
  const dir = mkdtempSync(join(tmpdir(), "ifmg-validacao-"));
  try {
    mkdirSync(join(dir, "data"));
    const fixture = structuredClone(base);
    mutate?.(fixture);
    writeFileSync(join(dir, "data", "cursos-publicados.json"), JSON.stringify(fixture), "utf8");
    const result = spawnSync(process.execPath, [validator], {
      cwd: dir, encoding: "utf8", timeout: 8000, maxBuffer: 1024 * 1024
    });
    assert.equal(result.error, undefined, result.error?.message);
    return {status: result.status, output: result.stdout + result.stderr};
  } finally {
    rmSync(dir, {recursive: true, force: true});
  }
}

test("catálogo atual passa no validador", () => {
  const result=runValidation();
  assert.equal(result.status, 0, result.output);
  assert.match(result.output, /Catálogo validado/);
});

test("não aceita curso sem autorização", () => {
  const result=runValidation(data => { data.courses[0].publicacao_autorizada=false; });
  assert.notEqual(result.status, 0);
  assert.match(result.output, /autorização explícita/);
});

test("rejeita links ao portal legado e aceita endereço do portal atual", () => {
  const old=runValidation(data => {
    const links=data.courses[0].blocos.find(b=>b.tipo==="links");
    assert.ok(links?.itens?.length);
    links.itens[0].url="https://www.ifmg.edu.br/portal/processo-seletivo/cursos";
  });
  assert.notEqual(old.status, 0);
  assert.match(old.output, /links inválidos/);
  const current=runValidation(data => {
    const links=data.courses[0].blocos.find(b=>b.tipo==="links");
    links.itens[0].url="https://portal.ifmg.edu.br/estudantes/como-ingressar-no-ifmg/";
  });
  assert.equal(current.status,0,current.output);
});

test("rejeita vazamento do repositório privado", () => {
  const result=runValidation(data => {
    data.courses[0].blocos.find(b=>b.tipo==="texto").conteudo+="\nBenchmark/Dados/arquivo.csv";
  });
  assert.notEqual(result.status, 0);
  assert.match(result.output, /vault privada/);
});

test("detecta tabela com linhas de tamanhos diferentes", () => {
  const result=runValidation(data => {
    const table=data.courses[0].blocos.find(b=>b.tipo==="tabela");
    assert.ok(table?.linhas?.length);
    table.linhas[0].pop();
  });
  assert.notEqual(result.status, 0);
  assert.match(result.output, /número de colunas divergente/);
});

test("não deixa texto copiável falar como um relatório de pesquisa", () => {
  const result=runValidation(data => {
    const text=data.courses[0].blocos.find(b=>b.tipo==="texto");
    text.conteudo="A página do curso apresenta referências acadêmicas.";
  });
  assert.notEqual(result.status, 0);
  assert.match(result.output, /texto copiável contém frase de apuração/);
});

test("identificador duplicado impede publicação", () => {
  const result=runValidation(data => {data.courses[1].id=data.courses[0].id;});
  assert.notEqual(result.status, 0);
  assert.match(result.output, /identificador duplicado/);
});

test("rejeita metadados privados em qualquer nível do JSON público", () => {
  for (const k of ["validacao","pendencias","revisao_coordenacao","instrucao"]) {
    const result=runValidation(data => {data.courses[0].blocos[0].campos[0][k]="nota interna";});
    assert.notEqual(result.status,0,k);
    assert.match(result.output,/metadado de auditoria/,k);
  }
});

// O validador de publicação também aplica a regra de continuidade ao JSON,
// independentemente dos testes unitários do contrato estrutural.
test("F8.3A: publicação da pós permite continuidade apenas com nível acima", () => {
  function preparar(data, nivelAlvo) {
    const curso = data.courses.find(c => c.nivel === "Graduação" &&
      c.blocos.some(b => b.titulo === "Continue seus estudos no IFMG"));
    assert.ok(curso);
    curso.nivel = "Pós-graduação";
    curso.tipo = "Especialização";
    const inicio = curso.blocos.findIndex(b => b.titulo === "Continue seus estudos no IFMG");
    const fim = curso.blocos.findIndex(b => b.titulo === "Experiências e conquistas dos estudantes");
    curso.blocos.splice(inicio, fim - inicio,
      {tipo:"texto",titulo:"Continue seus estudos no IFMG",conteudo:""},
      {tipo:"tabela",colunas:["Curso","Campus","Nível","Relação com o curso"],
        linhas:[["Mestrado Profissional em Administração","Formiga",nivelAlvo,
          "Aprofunda pesquisa aplicada em Finanças."]]}
    );
  }
  const acima = runValidation(data => preparar(data,"Mestrado profissional"));
  assert.equal(acima.status, 0, acima.output);
  const igual = runValidation(data => preparar(data,"Especialização"));
  assert.notEqual(igual.status, 0);
  assert.match(igual.output, /somente formação de nível acima/);
});

test("F8.3A: publicação da pós permite omitir continuidade quando não há nível acima", () => {
  const result = runValidation(data => {
    const curso = data.courses.find(c => c.nivel === "Graduação" &&
      c.blocos.some(b => b.titulo === "Continue seus estudos no IFMG"));
    assert.ok(curso);
    curso.nivel = "Pós-graduação";
    curso.tipo = "Mestrado profissional";
    const inicio = curso.blocos.findIndex(b => b.titulo === "Continue seus estudos no IFMG");
    const fim = curso.blocos.findIndex(b => b.titulo === "Experiências e conquistas dos estudantes");
    curso.blocos.splice(inicio, fim - inicio);
  });
  assert.equal(result.status, 0, result.output);
});
