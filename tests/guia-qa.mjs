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
    "  return {demo,state,editorFields,editorBlock,blockPreview,blockCopy,tableHTML,richHTML,copyValue,renderCatalog,isApprovedCourse};\n})();");
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

// As experiências aparecem em blocos Texto individuais, cada um seguido de sua Galeria.
function sectionText(course, title) {
  const start=course.blocos.findIndex(b=>b.tipo==="texto"&&b.titulo===title);
  assert.ok(start>=0,"Seção ausente: "+course.id+" / "+title);
  const paragraphs=[];
  for(let i=start;i<course.blocos.length;i++){
    const b=course.blocos[i];
    if(i>start && b.titulo)break;
    if(i>start && !["texto","galeria"].includes(b.tipo))break;
    if(b.tipo==="texto" && b.conteudo)paragraphs.push(b.conteudo);
  }
  return paragraphs.join("\n\n");
}

test("F5: reconhecimentos e experiências formam uma seção única em todos os cursos", () => {
  const h=testContext();
  assert.equal(json.courses.length,8);
  const unified="Experiências e conquistas dos estudantes";
  for(const c of json.courses){
    const relevant=c.blocos.filter(b=>b.titulo===unified);
    assert.equal(relevant.length,1,c.id+": seção única");
    assert.equal(relevant[0].tipo,"texto",c.id);
    assert.equal(h.editorFields(relevant[0]).length,relevant[0].conteudo==="Informação incompleta"?2:1,c.id+": cópia Rich Text respeita pendência");
    assert.ok(!c.blocos.some(b=>/^Reconhecimentos e (?:premiações|avaliações)$/.test(b.titulo||"")),c.id+": remover seção duplicada");
    const continuation=c.blocos.findIndex(b=>b.titulo==="Continue seus estudos no IFMG");
    const experiences=c.blocos.findIndex(b=>b.titulo===unified);
    const faq=c.blocos.findIndex(b=>b.titulo==="Perguntas frequentes");
    assert.ok(experiences>continuation,c.id+": continuidade antes das experiências");
    assert.ok(faq>=0,c.id+": FAQ de candidatos preservado");
    if(c.id.startsWith("tecnico-"))assert.ok(faq>experiences,c.id+": FAQ técnico no fim da seção informativa");
    assert.deepEqual(c.blocos.slice(-2).map(b=>b.titulo),["Forma de ingresso","Mundo do Trabalho"],c.id);
  }
  const get=id=>sectionText(json.courses.find(c=>c.id===id),unified);
  for(const [id,terms] of [
    ["administracao-bacharelado",["Ouro Branco","quatro estrelas","2025"]],
    ["agronomia-bacharelado",["Informação incompleta"]],
    ["engenharia-de-producao-bacharelado",["Portaria SERES/MEC nº 16","2 de fevereiro de 2026","Diretório Acadêmico","Brazilian Journal of Production Engineering"]],
    ["engenharia-mecanica-bacharelado",["baterias de veículos elétricos","manutenção preditiva","usinagem CNC"]]
  ])for(const term of terms)assert.ok(get(id).includes(term),id+": "+term);
  for(const id of ["tecnico-em-edificacoes-integrado","tecnico-em-logistica-subsequente","tecnico-em-administracao-integrado","direito-bacharelado-arcos"]){
    assert.equal(get(id),"Informação incompleta",id+": uma única pendência, sem inventar conquista");
  }
});

test("F4.4: os oito cursos apresentam continuidade sem avisos genéricos", () => {
  const h=testContext();
  assert.equal(json.courses.length,8);
  for(const c of json.courses) {
    const i=c.blocos.findIndex(b=>b.titulo==="Continue seus estudos no IFMG");
    assert.ok(i>=0,c.id);
    assert.equal(c.blocos[i].tipo,"texto");
    assert.equal(c.blocos[i].conteudo,"",c.id+": título sem explicações óbvias");
    const fields=h.editorFields(c.blocos[i]);
    assert.equal(fields.length,1,c.id+": texto como um campo");
    assert.equal(fields[0].value,"Continue seus estudos no IFMG",c.id);
    if(c.id.startsWith("tecnico-")){
      assert.deepEqual(c.blocos.slice(i+1,i+5).map(b=>b.titulo||b.tipo),
        ["Graduação","tabela","Pós-graduação","tabela"],c.id);
      assert.ok(c.blocos[i+2].linhas.length>0&&c.blocos[i+4].linhas.length>0,c.id);
    }else{
      assert.deepEqual(c.blocos.slice(i+1,i+3).map(b=>b.titulo||b.tipo),
        ["Pós-graduação","tabela"],c.id);
      assert.ok(c.blocos[i+2].linhas.length>0,c.id);
      assert.equal(c.blocos[i+3].titulo,"Experiências e conquistas dos estudantes",c.id);
      assert.ok(!c.blocos.slice(i+2,i+4).some(b=>b.tipo==="links"),c.id+": sem links de cursos legados");
    }
    assert.deepEqual(c.blocos.slice(-2).map(x=>x.titulo),
      ["Forma de ingresso","Mundo do Trabalho"],c.id);
  }
});

test("F4.4: Logística e Administração técnico têm duas tabelas de continuidade copiáveis", () => {
  const specs=[
    {id:"tecnico-em-logistica-subsequente",cols:["Curso","Campus","Relação com Logística"],grad:3,pos:2},
    {id:"tecnico-em-administracao-integrado",cols:["Curso","Campus","Relação com Administração"],grad:3,pos:4}
  ];
  const h=testContext();
  for(const spec of specs) {
    const c=json.courses.find(x=>x.id===spec.id);
    assert.ok(c,spec.id);
    const i=c.blocos.findIndex(b=>b.titulo==="Continue seus estudos no IFMG");
    assert.ok(i>=0,spec.id);
    assert.deepEqual(c.blocos.slice(i,i+5).map(b=>[b.tipo,b.titulo || ""]),[
      ["texto","Continue seus estudos no IFMG"],["texto","Graduação"],["tabela",""],
      ["texto","Pós-graduação"],["tabela",""]
    ],spec.id);
    const intro=c.blocos[i].conteudo;
    assert.equal(intro,"",spec.id+": sem explicações redundantes sobre ingresso na pós");
    const grad=c.blocos[i+2],pos=c.blocos[i+4];
    assert.deepEqual(grad.colunas,spec.cols);
    assert.deepEqual(pos.colunas,spec.cols);
    assert.equal(grad.linhas.length,spec.grad);
    assert.equal(pos.linhas.length,spec.pos);
    for (const b of [grad,pos]) {
      assert.ok(b.linhas.every(row=>row.length===3&&row.every(Boolean)),spec.id);
      assert.match(h.editorBlock(b,i+2),/Copiar tabela/);
      assert.match(h.blockCopy(b),/Curso\tCampus\tRelação com/);
    }
    assert.deepEqual(c.blocos.slice(-2).map(b=>b.titulo),["Forma de ingresso","Mundo do Trabalho"],spec.id);
    assert.doesNotMatch(c.blocos.at(-2).conteudo,/2026|2027|48 questões|novembro|setembro|Quer ser lembrado/);
    assert.ok(h.isApprovedCourse(c),spec.id);
  }
});

test("F4.4: Logística usa cursos ativos e exclui programas sem nova entrada confirmada", () => {
  const c=json.courses.find(x=>x.id==="tecnico-em-logistica-subsequente");
  const i=c.blocos.findIndex(x=>x.titulo==="Continue seus estudos no IFMG");
  const grad=c.blocos[i+2].linhas,pos=c.blocos[i+4].linhas;
  assert.ok(grad.some(x=>x[0]==="Curso Superior de Tecnologia em Logística"&&x[1]==="Sabará"));
  assert.ok(grad.some(x=>x[0]==="Bacharelado em Administração"&&x[1]==="Sabará"));
  assert.ok(grad.some(x=>x[0]==="Bacharelado em Engenharia de Produção"&&x[1]==="Congonhas"));
  assert.ok(pos.some(x=>x[0]==="Especialização em Gestão"&&x[1].includes("Bambuí e São João Evangelista")));
  assert.ok(pos.some(x=>x[0]==="Especialização em Gestão de Negócios"&&x[1]==="Ouro Branco"));
  assert.ok(!c.blocos.some(x=>x.titulo==="Ingresso e vagas por campus"));
  assert.doesNotMatch(JSON.stringify([...grad,...pos]),/Gestão de Projetos e Operações|Tecnologia em Processos Gerenciais/);
});

test("F4.4: Administração técnico identifica pós-graduações e alternativas de graduação", () => {
  const c=json.courses.find(x=>x.id==="tecnico-em-administracao-integrado");
  const i=c.blocos.findIndex(x=>x.titulo==="Continue seus estudos no IFMG");
  const grad=c.blocos[i+2].linhas,pos=c.blocos[i+4].linhas;
  const admin=grad.find(x=>x[0]==="Bacharelado em Administração");
  assert.ok(admin);
  for(const campus of ["Bambuí","Formiga","Ouro Branco","Ribeirão das Neves","Sabará","São João Evangelista"])
    assert.ok(admin[1].includes(campus),campus);
  assert.ok(grad.some(x=>x[0]==="Curso Superior de Tecnologia em Logística"&&x[1]==="Sabará"));
  assert.ok(grad.some(x=>x[0]==="Bacharelado em Engenharia de Produção"&&x[1]==="Congonhas"));
  const courses=[
    ["Especialização em Gestão","Bambuí e São João Evangelista"],
    ["Especialização em Gestão de Negócios","Ouro Branco"],
    ["Especialização em Gestão Pública e Desenvolvimento Regional","Ribeirão das Neves"],
    ["Mestrado Profissional em Administração","Formiga"]
  ];
  for(const [course,campus] of courses)
    assert.ok(pos.some(x=>x[0]===course&&x[1].includes(campus)),course);
  assert.ok(pos.find(x=>x[0]==="Mestrado Profissional em Administração")[2].includes("finanças"));
  assert.doesNotMatch(JSON.stringify([...grad,...pos]),/Tecnologia em Processos Gerenciais/);
});

