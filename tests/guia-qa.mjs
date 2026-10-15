import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync("app.js", "utf8");
const html = readFileSync("index.html", "utf8");
const css = readFileSync("style.css", "utf8");
const json = JSON.parse(readFileSync("data/cursos-publicados.json", "utf8"));

function testContext(clipboard = {}) {
  const elements = new Map();
  const document = {
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, {innerHTML: "", textContent: "", value: ""});
      return elements.get(id);
    }
  };
  const clipboardState = { items: [], plain: [] };
  class TestClipboardItem {
    constructor(data) { this.data = data; }
  }
  const api = {
    async write(items) {
      if (clipboard.failRich) throw Error("ClipboardItem não aceito");
      clipboardState.items.push(...items);
    },
    async writeText(text) { clipboardState.plain.push(text); }
  };
  const sandbox = {
    URL, Blob, ClipboardItem: clipboard.noRich ? undefined : TestClipboardItem,
    navigator: {clipboard: api}, document,
    console:{warn(){}, error(){}},
    location:{hash:"#catalogo", replace(){}},
    window:{scrollTo(){}, addEventListener(){}}
  };
  const ending = "  init();\n})();";
  assert.ok(source.includes(ending),"Não foi possível isolar a aplicação para testes");
  const instrumented = source.replace(ending,
    "  return {demo,state,editorFields,editorBlock,blockCopy,tableHTML,richHTML,copyValue,renderCatalog,isApprovedCourse};\n})();");
  const hooks = vm.runInNewContext(instrumented, vm.createContext(sandbox), {timeout:2500});
  return { ...hooks, elements, clipboardState };
}

