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

test("o catálogo inclui somente roteiros autorizados sem controles privados", () => {
  assert.equal(json.schemaVersion,1);
  assert.ok(json.courses.length >= 8,"O catálogo não pode perder os oito roteiros já publicados");
  assert.ok(json.courses.every(c=>c.publicacao_autorizada===true && ["em_validacao","aprovado_para_divulgacao"].includes(c.status) && !("pendencias" in c) && !("revisao_coordenacao" in c)));
  const h=testContext();
  assert.ok(json.courses.every(c=>h.isApprovedCourse(c)));
  assert.equal(h.isApprovedCourse({...json.courses[0],publicacao_autorizada:false}),false);
  assert.equal(h.isApprovedCourse({...json.courses[0],blocos:[]}),false);
  assert.equal(h.isApprovedCourse({...json.courses[0],status:"pendente"}),false);
});

test("metadados de pesquisa não vazam e placeholders não são copiáveis", () => {
  const forbidden=new Set(["validacao","pendencias","revisao_coordenacao","instrucao"]);
  function walk(v) {
    if (Array.isArray(v)) return v.forEach(walk);
    if (v&&typeof v==="object") for (const [k,x]of Object.entries(v)) {
      assert.ok(!forbidden.has(k),"chave privada "+k);
      walk(x);
    }
  }
  walk(json);
  const h=testContext();
  for (const c of json.courses) {
    for (const b of c.blocos.filter(x=>x.tipo==="texto"&&x.conteudo==="Informação incompleta")) {
      assert.equal(h.editorFields(b)[0].label,"Título da seção");
      assert.equal((h.editorBlock(b,0).match(/data-copy-field=/g)||[]).length,1);
    }
    const gallery=c.blocos.find(x=>x.tipo==="galeria"&&!x.itens.length);
    if(gallery)assert.equal((h.editorBlock(gallery,0).match(/data-copy-field=/g)||[]).length,0);
  }
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

test("F3.6: Logística e Administração técnica descrevem tarefas concretas em Mundo do Trabalho", () => {
  const cases=[
    ["tecnico-em-logistica-subsequente",["controle de estoques","planejamento de rotas","relatórios","transportadoras"]],
    ["tecnico-em-administracao-integrado",["atualizar cadastros","orçamentos","sistemas de informação","organizações sociais"]]
  ];
  for(const [id,terms] of cases) {
    const c=json.courses.find(x=>x.id===id);
    const work=c.blocos.find(x=>x.tipo==="texto"&&x.titulo==="Mundo do Trabalho");
    assert.ok(work,id);
    for(const term of terms)assert.ok(work.conteudo.includes(term),id+": "+term);
    assert.ok(work.conteudo.length>600,id);
    assert.ok(!c.blocos.some(x=>x.tipo==="texto"&&["Onde você pode atuar","Onde este profissional pode trabalhar"].includes(x.titulo)),id);
  }
});

test("Edificações apresenta ingresso antes de Mundo do Trabalho com atividades reais", () => {
  const c=json.courses.find(x=>x.id==="tecnico-em-edificacoes-integrado");
  const ingresso=c.blocos.findIndex(b=>b.tipo==="texto"&&b.titulo==="Forma de ingresso");
  const mundo=c.blocos.findIndex(b=>b.tipo==="texto"&&b.titulo==="Mundo do Trabalho");
  assert.ok(ingresso>=0&&mundo===ingresso+1);
  const intro=c.blocos[ingresso].conteudo;
  assert.match(intro,/concluí-lo até a matrícula/);
  assert.match(intro,/prova objetiva presencial/);
  assert.match(intro,/48 questões/);
  assert.match(intro,/1º de novembro de 2026, às 13h/);
  assert.match(intro,/3 de agosto a 14 de setembro de 2026/);
  assert.doesNotMatch(intro,/vestibular próprio.*todo final de ano|Quer ser lembrado|cadastre-se para receber/i);
  const work=c.blocos[mundo].conteudo;
  for(const theme of ["desenhos técnicos","orçamentos","controle de qualidade","ensaios de solos e materiais","manutenção predial","atribuições"]) {
    assert.ok(work.includes(theme),theme);
  }
  assert.doesNotMatch(work,/vaga garantida|emprego garantido|qualquer projeto/i);
  const faq=c.blocos.filter(b=>b.tipo==="faq").flatMap(b=>b.itens);
  assert.ok(faq.some(x=>x.pergunta==="Posso escolher mais de um curso na inscrição?"&&x.resposta.includes("três opções de curso no mesmo campus")));
  assert.ok(!faq.some(x=>x.pergunta==="Como faço para ingressar?"));
});

test("fase 1: galeria acompanha projetos e Administração não tem link ou destaque genérico", () => {
  const eng=json.courses.find(c=>c.id==="engenharia-mecanica-bacharelado");
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
  assert.ok(!Object.hasOwn(achievement,"validacao"));
});

test("bacharelados essenciais mantêm dados, FAQ, destaques e campos de validação", () => {
  const ids=["engenharia-mecanica-bacharelado","administracao-bacharelado",
    "agronomia-bacharelado","engenharia-de-producao-bacharelado"];
  const h=testContext();
  for (const id of ids) {
    const curso=json.courses.find(c=>c.id===id);
    assert.ok(curso,id);
    assert.ok(curso.blocos.length>=12,"O roteiro precisa ter os componentes editoriais essenciais");
    assert.ok(!Object.hasOwn(curso,"pendencias"));
    assert.ok(h.isApprovedCourse(curso));
    const intro=curso.blocos.filter(b=>b.tipo==="introducao");
    assert.ok(intro.length>=1,"A formação precisa ter destaques editoriais");
    assert.ok(intro.every(b=>b.conteudo.length<=280));
    const faq=curso.blocos.find(b=>b.tipo==="faq");
    assert.ok(faq.itens.length>=3,"FAQ precisa cobrir dúvidas substantivas");
    assert.ok(curso.blocos.some(b=>b.tipo==="galeria"&&!b.itens.length));
    assert.ok(curso.blocos.some(b=>b.tipo==="links"&&b.itens.some(x=>x.url.startsWith("https://portal.ifmg.edu.br/estudantes/como-ingressar-no-ifmg/"))));
  }
});

test("Engenharia Mecânica agrupa Arcos e Betim e mantém exigências acadêmicas por campus", () => {
  const course=json.courses.find(c=>c.id==="engenharia-mecanica-bacharelado");
  assert.ok(course);
  assert.deepEqual(course.campi,["Arcos","Betim"]);
  assert.ok(course.aliases.includes("engenharia-mecanica-bacharelado-arcos"));
  const offer=course.blocos.find(b=>b.tipo==="tabela"&&b.colunas.includes("E-mail da coordenação"));
  assert.equal(offer.linhas.length,2);
  assert.ok(offer.linhas.some(row=>row[0]==="Betim"&&row.some(x=>x.includes("eng.mecanica.betim@"))));
  const faq=course.blocos.find(b=>b.tipo==="faq");
  const internship=faq.itens.find(x=>x.pergunta.includes("estágio e o TCC"));
  assert.match(internship.resposta,/Arcos.*350 horas/);
  assert.match(internship.resposta,/TCC.*30 horas/);
  assert.match(internship.resposta,/Betim/);
  assert.doesNotMatch(internship.resposta,/Betim[^.]*350 horas/);
});

test("Betim: estágio, PFC, extensão e ingresso 2027 não herdam números de Arcos", () => {
  const c=json.courses.find(x=>x.id==="engenharia-mecanica-bacharelado");
  const faq=c.blocos.find(b=>b.tipo==="faq").itens;
  const intern=faq.find(x=>x.pergunta.includes("estágio e o TCC")).resposta;
  assert.match(intern,/Arcos[\s\S]*350 horas/);
  assert.match(intern,/Betim[\s\S]*360 horas/);
  assert.match(intern,/Betim[\s\S]*1\.800 horas de disciplinas/);
  assert.match(intern,/PFC[\s\S]*duas disciplinas de 30 horas/);
  assert.doesNotMatch(intern,/Betim[^.]*350 horas/);
  const ingress=faq.find(x=>x.pergunta.includes("ingressar")).resposta;
  assert.match(ingress,/Arcos[\s\S]*20 vagas[\s\S]*15 por Histórico Escolar e Redação/);
  assert.match(ingress,/Betim[\s\S]*18 vagas[\s\S]*Enem/);
  assert.match(ingress,/Sisu[\s\S]*seleção própria/);
  assert.match(c.blocos.find(b=>b.titulo==="Projetos e experiências acadêmicas").conteudo,/Betim[\s\S]*Pollyrubber[\s\S]*Contagem/);
  assert.match(c.blocos.find(b=>b.titulo==="Pesquisa, extensão e oportunidades").conteudo,/225[\s\S]*135[\s\S]*180 horas/);
  const intro=c.blocos.find(b=>b.tipo==="introducao").conteudo;
  assert.ok(intro.length<=280);
  assert.match(intro,/Betim[\s\S]*360 horas de extensão/);
});

test("Betim tem pesquisa do campus e temas de trabalhos finais sem inventar premiações", () => {
  const c=json.courses.find(x=>x.id==="engenharia-mecanica-bacharelado");
  const research=c.blocos.find(x=>x.titulo==="Pesquisa, extensão e oportunidades").conteudo;
  const works=c.blocos.find(x=>x.titulo==="Experiências e conquistas dos estudantes").conteudo;
  assert.ok(research.startsWith("Em **Arcos**"));
  assert.ok(works.startsWith("Em **Betim**"));
  assert.match(research,/Em \*\*Betim\*\*[\s\S]*impressão 3D/);
  assert.match(research,/nos cursos de Engenharia Mecânica e Controle e Automação/);
  assert.match(works,/Em \*\*Betim\*\*[\s\S]*baterias de veículos elétricos/);
  assert.match(works,/usinagem CNC/);
  assert.doesNotMatch(works,/receberam prêmio|foram premiados|conquistaram/i);
  const gallery=c.blocos.find(x=>x.tipo==="galeria");
  assert.equal(gallery.itens.length,0);
  const faq=c.blocos.find(x=>x.tipo==="faq").itens;
  const researchAnswer=faq.find(x=>x.pergunta.includes("projetos de pesquisa")).resposta;
  assert.match(researchAnswer,/Em \*\*Betim\*\*[\s\S]*pesquisas/);
  assert.match(researchAnswer,/seleções de cada período/);
});

test("FAQ não repete duração e matérias que já aparecem nos dados básicos", () => {
  const banned=new Map([
    ["agronomia-bacharelado",["Qual é a duração?","O que se estuda?"]],
    ["engenharia-de-producao-bacharelado",["Quanto tempo dura?","O que se estuda?","Como é organizada a formação?"]]
  ]);
  for(const [id,questions] of banned) {
    const c=json.courses.find(x=>x.id===id);
    const faq=c.blocos.find(x=>x.tipo==="faq").itens;
    assert.ok(faq.length>=3,id);
    assert.ok(c.blocos.find(x=>x.tipo==="dados-basicos").campos.some(x=>x.rotulo==="Duração"));
    for(const q of questions)assert.ok(!faq.some(x=>x.pergunta===q),id+": "+q);
  }
  const c=json.courses.find(x=>x.id==="administracao-bacharelado");
  const answer=c.blocos.find(x=>x.tipo==="faq").itens.find(x=>x.pergunta==="Ouro Branco").resposta;
  assert.match(answer,/quatro estrelas no Guia da Faculdade de 2025/);
  assert.doesNotMatch(answer,/,\./);
});

test("Agronomia e Engenharia de Produção agrupam as cinco ofertas 2027 sem perder URLs antigas", () => {
  const checks=[
    {id:"agronomia-bacharelado",old:"agronomia-bacharelado-bambui",campi:["Bambuí","São João Evangelista"],vagas:[/30 Enem/,/15 Enem.*15 Histórico Escolar e Redação/],turnos:["Manhã e tarde","Manhã e tarde"]},
    {id:"engenharia-de-producao-bacharelado",old:"engenharia-de-producao-bacharelado-bambui",campi:["Bambuí","Congonhas","Governador Valadares"],vagas:[/20 Enem.*5 Histórico/,/20 Enem/,/17 Enem.*17 Histórico/],turnos:["Manhã e tarde","Noite","Noite"]}
  ];
  for(const spec of checks) {
    const c=json.courses.find(x=>x.id===spec.id);
    assert.deepEqual(c.campi,spec.campi);
    assert.ok(c.aliases.includes(spec.old));
    assert.equal(c.publicacao_autorizada,true);
    const basic=c.blocos.find(b=>b.tipo==="dados-basicos").campos;
    const vacancy=basic.find(x=>x.rotulo==="Vagas").valor;
    for(const regex of spec.vagas)assert.match(vacancy,regex);
    const table=c.blocos.find(b=>b.tipo==="tabela"&&b.colunas.includes("E-mail da coordenação"));
    assert.deepEqual(table.colunas,["Campus","Turno","Modalidade","E-mail da coordenação"]);
    assert.deepEqual(table.linhas.map(r=>r[0]),spec.campi);
    assert.deepEqual(table.linhas.map(r=>r[1]),spec.turnos);
    assert.ok(table.linhas.every(r=>r[2]==="Presencial"));
    const faq=c.blocos.find(b=>b.tipo==="faq").itens;
    assert.ok(spec.campi.every(campus=>faq.some(x=>x.pergunta.includes(campus)&&x.pergunta.startsWith("Como ingressar"))));
    assert.ok(c.blocos.some(b=>b.tipo==="texto"&&b.titulo==="Onde o IFMG oferece "+c.nome));
    assert.ok(c.blocos.findIndex(b=>b.tipo==="galeria")<c.blocos.findIndex(b=>b.tipo==="faq"));
  }
  const agr=json.courses.find(x=>x.id==="agronomia-bacharelado");
  assert.match(agr.blocos.find(b=>b.titulo==="Continue seus estudos no IFMG").conteudo,/Especialização em Meio Ambiente/);
  const prod=json.courses.find(x=>x.id==="engenharia-de-producao-bacharelado");
  const pTable=prod.blocos.find(b=>b.tipo==="tabela"&&b.colunas.includes("E-mail da coordenação"));
  assert.equal(pTable.linhas[1][3],"coordenacao.producao.congonhas@ifmg.edu.br");
  assert.equal(pTable.linhas[2][3],"coenp.gv@ifmg.edu.br");
  assert.match(prod.blocos.find(b=>b.titulo==="Reconhecimentos e premiações").conteudo,/Governador Valadares/);
  assert.match(prod.blocos.find(b=>b.titulo==="Reconhecimentos e premiações").conteudo,/2 de fevereiro de 2026/);
});

test("Direito explica estágio e TCC com exigências concretas", () => {
  const c=json.courses.find(x=>x.id==="direito-bacharelado-arcos");
  const faq=c.blocos.find(x=>x.tipo==="faq");
  const estagio=faq.itens.find(x=>x.pergunta.includes("estágio e Trabalho"));
  assert.match(estagio.resposta,/210 horas/);
  assert.match(estagio.resposta,/30 horas/);
  const ext=faq.itens.find(x=>x.pergunta.includes("pesquisa e extensão"));
  assert.match(ext.resposta,/orientação à comunidade/);
  assert.doesNotMatch(estagio.resposta,/Informação incompleta|regulamentos|coordenação deve/);
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

test("continuidade de Administração distingue mestrado e especializações por campus", () => {
  const c=json.courses.find(x=>x.id==="administracao-bacharelado");
  const text=c.blocos.find(x=>x.titulo==="Continue seus estudos no IFMG");
  assert.ok(text);
  assert.match(text.conteudo,/Mestrado Profissional em Administração/);
  assert.match(text.conteudo,/Formiga/);
  assert.match(text.conteudo,/ProfEPT/);
  assert.match(text.conteudo,/Educação Profissional e Tecnológica/);
  assert.match(text.conteudo,/Ouro Branco/);
  assert.match(text.conteudo,/Especialização em Gestão de Negócios/);
  assert.match(text.conteudo,/Em \*\*Formiga\*\*, o \*\*Mestrado Profissional em Administração\*\*/);
  assert.match(text.conteudo,/Em \*\*Ouro Branco\*\*, a \*\*Especialização em Gestão de Negócios\*\*/);
  assert.doesNotMatch(text.conteudo,/Em \*\*Ouro Branco\*\*, o \*\*Mestrado Profissional em Administração\*\*/);
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

test("F1B.8: cabeçalhos FAQ não exibem conteúdo fictício e perguntas pendentes não são copiáveis", () => {
  for(const id of ["agronomia-bacharelado","engenharia-de-producao-bacharelado"]) {
    const c=json.courses.find(x=>x.id===id);
    const header=c.blocos.find(x=>x.tipo==="texto"&&x.titulo==="Perguntas frequentes");
    assert.equal(header.conteudo,"");
    const h=testContext();
    const fields=h.editorFields(header);
    assert.equal(fields.length,1);
    assert.equal(fields[0].value,"Perguntas frequentes");
    assert.ok(fields[0].html.includes("<h2>Perguntas frequentes</h2>"));
    const html=h.editorBlock(header,13);
    assert.equal((html.match(/data-copy-field=/g)||[]).length,1);
    assert.doesNotMatch(html,/Informação incompleta/);
    const faq=c.blocos.find(x=>x.tipo==="faq");
    assert.ok(faq.itens.every(q=>q.pergunta.trim() && q.resposta.trim()!=="Informação incompleta"));
  }
  const h=testContext();
  const unfinished={tipo:"faq",itens:[
    {pergunta:"Como funciona o estágio?",resposta:"Informação incompleta"},
    {pergunta:"Posso participar de projetos?",resposta:"Sim, mediante seleção."}
  ]};
  const visible=h.editorFields(unfinished);
  assert.equal(visible.length,2);
  assert.equal(visible[0].value,"Posso participar de projetos?");
  assert.equal(visible[1].value,"Sim, mediante seleção.");
  const rendered=h.editorBlock(unfinished,11);
  assert.equal((rendered.match(/data-copy-field=/g)||[]).length,2);
  assert.doesNotMatch(rendered,/Como funciona o estágio|Informação incompleta/);
  const headingOnly=h.editorFields({tipo:"texto",titulo:"Perguntas frequentes",conteudo:"Informação incompleta"});
  assert.equal(headingOnly.length,1);
  assert.equal(headingOnly[0].value,"Perguntas frequentes");
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