test("F4.5: Edificações tem continuidade tabular verificável e copiável", () => {
  const c=json.courses.find(x=>x.id==="tecnico-em-edificacoes-integrado");
  assert.ok(c);
  assert.equal(c.blocos.filter(b=>b.titulo==="Continue seus estudos no IFMG").length,1);
  assert.ok(!c.blocos.some(b=>b.titulo==="Continuidade dos estudos"),"Não duplicar a seção antiga");
  const idx=c.blocos.findIndex(b=>b.titulo==="Continue seus estudos no IFMG");
  assert.deepEqual(c.blocos.slice(idx,idx+5).map(b=>[b.tipo,b.titulo || ""]),[
    ["texto","Continue seus estudos no IFMG"],["texto","Graduação"],["tabela",""],
    ["texto","Pós-graduação"],["tabela",""]
  ]);
  const intro=c.blocos[idx].conteudo;
  assert.equal(intro,"","O título conduz diretamente às tabelas, sem parágrafos de ressalvas");

  const grad=c.blocos[idx+2],pos=c.blocos[idx+4];
  const cols=["Curso","Campus","Relação com Edificações"];
  assert.deepEqual(grad.colunas,cols);
  assert.deepEqual(pos.colunas,cols);
  assert.equal(grad.linhas.length,4);
  assert.equal(pos.linhas.length,5);
  assert.ok(grad.linhas.some(row=>row[0]==="Bacharelado em Arquitetura e Urbanismo"&&row[1]==="Santa Luzia"));
  assert.deepEqual(grad.linhas.filter(row=>row[0]==="Bacharelado em Engenharia Civil").map(row=>row[1]).sort(),
    ["Governador Valadares","Piumhi","Santa Luzia"]);
  const seg=pos.linhas.find(row=>row[0]==="Especialização em Engenharia de Segurança do Trabalho");
  assert.equal(seg[1],"Governador Valadares");
  assert.match(seg[2],/graduação em Engenharia, Arquitetura ou Agronomia/);
  const patrimonio=pos.linhas.find(row=>row[0]==="Especialização em Gestão e Conservação do Patrimônio Cultural");
  assert.equal(patrimonio[1],"Ouro Preto");
  assert.match(patrimonio[2],/graduação compatível/);
  for(const [name,campus] of [
    ["Especialização em BIM: Projetos Aplicados às Edificações","Piumhi (EaD)"],
    ["Especialização em Proteção e Defesa Civil","Santa Luzia (EaD)"],
    ["Mestrado Profissional em Sustentabilidade e Tecnologia Ambiental","Bambuí"]
  ])assert.ok(pos.linhas.some(row=>row[0]===name&&row[1]===campus),name);
  assert.ok([...grad.linhas,...pos.linhas].every(row=>row.length===3&&row.every(Boolean)));
  const h=testContext();
  assert.ok(h.isApprovedCourse(c));
  assert.match(h.editorBlock(grad,idx+2),/Copiar tabela/);
  assert.match(h.editorBlock(pos,idx+4),/Copiar tabela/);
  assert.match(h.blockCopy(grad),/Curso\tCampus\tRelação com Edificações/);
  assert.deepEqual(c.blocos.slice(-2).map(b=>b.titulo),["Forma de ingresso","Mundo do Trabalho"]);
});

test("F1B.11: FAQs técnicos orientam escolhas, cotas, assistência e ficam ao fim da parte informativa", () => {
  const h=testContext();
  const configs=[
    {id:"tecnico-em-edificacoes-integrado",n:5,modality:"Existe Técnico em Edificações para quem já concluiu ou está cursando o ensino médio?",rows:3},
    {id:"tecnico-em-logistica-subsequente",n:4,modality:null,rows:0},
    {id:"tecnico-em-administracao-integrado",n:6,modality:"Existe Técnico em Administração para quem já concluiu o ensino médio?",rows:2}
  ];
  for(const {id,n,modality,rows} of configs) {
    const c=json.courses.find(x=>x.id===id),blocos=c.blocos;
    const f=blocos.findIndex(b=>b.titulo==="Perguntas frequentes");
    const experienced=blocos.findIndex(b=>b.titulo==="Experiências e conquistas dos estudantes");
    assert.ok(f>experienced,id+": FAQ depois dos resultados e da continuidade acadêmica");
    assert.equal(blocos[f].tipo,"texto");
    assert.equal(blocos[f+1].tipo,"faq");
    const items=blocos[f+1].itens;
    assert.equal(items.length,n,id);
    assert.ok(items.every(x=>x.pergunta.endsWith("?")&&x.resposta.length>100),id);
    assert.ok(items.every(x=>!c.campi.includes(x.pergunta)),id+": nome de campus não é pergunta");
    assert.ok(items.every(x=>!/^(as experiências variam|consulte o campus|confirme com a coordenação)/i.test(x.resposta)),id);
    assert.equal(h.editorFields(blocos[f+1]).length,n*2,id+": pergunta e resposta copiáveis separadamente");
    const assistance=items.find(x=>/assistência estudantil/i.test(x.pergunta));
    assert.ok(assistance,id+": assistência estudantil");
    assert.match(assistance.resposta,/SSAE/);
    assert.match(assistance.resposta,/edital/i);
    assert.doesNotMatch(assistance.resposta,/garantid[ao] automaticamente|todo aluno recebe/i);
    const quotas=items.find(x=>/cotas|reserva de vagas/i.test(x.pergunta));
    assert.ok(quotas,id+": reserva de vagas");
    assert.match(quotas.resposta,/edital/i);
    const links=blocos[f+2];
    assert.equal(links.tipo,"links");
    const labels=links.itens.map(x=>x.rotulo);
    assert.deepEqual(labels,["Como ingressar no IFMG","Reserva de vagas e cotas","Assistência estudantil"],id);
    assert.ok(links.itens.every(x=>x.url.startsWith("https://portal.ifmg.edu.br/estudantes/")));
    assert.deepEqual(blocos.slice(-2).map(x=>x.titulo),["Forma de ingresso","Mundo do Trabalho"],id);
    assert.ok(h.isApprovedCourse(c),id);
    if(modality){
      const section=blocos[f+3],table=blocos[f+4];
      assert.equal(section.titulo,modality);
      assert.equal(section.tipo,"texto");
      assert.equal(table.tipo,"tabela");
      assert.deepEqual(table.colunas,["Se você...","Procure por...","O que comparar"]);
      assert.equal(table.linhas.length,rows);
      assert.ok(table.linhas.every(row=>row.length===3));
      assert.ok(table.linhas.some(row=>row[1]==="Subsequente"));
      assert.ok(table.linhas.every(row=>row.join(" ").length>60));
      assert.ok(h.editorFields(section)[0].rich);
      assert.ok(!blocos.slice(f+5,-2).length,id+": comparação fica antes dos dois últimos blocos");
    }else{
      assert.equal(blocos[f+3].titulo,"Forma de ingresso");
      assert.ok(!blocos.some(b=>b.tipo==="texto"&&/Existe Técnico em Logística para quem/i.test(b.titulo||"")),id);
    }
  }
});

test("F1B.11: diferenças institucionais não migram entre modalidades e campi", () => {
  const get=id=>json.courses.find(c=>c.id===id);
  const ed=get("tecnico-em-edificacoes-integrado"),edfaq=ed.blocos.find(b=>b.tipo==="faq"&&b.titulo!=="Informações dos campi").itens;
  assert.ok(!edfaq.some(x=>/laboratório|visitas técnicas/i.test(x.pergunta)),"não repetir práticas e visitas no FAQ dos candidatos");
  const edLocais=ed.blocos.find(b=>b.tipo==="faq"&&b.titulo==="Informações dos campi").itens;
  const desc=campus=>edLocais.find(x=>x.pergunta==="Campus "+campus).resposta;
  assert.match(desc("Congonhas"),/solos, materiais de construção/);
  assert.match(desc("Governador Valadares"),/aulas práticas, visitas técnicas/);
  const edsec=ed.blocos.find(b=>b.titulo?.startsWith("Existe Técnico em Edificações"));
  assert.match(edsec.conteudo,/subsequente.*Congonhas.*Ouro Preto/is);
  assert.match(edsec.conteudo,/Congonhas.*concomitante/is);
  assert.doesNotMatch(edsec.conteudo,/subsequente.*Piumhi/is);
  const lg=get("tecnico-em-logistica-subsequente");
  const lgfaq=lg.blocos.find(b=>b.tipo==="faq"&&b.titulo!=="Informações dos campi").itens;
  const ead=lgfaq.find(x=>x.pergunta.includes("a distância"));
  assert.match(ead.resposta,/Governador Valadares/);
  assert.match(ead.resposta,/Ribeirão das Neves/);
  const presencial=lgfaq.find(x=>x.pergunta.includes("comparecer"));
  assert.match(presencial.resposta,/Em Governador Valadares, sim/);
  assert.match(presencial.resposta,/confirme as atividades presenciais exigidas/);
  assert.doesNotMatch(presencial.resposta,/Ribeirão das Neves.{0,80}100%/);
  const adm=get("tecnico-em-administracao-integrado");
  const admsec=adm.blocos.find(b=>b.titulo?.startsWith("Existe Técnico em Administração"));
  assert.match(admsec.conteudo,/Ponte Nova/);
  assert.match(admsec.conteudo,/Governador Valadares/);
  assert.doesNotMatch(admsec.conteudo,/subsequente.*Ribeirão das Neves/is);
  const tab=adm.blocos.find((b,i)=>b.tipo==="tabela"&&adm.blocos[i-1]?.titulo===admsec.titulo);
  assert.ok(tab);
  assert.ok(!tab.linhas.some(row=>row[1]==="Concomitante"));
  const admfaq=adm.blocos.find(b=>b.tipo==="faq"&&b.titulo!=="Informações dos campi").itens;
  assert.ok(!admfaq.some(x=>x.pergunta==="Há atividades práticas e projetos?"));
  const projetoAdmin=adm.blocos.find(b=>b.titulo==="Projetos e experiências");
  assert.match(projetoAdmin.conteudo,/Expo Favela Minas/);
  assert.doesNotMatch(projetoAdmin.conteudo,/Hackathon Social/);
  assert.ok(admfaq.some(x=>x.pergunta.includes("a distância")&&x.resposta.includes("16,67%")));
  for(const c of [ed,lg,adm]){
    assert.ok(c.blocos.filter(x=>x.tipo==="faq"&&x.titulo!=="Informações dos campi").every(b=>b.itens.length >= (c.id==="tecnico-em-edificacoes-integrado" ? 5 : c.id==="tecnico-em-logistica-subsequente" ? 4 : 6)));
    assert.ok(c.blocos.findIndex(x=>x.titulo==="Perguntas frequentes")>c.blocos.findIndex(x=>x.titulo==="Continue seus estudos no IFMG"));
    assert.ok(c.blocos.every(x=>!x.titulo?.startsWith("E se eu já estiver cursando ou tiver concluído o ensino médio?")));
  }
});