test("a home é o catálogo e não uma página de apresentação", () => {
  assert.match(html,/id="home-view"/);
  assert.doesNotMatch(html,/id="catalog-view"/);
  assert.match(html,/id="catalog-filters"/);
  assert.match(html,/<h1>cursos<\/h1>/);
  assert.match(html,/<h1>como usar<\/h1>/);
  assert.match(html,/guiaportalifmg\/#\/04%20-%20Sou%20editor\/15%20-%20Sou%20editor/);
  assert.doesNotMatch(html,/Encontre o curso, escolha o bloco/);
});

test("o catálogo inclui somente roteiros autorizados com pendências explícitas", () => {
  assert.equal(json.schemaVersion,1);
  assert.ok(json.courses.length >= 8,"O catálogo não pode perder os oito roteiros já publicados");
  assert.ok(json.courses.every(c=>c.publicacao_autorizada===true && ["em_validacao","aprovado_para_divulgacao"].includes(c.status) && (c.status!=="em_validacao" || (c.revisao_coordenacao===true && c.pendencias.length>0))));
  const h=testContext();
  assert.ok(json.courses.every(c=>h.isApprovedCourse(c)));
  assert.equal(h.isApprovedCourse({...json.courses[0],publicacao_autorizada:false}),false);
  assert.equal(h.isApprovedCourse({...json.courses[0],pendencias:[]}),false);
  assert.equal(h.isApprovedCourse({...json.courses[0],status:"pendente"}),false);
});

test("a demonstração fictícia não se mistura aos cursos reais", () => {
  assert.equal(json.schemaVersion,1);
  const h=testContext();
  assert.equal(h.isApprovedCourse(h.demo),false);
});

test("a tela vazia é breve e a demonstração é explicitamente fictícia", () => {
  const h=testContext();
  h.renderCatalog();
  const content=h.elements.get("catalog-results").innerHTML;
  assert.match(content,/Nenhum curso publicado\./);
  assert.match(content,/Exemplo fictício/);
  assert.match(content,/Demonstração/);
  assert.doesNotMatch(content,/validação editorial|guia usando um exemplo inteiramente/i);
  assert.equal((content.match(/<button/g)||[]).length,0);
  h.state.query="xyz-not-found";
  h.renderCatalog();
  const filtered=h.elements.get("catalog-results").innerHTML;
  assert.match(filtered,/Nenhum resultado\./);
  assert.doesNotMatch(filtered,/href="#curso\/demonstracao"/);
});

test("campos incompletos aparecem identificados sem botão de copiar", () => {
  const h=testContext();
  const course=json.courses.find(c=>c.id==="direito-bacharelado-arcos");
  const dados=course.blocos.find(b=>b.tipo==="dados-basicos");
  const fields=h.editorFields(dados);
  const idx=fields.findIndex(x=>x.value==="Informação incompleta");
  assert.ok(idx>=0);
  assert.match(h.fieldHTML ? h.fieldHTML(fields[idx],0,idx) : h.editorBlock(dados,0),/Informação incompleta/);
  const displayed=h.editorBlock(dados,0);
  assert.doesNotMatch(displayed,/Precisa de validação|Confirmar|Levantar avaliações|Listar projetos efetivamente/);
  assert.match(displayed,/Informação incompleta/);
  const gallery=course.blocos.find(b=>b.tipo==="galeria");
  assert.equal(gallery.itens.length,0);
  assert.match(h.editorBlock(gallery,3),/Informação incompleta/);
});

test("catálogo mantém ofertas reais e filtros multicampi", () => {
  const h=testContext();
  h.state.courses=json.courses;
  h.renderCatalog();
  const text=h.elements.get("catalog-results").innerHTML;
  assert.match(text,/<h2>Técnico em Edificações<\/h2>/);
  assert.match(text,/Técnico em Logística/);
  assert.match(text,/Direito/);
  assert.doesNotMatch(text,/Exemplo fictício/);
  h.state.campus="Arcos";
  h.renderCatalog();
  const onlyArcos=h.elements.get("catalog-results").innerHTML;
  assert.match(onlyArcos,/Direito/);
  assert.doesNotMatch(onlyArcos,/Edificações Integrado/);
});

test("fase 1: galeria acompanha projetos e Administração não tem link ou destaque genérico", () => {
  const eng=json.courses.find(c=>c.id==="engenharia-mecanica-bacharelado-arcos");
  const p=eng.blocos.findIndex(b=>b.tipo==="texto"&&b.titulo==="Projetos e experiências acadêmicas");
  assert.equal(eng.blocos[p+1].tipo,"introducao");
  assert.equal(eng.blocos[p+2].tipo,"galeria");
  const a=json.courses.find(c=>c.id==="administracao-bacharelado");
  assert.ok(!a.blocos.some(b=>b.tipo==="link-unico"&&b.link.rotulo==="Administração no IFMG"));
  assert.ok(!a.blocos.some(b=>b.tipo==="introducao"&&b.conteudo.startsWith("O curso reúne seis campi")));
  const e=json.courses.find(c=>c.id==="tecnico-em-edificacoes-integrado");
  assert.equal(e.nome,"Técnico em Edificações");
  assert.equal(e.blocos.find(b=>b.tipo==="texto").titulo,"Técnico em Edificações");
  const tec=json.courses.find(c=>c.id==="tecnico-em-administracao-integrado");
  const achievement=tec.blocos.find(b=>b.titulo==="Experiências e conquistas dos estudantes");
  assert.equal(achievement.conteudo,"Informação incompleta");
  assert.ok(achievement.validacao);
});

test("bacharelados essenciais mantêm dados, FAQ, destaques e campos de validação", () => {
  const ids=["engenharia-mecanica-bacharelado-arcos","administracao-bacharelado",
    "agronomia-bacharelado-bambui","engenharia-de-producao-bacharelado-bambui"];
  const h=testContext();
  for (const id of ids) {
    const curso=json.courses.find(c=>c.id===id);
    assert.ok(curso,id);
    assert.ok(curso.blocos.length>=12,"O roteiro precisa ter os componentes editoriais essenciais");
    assert.ok(curso.pendencias.length>=3);
    assert.ok(h.isApprovedCourse(curso));
    const intro=curso.blocos.filter(b=>b.tipo==="introducao");
    assert.ok(intro.length>=1,"A formação precisa ter destaques editoriais");
    assert.ok(intro.every(b=>b.conteudo.length<=280));
    const faq=curso.blocos.find(b=>b.tipo==="faq");
    assert.ok(faq.itens.length>=3,"FAQ precisa cobrir dúvidas substantivas");
    assert.ok(curso.blocos.some(b=>b.tipo==="galeria"&&b.validacao));
    assert.ok(curso.blocos.some(b=>b.tipo==="links"&&b.itens.some(x=>x.url.startsWith("https://portal.ifmg.edu.br/estudantes/como-ingressar-no-ifmg/"))));
  }
});

test("Administração reúne seis campi e não repete FAQ de turno", () => {
  const course=json.courses.find(c=>c.id==="administracao-bacharelado");
  const h=testContext();
  const campi=["Bambuí","Formiga","Ouro Branco","Ribeirão das Neves","Sabará","São João Evangelista"];
  assert.deepEqual(course.campi,campi);
  const offer=course.blocos.find(b=>b.tipo==="tabela"&&b.colunas.includes("E-mail da coordenação"));
  assert.equal(offer.linhas.length,6);
  assert.ok(offer.linhas.every(row=>row.length===offer.colunas.length));
  const faq=course.blocos.find(b=>b.tipo==="faq");
  assert.deepEqual(faq.itens.map(x=>x.pergunta),campi);
  assert.equal(course.blocos.filter(b=>b.tipo==="texto")[0].titulo,"Administração");
  assert.ok(h.isApprovedCourse(course));
  assert.ok(course.aliases.includes("administracao-bacharelado-bambui"));
});

test("as seções editoriais existem, independentemente da posição contextual da galeria", () => {
  const h=testContext();
  for (const c of json.courses) {
    const gallery=c.blocos.find(b=>b.tipo==="galeria");
    assert.ok(gallery,c.nome);
    const texts=c.blocos.filter(b=>b.tipo==="texto");
    const titles=texts.map(b=>b.titulo || "");
    assert.ok(titles.some(t=>/Reconhecimentos/i.test(t)),c.nome);
    assert.ok(titles.some(t=>/Pesquisa/i.test(t)),c.nome);
    assert.ok(titles.some(t=>/Continue seus estudos/i.test(t)),c.nome);
    assert.ok(titles.some(t=>/Experiências/i.test(t)),c.nome);
    for (const b of texts.filter(b=>b.conteudo==="Informação incompleta")) {
      assert.ok(b.titulo,c.nome+": seção incompleta precisa de título");
      const fields=h.editorFields(b);
      assert.equal(fields[0].label,"Título da seção");
      assert.equal(fields[0].value,b.titulo);
      assert.equal(fields[1].value,"Informação incompleta");
      const markup=h.editorBlock(b,2);
      assert.equal((markup.match(/data-copy-field=/g)||[]).length,1);
      assert.doesNotMatch(markup,/Precisa de validação|confirmar com a coordenação/i);
    }
  }
});

test("Técnico em Administração Integrado agrupa 8 campi sem misturar o bacharelado", () => {
  const h=testContext();
  const tec=json.courses.find(c=>c.id==="tecnico-em-administracao-integrado");
  const bach=json.courses.find(c=>c.id==="administracao-bacharelado");
  assert.ok(tec && bach);
  assert.equal(tec.campi.length,8);
  assert.equal(bach.campi.length,6);
  assert.equal(tec.nivel,"Técnico");
  assert.equal(tec.tipo,"Integrado");
  assert.equal(bach.tipo,"Bacharelado");
  assert.ok(h.isApprovedCourse(tec));
  const table=tec.blocos.find(b=>b.tipo==="tabela"&&b.colunas.includes("E-mail da coordenação"));
  assert.equal(table.linhas.length,8);
  assert.ok(tec.blocos.find(b=>b.tipo==="faq").itens.some(x=>x.pergunta==="Sabará"&&x.resposta.includes("16,67%")));
});

test("título permanece copiável quando Texto tem conteúdo incompleto", () => {
  const h=testContext();
  const c=json.courses.find(x=>x.id==="administracao-bacharelado");
  const b=c.blocos.find(x=>x.tipo==="texto"&&x.titulo==="Pesquisa, extensão e oportunidades");
  assert.ok(b);
  const fields=h.editorFields(b);
  assert.equal(fields.length,2);
  assert.equal(fields[0].label,"Título da seção");
  assert.equal(fields[0].value,"Pesquisa, extensão e oportunidades");
  assert.match(fields[0].html,/<h2>Pesquisa, extensão e oportunidades<\/h2>/);
  assert.equal(fields[1].value,"Informação incompleta");
  const html=h.editorBlock(b,5);
  assert.equal((html.match(/data-copy-field=/g)||[]).length,1);
  assert.doesNotMatch(html,/Levantar|Listar projetos|Confirmar|Precisa de validação/);
});

test("nenhum roteiro oferece links para sites antigos do IFMG", () => {
  for(const course of json.courses) {
    const items=course.blocos.flatMap(b=>b.tipo==="links"?b.itens:b.tipo==="link-unico"?[b.link]:[]);
    assert.ok(items.some(x=>x.url==="https://portal.ifmg.edu.br/estudantes/como-ingressar-no-ifmg/"),course.id);
    assert.ok(items.some(x=>x.url==="https://portal.ifmg.edu.br/estudantes/como-ingressar-no-ifmg/reserva-de-vagas-cotas/"),course.id);
    for(const x of items)assert.doesNotMatch(x.url,/^https?:\/\/(?!portal\.ifmg\.edu\.br)[^/]*\.ifmg\.edu\.br\//);
  }
});

test("Direito tem FAQ orientado a escolha e não duplica a própria página", () => {
  const c=json.courses.find(x=>x.id==="direito-bacharelado-arcos");
  const faq=c.blocos.find(x=>x.tipo==="faq");
  const qs=faq.itens.map(x=>x.pergunta);
  assert.ok(qs.some(x=>x.includes("ingressar")));
  assert.ok(qs.some(x=>x.includes("experiências práticas")));
  assert.ok(!qs.some(x=>/Núcleo de Práticas Jurídicas|diploma permite advogar/i.test(x)));
  assert.match(faq.itens[0].resposta,/Histórico Escolar e Redação/);
  assert.match(faq.itens[0].resposta,/Sisu/);
  assert.ok(!c.blocos.some(b=>b.tipo==="texto"&&/A página do curso apresenta referências/.test(b.conteudo)));
});

test("Texto é um único campo: título e parágrafos com negrito", () => {
  const h=testContext();
  const b=h.demo.blocos.find(x=>x.tipo==="texto"&&x.conteudo);
  const fields=h.editorFields(b);
  assert.equal(fields.length,1);
  assert.match(fields[0].html,/<h2>Sobre o curso<\/h2>/);
  assert.match(fields[0].html,/<strong>negrito<\/strong>/);
  assert.match(fields[0].value,/Sobre o curso/);
  assert.equal((h.editorBlock(b,1).match(/data-copy-field=/g)||[]).length,1);
});

test("Tabela inteira: um botão e estrutura HTML mais TSV", () => {
  const h=testContext();
  const b=h.demo.blocos.find(x=>x.tipo==="tabela");
  const fields=h.editorFields(b);
  assert.equal(fields.length,1);
  assert.equal(fields[0].table,true);
  assert.match(fields[0].html,/^<table><thead><tr><th>Campus<\/th><th>Turno<\/th>/);
  assert.equal((fields[0].html.match(/<tr>/g)||[]).length,3);
  assert.equal(fields[0].value,"Campus\tTurno\nCampus fictício\tDiurno\nOutra unidade fictícia\tNoturno");
  const rendered=h.editorBlock(b,3);
  assert.match(rendered,/>Copiar tabela/);
  assert.equal((rendered.match(/data-copy-field=/g)||[]).length,1);
  assert.doesNotMatch(rendered,/data-copy-whole|copiar formatado/);
});

test("Link único: selecionar estilo; copiar título, descrição e URL", () => {
  const h=testContext();
  const b=h.demo.blocos.find(x=>x.tipo==="link-unico");
  const fields=h.editorFields(b);
  assert.deepEqual(Array.from(fields,x=>x.label),["Estilo","Título / texto do link","Descrição","URL"]);
  assert.equal(fields[0].setting,true);
  assert.ok(fields.slice(1).every(x=>!x.setting));
  const rendered=h.editorBlock(b,6);
  assert.equal((rendered.match(/data-copy-field=/g)||[]).length,3);
  assert.doesNotMatch(rendered,/Exemplo de como o Link único aparece|block-link-example/);
});

test("FAQ copia cada pergunta e resposta sem copiar o bloco inteiro", () => {
  const h=testContext();
  const b=h.demo.blocos.find(x=>x.tipo==="faq");
  assert.equal(h.editorFields(b).length,b.itens.length*2);
  assert.doesNotMatch(h.editorBlock(b,5),/Copiar bloco completo/);
});

test("número de bloco 08 se destaca e tipos têm títulos únicos", () => {
  const h=testContext();
  const example=h.demo.blocos.find(x=>x.tipo==="texto");
  const rendered=h.editorBlock(example,7);
  assert.match(rendered,/class="block-badge"[^>]*>08<\/span>/);
  assert.match(rendered,/class="block-card-title"/);
  assert.doesNotMatch(rendered,/block-kicker|block-instructions|block-section-name/);
  assert.match(css,/\.block-badge\s*\{/);
  assert.match(css,/left:-85px/);
});

test("HTML copiado escapa tags desconhecidas e suporta negrito", () => {
  const h=testContext();
  const rich=h.richHTML("<script>alert(1)</script> e **negrito**");
  assert.doesNotMatch(rich,/<script>/);
  assert.match(rich,/&lt;script&gt;/);
  assert.match(rich,/<strong>negrito<\/strong>/);
});

test("área de transferência envia HTML+texto simples quando permitido", async () => {
  const h=testContext();
  const result=await h.copyValue("Título\n\n**negrito**","<h2>Título</h2><p><strong>negrito</strong></p>");
  assert.equal(result,"rich");
  assert.equal(h.clipboardState.items.length,1);
  const data=h.clipboardState.items[0].data;
  assert.ok(data["text/html"]);
  assert.ok(data["text/plain"]);
  assert.equal(await data["text/plain"].text(),"Título\n\nnegrito");
  assert.match(await data["text/html"].text(),/<strong>negrito<\/strong>/);
});

test("sem suporte à cópia rica, usa texto simples", async () => {
  const h=testContext({failRich:true});
  const result=await h.copyValue("Valor **importante**","<strong>Valor importante</strong>");
  assert.equal(result,"plain");
  assert.deepEqual(h.clipboardState.plain,["Valor importante"]);
});

test("identificadores estáticos não estão duplicados", () => {
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
  assert.equal(ids.length,new Set(ids).size);
  const balance=[...css].reduce((sum,char)=>sum+(char==="{")-(char==="}"),0);
  assert.equal(balance,0);
});