test("F1B.13: conteúdos públicos falam na voz do IFMG, sem narrar a própria fonte", () => {
  const forbidden=/a apresentação institucional registra|(?:a página|o portal|o site) (?:institucional )?(?:registra|informa|divulga)|segundo (?:a página|o site|o portal)|o campus registra pesquisas|conforme a página institucional|reconhecimento divulgado pelo IFMG|documentos institucionais consultados/iu;
  for(const c of json.courses)for(const b of c.blocos){
    const paragraphs=b.tipo==="texto"?[b.conteudo]:b.tipo==="faq"?b.itens.map(x=>x.resposta):[];
    for(const value of paragraphs)assert.doesNotMatch(value||"",forbidden,c.id+" · "+(b.titulo||b.tipo));
  }
  const log=json.courses.find(x=>x.id==="tecnico-em-logistica-subsequente").blocos.find(x=>x.tipo==="faq"&&x.titulo!=="Informações dos campi");
  assert.match(log.itens.find(x=>x.pergunta.includes("comparecer")).resposta,/Em \*\*Ribeirão das Neves\*\*/);
  const mec=json.courses.find(x=>x.id==="engenharia-mecanica-bacharelado");
  assert.match(mec.blocos.find(x=>x.tipo==="faq"&&x.titulo==="Informações dos campi").itens.find(x=>x.pergunta==="Campus Betim").resposta,/organização curricular de \*\*2023\*\*/);
});

test("F2.12: FAQs de ingresso não reciclam calendário, notas ou vagas de edição passada", () => {
  const ids=[
    "direito-bacharelado-arcos","engenharia-mecanica-bacharelado",
    "agronomia-bacharelado","engenharia-de-producao-bacharelado"
  ];
  let total=0;
  const temporal=/\b20(?:1[0-9]|2[0-9])\b|\b\d+\s*vagas\b|3 de agosto|14 de setembro|1º de novembro|redação prevista|inscrições ocorreram|ed(?:ições|ição) de 2017/i;
  for(const c of json.courses){
    const faq=c.blocos.find(x=>x.tipo==="faq"&&x.titulo!=="Informações dos campi");
    assert.ok(faq,c.id);
    const admission=faq.itens.filter(q=>/^(?:Como (?:posso )?ingressar)/i.test(q.pergunta));
    if(ids.includes(c.id)){
      assert.equal(admission.length,1,c.id+": apenas uma dúvida de ingresso");
      total+=admission.length;
    }else{
      assert.equal(admission.length,0,c.id+": não criar ingresso duplicado no FAQ");
    }
    for(const q of admission){
      assert.doesNotMatch(q.pergunta+" "+q.resposta,temporal,c.id);
      assert.match(q.resposta,/ensino médio/i,c.id);
      assert.match(q.resposta,/matrícula/i,c.id);
      assert.match(q.resposta,/edita(?:l|is) vigente/i,c.id);
      assert.ok(q.resposta.length>240,c.id);
    }
    const form=c.blocos.at(-2);
    assert.equal(form.titulo,"Forma de ingresso",c.id);
    assert.doesNotMatch(form.conteudo,temporal,c.id+": seção perene");
    assert.deepEqual(c.blocos.slice(-2).map(x=>x.titulo),["Forma de ingresso","Mundo do Trabalho"],c.id);
  }
  assert.equal(total,4);
  const agr=json.courses.find(c=>c.id==="agronomia-bacharelado");
  const pro=json.courses.find(c=>c.id==="engenharia-de-producao-bacharelado");
  for(const c of [agr,pro]){
    assert.ok(c.blocos.find(x=>x.tipo==="faq"&&x.titulo!=="Informações dos campi").itens.length>=4,c.id);
  }
  // Datas históricas de projetos são fatos editoriais, não prazos de matrícula.
  const tec=json.courses.find(c=>c.id==="tecnico-em-administracao-integrado");
  assert.match(sectionText(tec,"Projetos e experiências"),/Expo Favela Minas/);
  const eng=json.courses.find(c=>c.id==="engenharia-mecanica-bacharelado");
  assert.match(sectionText(eng,"Projetos e experiências acadêmicas"),/Pollyrubber/);
  const agrLocal=agr.blocos.find(x=>x.tipo==="faq"&&x.titulo==="Informações dos campi");
  assert.match(agrLocal.itens.find(x=>x.pergunta==="Campus Bambuí").resposta,/nove semestres/);
});

test("F2.12: campos estruturados não exibem vagas de seleções anteriores como permanentes", () => {
  for(const c of json.courses) {
    const basic=c.blocos.find(b=>b.tipo==="dados-basicos");
    assert.ok(basic,c.id);
    assert.ok(basic.campos.every(x=>!/^Vagas(?: do PS 2027)?$/.test(x.rotulo)),c.id+": sem vagas de edição passada nos dados básicos");
    const tables=c.blocos.filter(b=>b.tipo==="tabela");
    assert.ok(tables.every(b=>!b.colunas.some(col=>/Vagas \/ ingresso 2027/i.test(col))),c.id+": tabelas sem ano passado");
  }
  const logistics=json.courses.find(c=>c.id==="tecnico-em-logistica-subsequente");
  const where=logistics.blocos.findIndex(b=>b.titulo==="Onde o IFMG oferece Técnico em Logística");
  const table=logistics.blocos[where+1];
  assert.deepEqual(table.colunas,["Campus","Modalidade","E-mail da coordenação"]);
  assert.deepEqual(table.linhas.map(row=>row[0]),["Governador Valadares","Ribeirão das Neves"]);
  assert.equal(table.linhas[0][2],"coordenacao.tslog.gv@ifmg.edu.br");
  assert.equal(table.linhas[1][2],"Informação incompleta");
  assert.deepEqual(logistics.blocos.slice(-2).map(b=>b.titulo),["Forma de ingresso","Mundo do Trabalho"]);
});

test("F2.13: introdução inicial apresenta o curso, nunca uma unidade privilegiada", () => {
  for(const c of json.courses){
    const first=c.blocos.find(b=>b.tipo==="introducao");
    assert.ok(first&&first.conteudo,c.id+": destaque inicial presente");
    assert.ok(first.conteudo.length<=280,c.id+": destaque dentro do limite de caracteres");
    if(c.campi.length>1) {
      for(const campus of c.campi)assert.ok(!first.conteudo.includes(campus),c.id+": sem menção prematura de "+campus);
      assert.doesNotMatch(first.conteudo,/\b(?:\d+\s*%|\d+\s*horas? de extensão|encontros? presenciais?|\d+\s*anos?)\b/i,c.id+": sem detalhes exclusivos na abertura");
    }else{
      assert.match(first.conteudo,/Arcos/,c.id+": Direito tem apenas um campus");
    }
    assert.deepEqual(c.blocos.slice(-2).map(b=>b.titulo),["Forma de ingresso","Mundo do Trabalho"],c.id);
  }
  const mec=json.courses.find(c=>c.id==="engenharia-mecanica-bacharelado");
  assert.match(mec.blocos.find(b=>b.tipo==="introducao").conteudo,/funcionamento e o desenvolvimento de máquinas/);
  const mecCampi=mec.blocos.find(b=>b.tipo==="faq"&&b.titulo==="Informações dos campi");
  assert.match(mecCampi.itens.find(x=>x.pergunta==="Campus Arcos").resposta,/Trabalhos Acadêmicos Integradores/);
  assert.match(mecCampi.itens.find(x=>x.pergunta==="Campus Betim").resposta,/360 horas de extensão/);
  const adm=json.courses.find(c=>c.id==="administracao-bacharelado");
  assert.match(adm.blocos.find(b=>b.tipo==="introducao").conteudo,/finanças, marketing, gestão de pessoas/);
  const campusInfo=adm.blocos.find(b=>b.tipo==="faq"&&b.titulo==="Informações dos campi").itens;
  assert.match(campusInfo.find(x=>x.pergunta==="Campus Formiga").resposta,/20%/);
  assert.match(campusInfo.find(x=>x.pergunta==="Campus Sabará").resposta,/23,67%/);
  assert.match(campusInfo.find(x=>x.pergunta==="Campus Ouro Branco").resposta,/8%/);
});

test("F2.13: dados de duração específicos não são projetados a outros campi", () => {
  const uncertain=[
    "tecnico-em-edificacoes-integrado","tecnico-em-logistica-subsequente",
    "tecnico-em-administracao-integrado","administracao-bacharelado","agronomia-bacharelado"
  ];
  for(const id of uncertain){
    const c=json.courses.find(c=>c.id===id);
    const fields=c.blocos.find(b=>b.tipo==="dados-basicos").campos;
    assert.ok(!fields.some(f=>f.rotulo==="Duração"),id+": prazo ainda não validado como universal");
    assert.ok(c.blocos.find(b=>b.tipo==="faq"&&b.titulo==="Informações dos campi").itens.length===c.campi.length,id);
  }
  const get=(id,campus)=>json.courses.find(c=>c.id===id)
    .blocos.find(b=>b.tipo==="faq"&&b.titulo==="Informações dos campi")
    .itens.find(x=>x.pergunta==="Campus "+campus).resposta;
  assert.match(get("tecnico-em-logistica-subsequente","Ribeirão das Neves"),/duração prevista de um ano/);
  assert.match(get("tecnico-em-logistica-subsequente","Governador Valadares"),/800 horas distribuídas em dois módulos/);
  assert.doesNotMatch(get("tecnico-em-logistica-subsequente","Governador Valadares"),/\b(?:um ano|1 ano)\b/);
  assert.match(get("tecnico-em-edificacoes-integrado","Ouro Preto"),/duração de três anos/);
  assert.match(get("tecnico-em-edificacoes-integrado","Santa Luzia"),/três anos/);
  assert.match(get("agronomia-bacharelado","Bambuí"),/nove semestres/);
  assert.doesNotMatch(get("agronomia-bacharelado","São João Evangelista"),/nove semestres/);
  const mech=json.courses.find(c=>c.id==="engenharia-mecanica-bacharelado");
  const prod=json.courses.find(c=>c.id==="engenharia-de-producao-bacharelado");
  assert.equal(mech.blocos.find(b=>b.tipo==="dados-basicos").campos.find(f=>f.rotulo==="Duração").valor,"5 anos");
  assert.equal(prod.blocos.find(b=>b.tipo==="dados-basicos").campos.find(f=>f.rotulo==="Duração").valor,"5 anos");
});

test("F1B.10: os oito cursos encerram com Forma de ingresso e Mundo do Trabalho", () => {
  const h=testContext();
  const graduationIds=[
    "direito-bacharelado-arcos","engenharia-mecanica-bacharelado",
    "administracao-bacharelado","agronomia-bacharelado","engenharia-de-producao-bacharelado"
  ];
  assert.equal(json.courses.length,8);
  for(const c of json.courses){
    const form=c.blocos.filter(b=>b.tipo==="texto"&&b.titulo==="Forma de ingresso");
    const work=c.blocos.filter(b=>b.tipo==="texto"&&b.titulo==="Mundo do Trabalho");
    assert.equal(form.length,1,c.id+": uma seção de ingresso");
    assert.equal(work.length,1,c.id+": um mundo do trabalho");
    assert.deepEqual(c.blocos.slice(-2).map(b=>b.titulo),["Forma de ingresso","Mundo do Trabalho"],c.id);
    assert.equal(form[0].tipo,"texto");
    assert.ok(h.editorFields(form[0]).length===1,c.id+": Rich Text único com título");
    assert.ok(h.editorFields(form[0])[0].rich,c.id);
    assert.ok(work[0].conteudo.length>250,c.id+": atividades profissionais concretas");
    assert.doesNotMatch(form[0].conteudo,/2026|2027|novembro|setembro|inscriç(?:ões|ão) (?:aberta|encerrada)|Quer ser lembrado/i,c.id);
    assert.doesNotMatch(form[0].conteudo,/informação incompleta|precisa de validação|pendente|controle privado/i,c.id);
    if(graduationIds.includes(c.id)){
      const intro=form[0].conteudo;
      assert.match(intro,/ensino médio/i,c.id);
      assert.match(intro,/matrícula/i,c.id);
      assert.match(intro,/edita(?:l|is)/i,c.id);
      assert.match(intro,/Sisu/i,c.id);
      assert.ok(c.blocos.findIndex(b=>b.titulo==="Experiências e conquistas dos estudantes")<
        c.blocos.findIndex(b=>b.titulo==="Forma de ingresso"),c.id+": experiências antes do ingresso");
      assert.ok(c.blocos.findIndex(b=>b.titulo==="Continue seus estudos no IFMG")<
        c.blocos.findIndex(b=>b.titulo==="Forma de ingresso"),c.id+": continuidade antes do ingresso");
    }
  }
  const law=json.courses.find(c=>c.id==="direito-bacharelado-arcos").blocos.at(-2).conteudo;
  assert.match(law,/Campus Arcos/);
  assert.match(law,/Histórico Escolar e Redação/);
  assert.doesNotMatch(law,/notas do Enem|Enem direto/i);
  for(const [id,campi] of [
    ["engenharia-mecanica-bacharelado",["Arcos","Betim"]],
    ["administracao-bacharelado",["campi"]],
    ["agronomia-bacharelado",["Bambuí","São João Evangelista"]],
    ["engenharia-de-producao-bacharelado",["Bambuí","Congonhas","Governador Valadares"]]
  ]){
    const form=json.courses.find(c=>c.id===id).blocos.at(-2).conteudo;
    for(const campus of campi)assert.ok(form.includes(campus),id+": "+campus);
  }
});

test("F1B.12: informações dos campi usam FAQ do Wagtail separado das perguntas frequentes", () => {
  const h=testContext();
  const specs=[
    {id:"tecnico-em-edificacoes-integrado",tableTitle:"Onde o IFMG oferece Técnico em Edificações",
     campi:["Congonhas","Governador Valadares","Ouro Preto","Piumhi","Santa Luzia"]},
    {id:"tecnico-em-logistica-subsequente",tableTitle:"Onde o IFMG oferece Técnico em Logística",
     campi:["Governador Valadares","Ribeirão das Neves"]},
    {id:"tecnico-em-administracao-integrado",tableTitle:"Onde o IFMG oferece Técnico em Administração Integrado",
     campi:["Arcos","Bambuí","Formiga","Ouro Branco","Ouro Preto","Ponte Nova","Ribeirão das Neves","Sabará"]},
    {id:"engenharia-mecanica-bacharelado",tableTitle:"Onde o IFMG oferece Engenharia Mecânica",campi:["Arcos","Betim"]},
    {id:"administracao-bacharelado",tableTitle:"Onde o IFMG oferece Administração",campi:["Bambuí","Formiga","Ouro Branco","Ribeirão das Neves","Sabará","São João Evangelista"]},
    {id:"agronomia-bacharelado",tableTitle:"Onde o IFMG oferece Agronomia",campi:["Bambuí","São João Evangelista"]},
    {id:"engenharia-de-producao-bacharelado",tableTitle:"Onde o IFMG oferece Engenharia de Produção",campi:["Bambuí","Congonhas","Governador Valadares"]},
    {id:"direito-bacharelado-arcos",tableTitle:"Onde o IFMG oferece Direito",campi:["Arcos"]}
  ];
  for(const {id,tableTitle,campi} of specs){
    const c=json.courses.find(x=>x.id===id);
    const i=c.blocos.findIndex(x=>x.titulo===tableTitle);
    assert.ok(i>=0,id+": seção de ofertas");
    const table=c.blocos[i+1];
    assert.equal(table.tipo,"tabela",id);
    assert.deepEqual(table.linhas.map(x=>x[0]),campi,id+": ordem da tabela");
    const local=c.blocos[i+2];
    assert.equal(local.tipo,"faq",id+": bloco FAQ de campi depois da tabela");
    assert.equal(local.titulo,"Informações dos campi",id);
    assert.deepEqual(local.itens.map(x=>x.pergunta),campi.map(x=>"Campus "+x),id);
    assert.ok(local.itens.every(x=>x.resposta.length>100),id);
    assert.ok(local.itens.every(x=>!/(informação incompleta|precisa de validação|confirmar com a coordenação|a apresentação institucional registra)/i.test(x.resposta)),id);
    const fields=h.editorFields(local);
    assert.equal(fields.length,2*campi.length,id+": Pergunta e Resposta de cada campus");
    for(let k=0;k<campi.length;k++){
      assert.equal(fields[k*2].value,"Campus "+campi[k],id);
      assert.equal(fields[k*2].rich,false,id+": Pergunta como rótulo");
      assert.equal(fields[k*2+1].value,local.itens[k].resposta,id+": preservar descrição");
      assert.equal(fields[k*2+1].rich,true,id+": Resposta rica");
      assert.ok(fields[k*2+1].html.includes("<p>"),id+": parágrafos em HTML");
    }
    assert.equal((h.editorBlock(local,10).match(/data-copy-field=/g)||[]).length,2*campi.length,id);
    assert.match(h.editorBlock(local,10),/FAQ · Informações dos campi/);
    const header=c.blocos.findIndex((x,j)=>j>i+2&&x.titulo==="Perguntas frequentes");
    assert.ok(header>i+2,id+": FAQ dos candidatos independente");
    const candidate=c.blocos[header+1];
    assert.equal(candidate.tipo,"faq",id);
    assert.notEqual(candidate,local,id);
    assert.ok(candidate.itens.every(x=>x.pergunta.endsWith("?")),id+": perguntas genuínas");
    assert.ok(candidate.itens.every(x=>!x.pergunta.startsWith("Campus ")),id);
    assert.equal(c.blocos.filter(x=>x.tipo==="faq").length,2,id+": dois FAQs de funções diferentes");
    assert.ok(!c.blocos.some(x=>x.tipo==="texto"&&x.titulo?.startsWith("Campus ")),id+": não duplicar Texto local");
    assert.deepEqual(c.blocos.slice(-2).map(x=>x.titulo),["Forma de ingresso","Mundo do Trabalho"],id);
    assert.ok(h.isApprovedCourse(c),id);
  }
});

test("F1B.9: informações locais verificadas continuam atribuídas ao campus certo", () => {
  const ed=json.courses.find(x=>x.id==="tecnico-em-edificacoes-integrado");
  const get=(c,campus)=>c.blocos.find(x=>x.tipo==="faq"&&x.titulo==="Informações dos campi")?.itens.find(x=>x.pergunta==="Campus "+campus)?.resposta||"";
  assert.match(get(ed,"Congonhas"),/solos, materiais de construção/);
  assert.match(get(ed,"Governador Valadares"),/visitas técnicas/);
  assert.match(get(ed,"Ouro Preto"),/3\.460 horas/);
  assert.match(get(ed,"Ouro Preto"),/0,86%/);
  assert.match(get(ed,"Piumhi"),/componentes obrigatórios e optativos/);
  assert.match(get(ed,"Santa Luzia"),/10,3%/);
  const lg=json.courses.find(x=>x.id==="tecnico-em-logistica-subsequente");
  assert.match(get(lg,"Governador Valadares"),/dois módulos/);
  assert.match(get(lg,"Governador Valadares"),/encontro presencial/);
  assert.match(get(lg,"Ribeirão das Neves"),/logística reversa/);
  const table=lg.blocos.find((x,i)=>x.tipo==="tabela"&&lg.blocos[i-1]?.titulo==="Onde o IFMG oferece Técnico em Logística");
  assert.ok(table);
  assert.equal(table.linhas.find(x=>x[0]==="Governador Valadares").at(-1),"coordenacao.tslog.gv@ifmg.edu.br");
  assert.equal(table.linhas.find(x=>x[0]==="Ribeirão das Neves").at(-1),"Informação incompleta");
  assert.doesNotMatch(JSON.stringify(lg.blocos.find(x=>x.tipo==="faq"&&x.titulo==="Informações dos campi").itens),/certificado de Assistente/);
});

test("F1B.9: oito campi de Administração têm informações próprias e FAQ de dúvidas reais", () => {
  const c=json.courses.find(x=>x.id==="tecnico-em-administracao-integrado");
  const content=campus=>c.blocos.find(x=>x.tipo==="faq"&&x.titulo==="Informações dos campi")?.itens.find(x=>x.pergunta==="Campus "+campus)?.resposta||"";
  const expectations=[
    ["Arcos",/Trabalho Acadêmico Integrador.*TAI/],
    ["Bambuí",/tecnologia e relações humanas/],
    ["Formiga",/três anos, em séries anuais/],
    ["Ouro Branco",/3\.442 horas/],
    ["Ouro Preto",/3\.180 horas/],
    ["Ponte Nova",/empreendedorismo, inovação/],
    ["Ribeirão das Neves",/recrutamento e treinamento/],
    ["Sabará",/16,67%/]
  ];
  for(const [campus,rx] of expectations){
    const body=content(campus);
    assert.ok(body.length>200,campus);
    assert.match(body,rx,campus);
  }
  assert.doesNotMatch(content("Sabará"),/Expo Favela Minas/);
  assert.match(content("Sabará"),/16,67%/);
  const faq=c.blocos.find(x=>x.tipo==="faq"&&x.titulo!=="Informações dos campi");
  assert.equal(faq.itens.length,6);
  assert.ok(faq.itens.every(x=>x.pergunta.includes("?")&&x.resposta.length>70));
  assert.ok(faq.itens.every(x=>!c.campi.includes(x.pergunta)));
  assert.ok(faq.itens.some(x=>x.pergunta.includes("distância")&&x.resposta.includes("16%")));
  const joined=JSON.stringify(c.blocos.find(x=>x.tipo==="faq"&&x.titulo==="Informações dos campi").itens);
  assert.doesNotMatch(joined,/Informação incompleta|referência sem validação|Hackathon Social|Mais informações no campus/);
  const camposDeTexto=c.blocos.flatMap(b=>b.tipo==="texto"?[b.conteudo||""]:b.tipo==="faq"?(b.itens||[]).map(item=>item.resposta||""):[]);
  assert.equal(camposDeTexto.filter(v=>v.includes("Expo Favela Minas")).length,1,"visita comprovada citada apenas em Projetos e experiências");
  assert.doesNotMatch(JSON.stringify(c.blocos),/Hackathon Social/,"não publicar projeto sem prova de vinculação ao curso");
  assert.deepEqual(c.blocos.slice(-2).map(x=>x.titulo),["Forma de ingresso","Mundo do Trabalho"]);
});

test("F1B.9: cursos superiores distinguem atividades e fontes de cada campus", () => {
  const get=(id,campus)=>json.courses.find(c=>c.id===id).blocos.find(b=>b.tipo==="faq"&&b.titulo==="Informações dos campi")?.itens.find(x=>x.pergunta==="Campus "+campus)?.resposta||"";
  const cases=[
    ["engenharia-mecanica-bacharelado","Arcos",/Trabalhos Acadêmicos Integradores/],
    ["engenharia-mecanica-bacharelado","Betim",/360 horas de extensão.*180 horas de atividades complementares/],
    ["administracao-bacharelado","Bambuí",/Trabalhos Interdisciplinares/],
    ["administracao-bacharelado","Formiga",/20% da carga horária a distância/],
    ["administracao-bacharelado","Ouro Branco",/8% da carga horária a distância/],
    ["administracao-bacharelado","Ribeirão das Neves",/planos de negócios/],
    ["administracao-bacharelado","Sabará",/23,67%/],
    ["administracao-bacharelado","São João Evangelista",/Destaque Jr/],
    ["agronomia-bacharelado","Bambuí",/duração prevista de nove semestres/],
    ["agronomia-bacharelado","São João Evangelista",/estágio supervisionado obrigatório.*Trabalho de Conclusão de Curso/],
    ["engenharia-de-producao-bacharelado","Bambuí",/processos produtivos, custos, qualidade/],
    ["engenharia-de-producao-bacharelado","Congonhas",/planejamento da produção, logística/],
    ["engenharia-de-producao-bacharelado","Governador Valadares",/planejamento, qualidade, logística/],
    ["direito-bacharelado-arcos","Arcos",/prática jurídica simulada e real/]
  ];
  for(const [id,campus,pattern] of cases) assert.match(get(id,campus),pattern,id+" — "+campus);
  const direito=json.courses.find(x=>x.id==="direito-bacharelado-arcos");
  const at=direito.blocos.findIndex(x=>x.titulo==="Onde o IFMG oferece Direito");
  assert.deepEqual(direito.blocos[at+1].colunas,["Campus","Turno","Modalidade","E-mail da coordenação"]);
  assert.deepEqual(direito.blocos[at+1].linhas,[["Arcos","Noite","Presencial (30% EaD)","direito.arcos@ifmg.edu.br"]]);
  assert.ok(!direito.blocos[at+1].linhas.some(x=>x.includes("Informação incompleta")));
  const admin=json.courses.find(x=>x.id==="administracao-bacharelado");
  assert.ok(admin.blocos.find(x=>x.tipo==="faq"&&x.titulo!=="Informações dos campi").itens.every(x=>x.pergunta.includes("?")&&!admin.campi.includes(x.pergunta)));
  const agr=json.courses.find(x=>x.id==="agronomia-bacharelado");
  assert.ok(!agr.blocos.find(x=>x.tipo==="faq"&&x.titulo!=="Informações dos campi").itens.some(x=>x.pergunta==="Qual a duração de Agronomia em Bambuí?"));
  const prod=json.courses.find(x=>x.id==="engenharia-de-producao-bacharelado");
  assert.ok(!prod.blocos.find(x=>x.tipo==="faq"&&x.titulo!=="Informações dos campi").itens.some(x=>x.pergunta==="O que diferencia a formação em Congonhas?"));
  const mec=json.courses.find(x=>x.id==="engenharia-mecanica-bacharelado");
  assert.ok(!mec.blocos.find(x=>x.tipo==="faq"&&x.titulo!=="Informações dos campi").itens.some(x=>/experiências práticas fazem parte da formação em Arcos|atividades acadêmicas em Betim/.test(x.pergunta)));
});

test("F3.6: todos os oito cursos descrevem tarefas reais no Mundo do Trabalho", () => {
  assert.equal(json.courses.length,8);
  const expected=new Map([
    ["tecnico-em-edificacoes-integrado",["desenhos técnicos","orçamentos"]],
    ["tecnico-em-logistica-subsequente",["controle de estoques","planejamento de rotas"]],
    ["tecnico-em-administracao-integrado",["atualizar cadastros","orçamentos"]],
    ["direito-bacharelado-arcos",["analisar situações concretas","Exame de Ordem"]],
    ["engenharia-mecanica-bacharelado",["projeto e da análise de máquinas","Confea/Crea"]],
    ["administracao-bacharelado",["acompanhar custos","gestão de pessoas"]],
    ["agronomia-bacharelado",["condições do solo","fitossanidade"]],
    ["engenharia-de-producao-bacharelado",["analisar gargalos","pesquisa operacional"]]
  ]);
  for(const course of json.courses) {
    const matching=course.blocos.filter(x=>x.tipo==="texto"&&x.titulo==="Mundo do Trabalho");
    assert.equal(matching.length,1,course.id);
    assert.ok(matching[0].conteudo.length>500,course.id);
    for(const term of expected.get(course.id)||[]) {
      assert.ok(matching[0].conteudo.toLowerCase().includes(term.toLowerCase()),course.id+": "+term);
    }
    assert.doesNotMatch(matching[0].conteudo,/emprego garantido|vaga garantida/i);
  }
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

test("Edificações encerra com Forma de ingresso atemporal e Mundo do Trabalho", () => {
  const c=json.courses.find(x=>x.id==="tecnico-em-edificacoes-integrado");
  assert.deepEqual(c.blocos.slice(-2).map(x=>x.titulo),["Forma de ingresso","Mundo do Trabalho"]);
  const intro=c.blocos.at(-2).conteudo;
  assert.match(intro,/concluí-lo até a matrícula/);
  assert.match(intro,/processo seletivo público do IFMG/);
  assert.doesNotMatch(intro,/2026|2027|48 questões|novembro|setembro|Quer ser lembrado/);
  const work=c.blocos.at(-1).conteudo;
  for(const theme of ["desenhos técnicos","orçamentos","controle de qualidade","ensaios de solos e materiais","manutenção predial","atribuições"]) {
    assert.ok(work.includes(theme),theme);
  }
  assert.ok(!c.blocos.filter(x=>x.tipo==="faq").flatMap(x=>x.itens).some(q=>q.pergunta==="Posso escolher mais de um curso na inscrição?"));
});
test("Destaque de Logística descreve a formação sem privilegiar campus", () => {
  const c=json.courses.find(x=>x.id==="tecnico-em-logistica-subsequente");
  assert.deepEqual(c.campi,["Governador Valadares","Ribeirão das Neves"]);
  const intro=c.blocos.find(x=>x.tipo==="introducao").conteudo;
  assert.ok(intro.length<=280);
  assert.match(intro,/ensino médio/);
  assert.match(intro,/transporte, armazenagem, estoques/);
  assert.doesNotMatch(intro,/Governador Valadares|Ribeirão das Neves|um ano|2027/);
});
test("fase 1: galeria acompanha projetos e Administração não tem link ou destaque genérico", () => {
  const eng=json.courses.find(c=>c.id==="engenharia-mecanica-bacharelado");
  const p=eng.blocos.findIndex(b=>b.tipo==="texto"&&b.titulo==="Projetos e experiências acadêmicas");
  assert.equal(eng.blocos[p+1].tipo,"galeria");
  assert.match(eng.blocos[p+1].referencia,/Trabalhos Acadêmicos/);
  assert.equal(eng.blocos[p+2].tipo,"texto");
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
    const faq=curso.blocos.find(b=>b.tipo==="faq"&&b.titulo!=="Informações dos campi");
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
  const faq=course.blocos.find(b=>b.tipo==="faq"&&b.titulo!=="Informações dos campi");
  const internship=faq.itens.find(x=>x.pergunta.includes("estágio e o TCC"));
  assert.match(internship.resposta,/Arcos.*350 horas/);
  assert.match(internship.resposta,/TCC.*30 horas/);
  assert.match(internship.resposta,/Betim/);
  assert.doesNotMatch(internship.resposta,/Betim[^.]*350 horas/);
});

test("Betim: estágio e PFC específicos; ingresso sem números da edição anterior", () => {
  const c=json.courses.find(x=>x.id==="engenharia-mecanica-bacharelado");
  const faq=c.blocos.find(b=>b.tipo==="faq"&&b.titulo!=="Informações dos campi").itens;
  const intern=faq.find(x=>x.pergunta.includes("estágio e o TCC")).resposta;
  assert.match(intern,/Arcos[\s\S]*350 horas/);
  assert.match(intern,/Betim[\s\S]*360 horas/);
  assert.match(intern,/Betim[\s\S]*1\.800 horas de disciplinas/);
  assert.match(intern,/PFC[\s\S]*duas disciplinas de 30 horas/);
  assert.doesNotMatch(intern,/Betim[^.]*350 horas/);
  const ingress=faq.find(x=>x.pergunta.includes("ingressar")).resposta;
  assert.match(ingress,/Arcos[\s\S]*Betim/);
  assert.match(ingress,/ensino médio/);
  assert.match(ingress,/notas do Enem/);
  assert.match(ingress,/Histórico Escolar e Redação/);
  assert.match(ingress,/Sisu/);
  assert.match(ingress,/edital vigente/);
  assert.doesNotMatch(ingress,/2027|20 vagas|18 vagas|15 por Histórico/);
  assert.match(sectionText(c,"Projetos e experiências acadêmicas"),/Betim[\s\S]*Pollyrubber[\s\S]*Contagem/);
  const localBetim=c.blocos.find(b=>b.tipo==="faq"&&b.titulo==="Informações dos campi").itens.find(x=>x.pergunta==="Campus Betim").resposta;
  assert.doesNotMatch(localBetim,/Pollyrubber|visita técnica/i,"descrição local sem repetir evento");
  assert.match(localBetim,/360 horas de extensão/);
  assert.match(localBetim,/180 horas de atividades complementares/);
  const ocorrenciasPollyrubber=c.blocos.flatMap(b=>[b.conteudo||"",...(b.itens||[]).map(i=>i.resposta||"")]).filter(t=>t.includes("Pollyrubber")).length;
  assert.equal(ocorrenciasPollyrubber,1,"a visita à Pollyrubber aparece uma única vez no conteúdo copiável");
  assert.match(sectionText(c,"Pesquisa, extensão e oportunidades"),/225[\s\S]*135[\s\S]*180 horas/);
  const intro=c.blocos.find(b=>b.tipo==="introducao").conteudo;
  assert.ok(intro.length<=280);
  assert.match(intro,/materiais, fabricação, energia e projetos/);
  assert.doesNotMatch(intro,/\b(?:Arcos|Betim)\b|\b360 horas\b/);
});

test("Betim tem pesquisa do campus e temas de trabalhos finais sem inventar premiações", () => {
  const c=json.courses.find(x=>x.id==="engenharia-mecanica-bacharelado");
  const research=sectionText(c,"Pesquisa, extensão e oportunidades");
  const works=sectionText(c,"Experiências e conquistas dos estudantes");
  assert.ok(research.startsWith("Em **Arcos**"));
  assert.ok(works.startsWith("Em **Betim**"));
  assert.match(research,/Em \*\*Betim\*\*[\s\S]*impressão 3D/);
  assert.match(research,/nos cursos de Engenharia Mecânica e Controle e Automação/);
  assert.match(works,/Em \*\*Betim\*\*[\s\S]*baterias de veículos elétricos/);
  assert.match(works,/usinagem CNC/);
  assert.doesNotMatch(works,/receberam prêmio|foram premiados|conquistaram/i);
  const gallery=c.blocos.find(x=>x.tipo==="galeria");
  assert.equal(gallery.itens.length,0);
  const faq=c.blocos.find(x=>x.tipo==="faq"&&x.titulo!=="Informações dos campi").itens;
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
    const faq=c.blocos.find(x=>x.tipo==="faq"&&x.titulo!=="Informações dos campi").itens;
    assert.ok(faq.length>=3,id);
    assert.equal(c.blocos.find(x=>x.tipo==="dados-basicos").campos.some(x=>x.rotulo==="Duração"),id==="engenharia-de-producao-bacharelado",id+": só exibir duração comprovada para o grupo");
    for(const q of questions)assert.ok(!faq.some(x=>x.pergunta===q),id+": "+q);
  }
  const c=json.courses.find(x=>x.id==="administracao-bacharelado");
  const answer=c.blocos.find(x=>x.tipo==="faq"&&x.titulo==="Informações dos campi").itens.find(x=>x.pergunta==="Campus Ouro Branco").resposta;
  assert.match(answer,/8% da carga horária a distância/);
  assert.doesNotMatch(answer,/Guia da Faculdade|quatro estrelas/);
  const local=c.blocos.find(b=>b.tipo==="faq"&&b.titulo==="Informações dos campi");
  assert.doesNotMatch(local.itens.find(x=>x.pergunta==="Campus Formiga").resposta,/conceito 4|MEC/);
  const experiences=sectionText(c,"Experiências e conquistas dos estudantes");
  assert.match(experiences,/Formiga.*conceito 4.*Ouro Branco.*quatro estrelas/);
  const copies=c.blocos.flatMap(b=>[b.conteudo||"",...(b.itens||[]).map(i=>i.resposta||"")]).join("\n");
  for(const term of ["conceito 4","quatro estrelas"])assert.equal(copies.split(term).length-1,1,term+" citado somente na seção de conquistas");
  assert.doesNotMatch(answer,/,\./);
});

test("Agronomia e Engenharia de Produção preservam campi sem reciclar vagas do PS anterior", () => {
  const checks=[
    {id:"agronomia-bacharelado",old:"agronomia-bacharelado-bambui",campi:["Bambuí","São João Evangelista"],turnos:["Manhã e tarde","Manhã e tarde"]},
    {id:"engenharia-de-producao-bacharelado",old:"engenharia-de-producao-bacharelado-bambui",campi:["Bambuí","Congonhas","Governador Valadares"],turnos:["Manhã e tarde","Noite","Noite"]}
  ];
  for(const spec of checks) {
    const c=json.courses.find(x=>x.id===spec.id);
    assert.deepEqual(c.campi,spec.campi);
    assert.ok(c.aliases.includes(spec.old));
    assert.equal(c.publicacao_autorizada,true);
    const basic=c.blocos.find(b=>b.tipo==="dados-basicos").campos;
    assert.ok(!basic.some(x=>/^Vagas(?: do PS 2027)?$/.test(x.rotulo)),spec.id+": vagas dependem de edital novo");
    const table=c.blocos.find(b=>b.tipo==="tabela"&&b.colunas.includes("E-mail da coordenação"));
    assert.deepEqual(table.colunas,["Campus","Turno","Modalidade","E-mail da coordenação"]);
    assert.deepEqual(table.linhas.map(r=>r[0]),spec.campi);
    assert.deepEqual(table.linhas.map(r=>r[1]),spec.turnos);
    assert.ok(table.linhas.every(r=>r[2]==="Presencial"));
    const faq=c.blocos.find(b=>b.tipo==="faq"&&b.titulo!=="Informações dos campi").itens;
    const ingressFaq=faq.filter(x=>x.pergunta.startsWith("Como ingressar"));
    assert.equal(ingressFaq.length,1,spec.id+": uma resposta integrada e durável");
    for(const campus of spec.campi)assert.ok(ingressFaq[0].pergunta.includes(campus)||ingressFaq[0].resposta.includes(campus),spec.id+": campus "+campus);
    assert.match(ingressFaq[0].resposta,/editais vigentes/i);
    assert.doesNotMatch(ingressFaq[0].resposta,/2027|2017|2026|\d+ vagas|inscrições ocorreram|1º de novembro/i);
    assert.ok(c.blocos.some(b=>b.tipo==="texto"&&b.titulo==="Onde o IFMG oferece "+c.nome));
    assert.ok(c.blocos.findIndex(b=>b.tipo==="galeria")<c.blocos.findIndex(b=>b.tipo==="faq"&&b.titulo!=="Informações dos campi"));
  }
  const agr=json.courses.find(x=>x.id==="agronomia-bacharelado");
  const agriIdx=agr.blocos.findIndex(b=>b.titulo==="Continue seus estudos no IFMG");
  assert.ok(agr.blocos[agriIdx+2].linhas.some(row=>row[0]==="Especialização em Meio Ambiente"));
  const prod=json.courses.find(x=>x.id==="engenharia-de-producao-bacharelado");
  const pTable=prod.blocos.find(b=>b.tipo==="tabela"&&b.colunas.includes("E-mail da coordenação"));
  assert.equal(pTable.linhas[1][3],"coordenacao.producao.congonhas@ifmg.edu.br");
  assert.equal(pTable.linhas[2][3],"coenp.gv@ifmg.edu.br");
  assert.match(prod.blocos.find(b=>b.titulo==="Experiências e conquistas dos estudantes").conteudo,/Governador Valadares/);
  assert.match(prod.blocos.find(b=>b.titulo==="Experiências e conquistas dos estudantes").conteudo,/2 de fevereiro de 2026/);
});

test("Direito explica estágio e TCC com exigências concretas", () => {
  const c=json.courses.find(x=>x.id==="direito-bacharelado-arcos");
  const faq=c.blocos.find(x=>x.tipo==="faq"&&x.titulo!=="Informações dos campi");
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
  const faq=course.blocos.find(b=>b.tipo==="faq"&&b.titulo!=="Informações dos campi");
  assert.equal(faq.itens.length,4);
  assert.ok(faq.itens.every(x=>x.pergunta.includes("?")&&!campi.includes(x.pergunta)));
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
    assert.ok(!titles.some(t=>/^Reconhecimentos e (?:premiações|avaliações)$/.test(t)),c.nome+": evitar seção duplicada");
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
  const i=c.blocos.findIndex(x=>x.titulo==="Continue seus estudos no IFMG");
  assert.ok(i>=0);
  assert.equal(c.blocos[i].conteudo,"");
  assert.equal(c.blocos[i+1].titulo,"Pós-graduação");
  const table=c.blocos[i+2];
  assert.equal(table.tipo,"tabela");
  assert.deepEqual(table.colunas,["Curso","Campus","Relação com Administração"]);
  assert.ok(table.linhas.some(row=>row[0]==="Mestrado Profissional em Administração"&&row[1]==="Formiga"));
  assert.ok(table.linhas.some(row=>row[0]==="Especialização em Gestão de Negócios"&&row[1].includes("Ouro Branco")));
  assert.ok(table.linhas.some(row=>row[0]==="Especialização em Gestão Pública e Desenvolvimento Regional"&&row[1].includes("Ribeirão das Neves")));
  assert.ok(table.linhas.some(row=>row[0]==="Especialização em Gestão"&&row[1].includes("Bambuí")));
  assert.ok(!table.linhas.some(row=>row[0]==="Mestrado Profissional em Administração"&&row[1].includes("Ouro Branco")));
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
  const sabara=tec.blocos.find(b=>b.tipo==="faq"&&b.titulo==="Informações dos campi").itens.find(x=>x.pergunta==="Campus Sabará");
  assert.ok(sabara);
  assert.match(sabara.resposta,/16,67%/);
  assert.ok(!tec.blocos.find(b=>b.tipo==="faq"&&b.titulo!=="Informações dos campi").itens.some(x=>tec.campi.includes(x.pergunta)));
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
  const faq=c.blocos.find(x=>x.tipo==="faq"&&x.titulo!=="Informações dos campi");
  const qs=faq.itens.map(x=>x.pergunta);
  assert.ok(qs.some(x=>x.includes("ingressar")));
  assert.equal(qs.length,3);
  assert.ok(!qs.some(x=>/experiências práticas|graduação a distância/i.test(x)));
  assert.ok(!qs.some(x=>/Núcleo de Práticas Jurídicas|diploma permite advogar/i.test(x)));
  assert.match(faq.itens[0].resposta,/Histórico Escolar e Redação/);
  assert.match(faq.itens[0].resposta,/Sisu/);
  assert.ok(!c.blocos.some(b=>b.tipo==="texto"&&/A página do curso apresenta referências/.test(b.conteudo)));
});

test("F5.3: Logística e Direito mantêm perguntas únicas e evidências por bloco", () => {
  const get=id=>json.courses.find(c=>c.id===id);
  const faq=c=>c.blocos.find(b=>b.tipo==="faq"&&b.titulo!=="Informações dos campi").itens;
  const log=get("tecnico-em-logistica-subsequente");
  const logFAQ=faq(log);
  assert.equal(logFAQ.length,4);
  assert.ok(!logFAQ.some(x=>/Quem pode fazer|O que vou aprender no curso/.test(x.pergunta)));
  for(const termo of ["Moodle","comparecer","assistência estudantil","cotas"])
    assert.ok(logFAQ.some(x=>(x.pergunta+" "+x.resposta).includes(termo)),termo);
  const logLocal=log.blocos.find(b=>b.tipo==="faq"&&b.titulo==="Informações dos campi").itens;
  assert.match(logLocal[0].resposta,/800 horas distribuídas em dois módulos/);
  assert.match(logLocal[1].resposta,/duração prevista de um ano/);

  const law=get("direito-bacharelado-arcos");
  const lawFAQ=faq(law);
  assert.equal(lawFAQ.length,3);
  assert.ok(!lawFAQ.some(x=>/Que experiências práticas|graduação a distância/.test(x.pergunta)));
  assert.match(sectionText(law,"Experiências de aprendizagem em Direito"),/prática jurídica simulada e real/);
  assert.match(law.blocos.find(b=>b.titulo==="Onde o IFMG oferece Direito").conteudo,/30% da carga horária EaD/);
  assert.doesNotMatch(law.blocos.find(b=>b.titulo==="Onde o IFMG oferece Direito").conteudo,/Ao longo da formação/);
  const estagio=lawFAQ.find(x=>x.pergunta.includes("estágio e Trabalho")).resposta;
  assert.match(estagio,/210 horas/);
  assert.match(estagio,/30 horas/);
  assert.ok(lawFAQ.some(x=>x.pergunta.includes("pesquisa e extensão")&&x.resposta.includes("orientação à comunidade")));
  for(const c of [log,law])
    assert.deepEqual(c.blocos.slice(-2).map(b=>b.titulo),["Forma de ingresso","Mundo do Trabalho"]);
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

test("F3.1: Congonhas e GV apresentam projeto, resultado e campus; SJE empresa júnior sem projeto presumido", () => {
  const ag=json.courses.find(c=>c.id==="agronomia-bacharelado");
  const opportunity=sectionText(ag,"Pesquisa, extensão e oportunidades");
  for(const term of ["São João Evangelista","Agricampo","Bacharelado em Agronomia","manejo de pastagens","Centro de Vivência","2025"]) {
    assert.ok(opportunity.includes(term),"Agronomia SJE: "+term);
  }
  assert.doesNotMatch(opportunity,/agricampo.*projeto concluído/i);
  const localAgronomia=ag.blocos.find(b=>b.tipo==="faq"&&b.titulo==="Informações dos campi").itens;
  const localBambui=localAgronomia.find(i=>i.pergunta==="Campus Bambuí").resposta;
  const localSje=localAgronomia.find(i=>i.pergunta==="Campus São João Evangelista").resposta;
  assert.doesNotMatch(localBambui,/Olericultura|horta escolar/);
  assert.doesNotMatch(localSje,/Agricampo|Centro de Vivência/);
  assert.ok(localSje.includes("organização curricular de **2023**"));
  const copias=ag.blocos.flatMap(b=>[b.conteudo||"",...(b.itens||[]).map(i=>i.resposta||"")]);
  assert.equal(copias.filter(t=>t.includes("Agricampo")).length,1,"Agricampo apenas em oportunidades");
  assert.ok(!copias.some(t=>/Olericultura – Seleção e Implantação|horta escolar/.test(t)),"projeto de 2022 deve ficar fora do guia");
  const agAchievements=sectionText(ag,"Experiências e conquistas dos estudantes");
  assert.equal(agAchievements,"Informação incompleta","não usar projetos ou reconhecimentos anteriores a 2025 como conquistas");
  const pro=json.courses.find(c=>c.id==="engenharia-de-producao-bacharelado");
  const practice=sectionText(pro,"Projetos e experiências acadêmicas");
  for(const term of ["Congonhas","Ambiente de Inovação e Maker","Governador Valadares","2026","ABC Borracha","Batatas Magu"]) {
    assert.ok(practice.includes(term),"Produção prática: "+term);
  }
  const research=sectionText(pro,"Pesquisa, extensão e oportunidades");
  for(const term of ["Congonhas","Gestão de Operações, Logística e Pesquisa Operacional"]) {
    assert.ok(research.includes(term),"Produção pesquisa: "+term);
  }
  const achievements=sectionText(pro,"Experiências e conquistas dos estudantes");
  for(const term of ["Bambuí","Congonhas","2025","Brazilian Journal of Production Engineering","Governador Valadares","Victor Rasquinho Ho Te Chang","Dominycke Guasti de Melo","impressão 3D"]) {
    assert.ok(achievements.includes(term),"Produção conquista: "+term);
  }
  assert.ok(pro.blocos.filter(b=>b.tipo==="galeria").every(b=>b.itens.length===0));
  assert.doesNotMatch(achievements,/premiados em 2026|vaga garantida/);
});

test("F5.3: Engenharia de Produção apresenta cada atividade uma vez no bloco adequado", () => {
  const c=json.courses.find(c=>c.id==="engenharia-de-producao-bacharelado");
  const section=title=>sectionText(c,title);
  const project=section("Projetos e experiências acadêmicas");
  const research=section("Pesquisa, extensão e oportunidades");
  const experiences=section("Experiências e conquistas dos estudantes");
  const local=c.blocos.find(b=>b.tipo==="faq"&&b.titulo==="Informações dos campi").itens;
  const texts=c.blocos.flatMap(b=>[b.conteudo||"",...(b.itens||[]).map(i=>i.resposta||"")]);
  for(const term of ["ABC Borracha","Batatas Magu","Victor Rasquinho","Gestão de Operações, Logística e Pesquisa Operacional"]) {
    assert.equal(texts.filter(t=>t.includes(term)).length,1,"não repetir: "+term);
  }
  for(const term of ["ABC Borracha","Batatas Magu","2026","Governador Valadares"])
    assert.ok(project.includes(term),"visita em projetos: "+term);
  for(const term of ["Pesquisa Operacional"])
    assert.ok(research.includes(term),"pesquisa e extensão: "+term);
  for(const term of ["Victor Rasquinho Ho Te Chang","Dominycke Guasti de Melo","modelagem e impressão 3D","artigo publicado em 2025"])
    assert.ok(experiences.includes(term),"pesquisa publicada em conquistas: "+term);
  for(const item of local)assert.doesNotMatch(item.resposta,/ABC Borracha|Batatas Magu|kits experimentais|Pesquisa Operacional|descarte correto de absorventes|Victor Rasquinho/,item.pergunta);
  assert.deepEqual(c.blocos.slice(-2).map(b=>b.titulo),["Forma de ingresso","Mundo do Trabalho"]);
});

test("F3.8: informações históricas ficam fora das conquistas públicas", () => {
  const agr=json.courses.find(c=>c.id==="agronomia-bacharelado");
  const agexp=sectionText(agr,"Experiências e conquistas dos estudantes");
  assert.equal(agexp,"Informação incompleta","sem conquistas de 2025+ verificadas para Agronomia");
  const agrecognition=sectionText(agr,"Experiências e conquistas dos estudantes");
  assert.doesNotMatch(agrecognition,/2023|conceito 4|Olericultura|horta escolar/,"sem conquistas históricas como destaques");
  assert.ok(!agrecognition.includes("São João Evangelista"),"nota de Bambuí não é nota de SJE");
  const opportunities=sectionText(agr,"Pesquisa, extensão e oportunidades");
  assert.ok(opportunities.includes("2026"));
  assert.ok(opportunities.includes("uma vaga compartilhada"));
  assert.ok(opportunities.includes("não uma oferta permanente"));
  const pro=json.courses.find(c=>c.id==="engenharia-de-producao-bacharelado");
  const research=sectionText(pro,"Pesquisa, extensão e oportunidades");
  assert.doesNotMatch(research,/Renata Aparecida|Roberta Lacorte|kits experimentais|e-book|2021|2022/,"pesquisa antiga só no histórico privado");
  assert.ok(research.includes("Congonhas"),"manter pesquisa distinta em Congonhas");
  const achievements=sectionText(pro,"Experiências e conquistas dos estudantes");
  assert.ok(achievements.includes("2025"));
  assert.ok(achievements.includes("Diretório Acadêmico"));
  assert.doesNotMatch(achievements,/Othmer Fellowship|Euclides Brandão Maluf|Desafio de Inovação de 2019/,"conquistas anteriores a 2025 ficam fora do guia");
  assert.ok(!objWithPrivateControls(agr)&&!objWithPrivateControls(pro));
});
function objWithPrivateControls(obj) {
  return /"(?:validacao|pendencias|revisao_coordenacao|instrucao)"\s*:/.test(JSON.stringify(obj));
}

test("F3.8: reconhecimentos e projetos antigos permanecem apenas no controle privado", () => {
  const ag=json.courses.find(x=>x.id==="agronomia-bacharelado");
  const pr=json.courses.find(x=>x.id==="engenharia-de-producao-bacharelado");
  const publicContent=[...ag.blocos,...pr.blocos].flatMap(b=>[b.conteudo||"",b.referencia||""]).join("\n");
  for(const old of ["Olericultura – Seleção","horta escolar","Othmer Fellowship","Euclides Brandão Maluf","Química para crianças","Desafio de Inovação de 2019","descarte de absorventes"])
    assert.ok(!publicContent.includes(old),"não publicar caso histórico: "+old);
});

test("F2.2: Bambuí descreve estágio e TCC sem inventar cargas curriculares de 2027", () => {
  const items=[
    {id:"agronomia-bacharelado",q:"Como funcionam estágio e TCC em Agronomia em Bambuí?",tokens:["estágio supervisionado obrigatório","TCC também integra a formação","orientação docente"],proibidos:/240 horas|320 horas|450 horas|160 horas/},
    {id:"engenharia-de-producao-bacharelado",q:"Como funcionam estágio e TCC em Engenharia de Produção em Bambuí?",tokens:["estágio supervisionado é","relatórios","TCC é individual","banca examinadora"],proibidos:/160 horas|360 horas|450 horas|320 horas/}
  ];
  for(const spec of items) {
    const c=json.courses.find(x=>x.id===spec.id);
    const faq=c.blocos.find(b=>b.tipo==="faq"&&b.titulo!=="Informações dos campi").itens;
    const answer=faq.find(x=>x.pergunta===spec.q)?.resposta;
    assert.ok(answer,spec.id);
    for(const term of spec.tokens)assert.ok(answer.includes(term),spec.id+": "+term);
    assert.doesNotMatch(answer,spec.proibidos);
    assert.doesNotMatch(answer,/2027|informação incompleta|conforme o PPC/i);
  }
});

test("F2.2: estágio e TCC específicos em SJE e Governador Valadares, sem herdar regras", () => {
  const ag=json.courses.find(c=>c.id==="agronomia-bacharelado");
  const af=ag.blocos.find(b=>b.tipo==="faq"&&b.titulo!=="Informações dos campi").itens;
  const sje=af.find(q=>q.pergunta==="Como funcionam estágio e TCC em Agronomia em São João Evangelista?");
  assert.ok(sje);
  assert.match(sje.resposta,/240 horas/);
  assert.match(sje.resposta,/5º período/);
  assert.match(sje.resposta,/2\.445 horas/);
  assert.match(sje.resposta,/TCC também é obrigatório/);
  assert.match(sje.resposta,/60 horas/);
  assert.ok(!af.some(q=>q.pergunta==="Como funcionam estágio e TCC em Agronomia?"));
  assert.ok(!sje.resposta.includes("320 horas"),"Carga de Bambuí não pode migrar para SJE");

  const prod=json.courses.find(c=>c.id==="engenharia-de-producao-bacharelado");
  const pf=prod.blocos.find(b=>b.tipo==="faq"&&b.titulo!=="Informações dos campi").itens;
  const congonhas=pf.find(q=>q.pergunta==="Como funcionam estágio e TCC em Engenharia de Produção em Congonhas?");
  assert.ok(congonhas);
  assert.match(congonhas.resposta,/450 horas/);
  assert.match(congonhas.resposta,/60% do curso/);
  assert.match(congonhas.resposta,/7º período/);
  assert.match(congonhas.resposta,/TCC também é obrigatório/);
  assert.doesNotMatch(congonhas.resposta,/160 horas|Governador Valadares/);
  const gv=pf.find(q=>q.pergunta==="Como funcionam estágio e TCC em Engenharia de Produção em Governador Valadares?");
  assert.ok(gv);
  assert.match(gv.resposta,/160 horas/);
  assert.match(gv.resposta,/7º período/);
  assert.match(gv.resposta,/relatório final/);
  assert.match(gv.resposta,/Projeto em Engenharia I e II/);
  assert.match(gv.resposta,/9º e o 10º períodos/);
  assert.doesNotMatch(gv.resposta,/450 horas|Congonhas/,"450h é somente do PPC histórico de Congonhas");
  assert.ok(!pf.some(q=>q.pergunta==="Como são o estágio e o TCC em Bambuí?"));
  for(const c of [ag,prod]) assert.ok(c.blocos.filter(b=>b.tipo==="faq").flatMap(b=>b.itens).every(q=>q.resposta!=="Informação incompleta"));
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
    const faq=c.blocos.find(x=>x.tipo==="faq"&&x.titulo!=="Informações dos campi");
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
  const b=h.demo.blocos.find(x=>x.tipo==="faq"&&x.titulo!=="Informações dos campi");
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

test("F1.6: a prévia omite somente blocos vazios, sem suprimir os campos do editor", () => {
  const h=testContext();
  const emptyGallery={tipo:"galeria",itens:[]};
  const emptyIntro={tipo:"introducao",conteudo:""};
  const pending={tipo:"texto",titulo:"Pesquisa, extensão e oportunidades",conteudo:"Informação incompleta"};
  assert.equal(h.blockPreview(emptyGallery,0),"");
  assert.equal(h.blockPreview(emptyIntro,1),"");
  assert.equal(h.blockPreview(pending,2),"");
  assert.match(h.editorBlock(emptyGallery,0),/Informação incompleta/);
  assert.match(h.editorBlock(pending,2),/Pesquisa, extensão e oportunidades/);
  assert.match(h.blockPreview({tipo:"texto",titulo:"Mundo do Trabalho",conteudo:"Atuação profissional."},3),/Mundo do Trabalho/);
});

test("F2.5/F3.1: Agronomia informa contato SJE e empresa júnior Safra em Bambuí", () => {
  const c=json.courses.find(x=>x.id==="agronomia-bacharelado");
  const tb=c.blocos.find(b=>b.tipo==="tabela"&&b.colunas.includes("E-mail da coordenação"));
  assert.equal(tb.linhas.find(l=>l[0]==="São João Evangelista")[3],"agronomia.sje@ifmg.edu.br");
  assert.equal(tb.linhas.find(l=>l[0]==="Bambuí")[3],"Informação incompleta","não inventar contato de Bambuí");
  const texto=sectionText(c,"Pesquisa, extensão e oportunidades");
  assert.match(texto,/Bambuí[\s\S]*Safra Júnior[\s\S]*Bacharelado em Agronomia/);
  assert.match(texto,/presta serviços na área agronômica/);
  assert.doesNotMatch(texto,/Safra Júnior.{0,90}(?:projeto concluído|prêmio|bolsa garantida)/i);
  const matched=c.blocos.findIndex(b=>b.tipo==="galeria"&&b.referencia==="Empresa júnior Safra Júnior · Bambuí");
  assert.ok(matched>0,"galeria da Safra Jr. deve existir");
  assert.equal(c.blocos[matched-1].tipo,"texto");
  assert.match(c.blocos[matched-1].conteudo,/Safra Júnior/);
  assert.equal(c.blocos[matched].itens.length,0,"foto provisória deve ser fornecida pelo editor");
  const mentions=c.blocos.flatMap(b=>[b.conteudo||"",...(b.itens||[]).map(i=>i.resposta||"")]);
  assert.equal(mentions.filter(t=>t.includes("Safra Júnior")).length,1,"não repetir a oportunidade no FAQ");
});

test("F3.7: cada experiência estruturada possui galeria própria e aviso no editor", () => {
  const h=testContext();
  const expected={
    "tecnico-em-edificacoes-integrado":1,
    "tecnico-em-logistica-subsequente":1,
    "direito-bacharelado-arcos":1,
    "engenharia-mecanica-bacharelado":6,
    "administracao-bacharelado":3,
    "agronomia-bacharelado":4,
    "engenharia-de-producao-bacharelado":6,
    "tecnico-em-administracao-integrado":1
  };
  for(const c of json.courses){
    const galleries=c.blocos.filter(b=>b.tipo==="galeria");
    assert.equal(galleries.length,expected[c.id],c.id+": quantidade de galerias da experiência");
    for(const [i,b] of c.blocos.entries()){
      if(b.tipo!=="galeria")continue;
      assert.ok(b.referencia&&b.referencia.length>10,c.id+": galeria identificada");
      assert.equal(b.itens.length,0,c.id+": não reutilizar foto sem autorização");
      assert.equal(b.tipo,"galeria");
      const previous=c.blocos[i-1];
      assert.equal(previous.tipo,"texto",c.id+": galeria deve acompanhar texto da experiência");
      const html=h.editorBlock(b,i);
      assert.match(html,/Insira qualquer imagem provisória/);
      assert.match(html,/A coordenação do curso deverá substituí-la/);
      assert.ok(html.includes(b.referencia.replaceAll("&","&amp;")),c.id+": identificação visível");
      assert.doesNotMatch(html,/data-copy-field=/,c.id+": nunca copiar placeholder");
      assert.equal(h.blockPreview(b,i),"",c.id+": galeria não preenchida oculta na prévia");
    }
    assert.deepEqual(c.blocos.slice(-2).map(b=>b.titulo),["Forma de ingresso","Mundo do Trabalho"],c.id);
  }
});

test("F3.8: experiências datadas no conteúdo copiável são de 2025 em diante", () => {
  const relevantTitles=new Set(["Projetos e experiências acadêmicas","Projetos e experiências","Práticas e experiências","Pesquisa, extensão e oportunidades","Pesquisa, extensão e aprendizagem prática","Experiências e conquistas dos estudantes","Experiências de aprendizagem em Direito"]);
  const oldDate=/\b20(?:0\d|1\d|2[0-4])\b/;
  for(const c of json.courses){
    let inside=false;
    for(const b of c.blocos){
      if(b.titulo)inside=relevantTitles.has(b.titulo);
      if(!inside||b.tipo!=="texto")continue;
      assert.doesNotMatch(b.conteudo||"",oldDate,c.id+": experiência anterior a 2025");
    }
    assert.deepEqual(c.blocos.slice(-2).map(b=>b.titulo),["Forma de ingresso","Mundo do Trabalho"]);
  }
  assert.equal(json.courses.reduce((n,c)=>n+c.blocos.filter(b=>b.tipo==="galeria").length,0),23);
});
