/* Guia de páginas de cursos IFMG — publicação seletiva.
 * A aplicação lê SOMENTE data/cursos-publicados.json deste repositório público.
 * Nenhum arquivo da vault privada é carregado aqui, nem em tempo de execução.
 */
(() => {
  "use strict";
  const ALLOWED_TYPES = new Set(["dados-basicos", "texto", "introducao", "tabela", "faq", "galeria", "links", "link-unico"]);
  const STATUS_PUBLICO = new Set(["aprovado_para_divulgacao", "em_validacao"]);
  const BASE = "./";
  const state = { courses: [], failed: false, query: "", level: "", campus: "", tab: "editor", current: "" };
  const $ = (id) => document.getElementById(id);
  const escapeHTML = (text = "") => String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const normalize = (text = "") => String(text).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  const isValidURL = (s) => { try { const u = new URL(String(s)); return u.protocol === "https:" || (u.protocol === "mailto:" && u.pathname.includes("@")); } catch { return false; } };
  const notify = (s) => { $("live-notice").textContent = s; };
  const checkedText = (s, limit = 12000) => typeof s === "string" && s.length <= limit;

  // O demonstrativo usa um curso fictício, sem atribuir dados a campi ou ofertas reais.
  const demo = {
    id:"demonstracao", nome:"Demonstração", nivel:"Exemplo", tipo:"Fictício",
    campi:["Campus fictício"], modalidade:"Exemplo",
    descricao:"", status:"demonstracao", publicacao_autorizada:false, demo:true,
    blocos:[
      {tipo:"dados-basicos",titulo:"Dados básicos",campos:[
        {rotulo:"Categoria",valor:"Cursos de graduação"},
        {rotulo:"Tipo de oferta",valor:"Graduação"},
        {rotulo:"Carga horária",valor:"Exemplo"},
        {rotulo:"Duração",valor:"Exemplo"},
        {rotulo:"Apresentação",valor:"Esta é uma página demonstrativa com dados fictícios para conhecer a experiência de preenchimento do guia."},
        {rotulo:"Modalidade",valor:"Exemplo"},
        {rotulo:"Eixo tecnológico",valor:"Exemplo"},
        {rotulo:"Campi",valor:"Campus fictício"}
      ]},
      {tipo:"texto",titulo:"Sobre o curso",conteudo:"Texto de exemplo com **negrito**.\n\nOutro parágrafo para testar a cópia."},
      {tipo:"introducao",conteudo:"Destaque de exemplo para esta página."},
      {tipo:"tabela",colunas:["Campus","Turno"],linhas:[["Campus fictício","Diurno"],["Outra unidade fictícia","Noturno"]]},
      {tipo:"texto",titulo:"Perguntas frequentes",conteudo:""},
      {tipo:"faq",itens:[
        {pergunta:"Este curso existe?",resposta:"Não. É uma demonstração."},
        {pergunta:"Como preencher?",resposta:"Use o botão Copiar ao lado de cada campo."}
      ]},
      {tipo:"link-unico",estilo:"Cartão",link:{
        rotulo:"Guia do Portal",descricao:"Instruções do Wagtail",
        url:"https://leorruas.github.io/guiaportalifmg/"
      }}
    ]
  };

  function validBasicFields(c) {
    const b = c.blocos?.[0];
    const rotulos = ["Categoria","Tipo de oferta","Carga horária","Duração","Apresentação","Modalidade","Eixo tecnológico","Campi"];
    const categorias = {"Graduação":"Cursos de graduação","Pós-graduação":"Cursos de pós-graduação","Técnico":"Cursos técnicos"};
    const ofertas = {"Bacharelado":"Graduação","Licenciatura":"Licenciaturas","Tecnólogo":"Tecnólogos","Especialização":"Pós-graduação lato sensu","Mestrado profissional":"Mestrado","Integrado":"Técnico integrado","Integrado ao Ensino Médio":"Técnico integrado","Integrado EJA":"Técnico integrado EJA","Subsequente":"Técnico subsequente"};
    if (!b || b.tipo !== "dados-basicos" || !Array.isArray(b.campos) || b.campos.length < rotulos.length) return false;
    if (c.blocos.filter(x => x.tipo === "dados-basicos").length !== 1) return false;
    const valores = b.campos.slice(0, rotulos.length);
    return valores.every((x, i) => x.rotulo === rotulos[i] && typeof x.valor === "string" && !!x.valor.trim()) &&
      valores[0].valor === categorias[c.nivel] && valores[1].valor === ofertas[c.tipo] &&
      valores[4].valor.length >= 50 && valores[4].valor.length <= 180 && !/[\r\n]/.test(valores[4].valor) &&
      valores[7].valor === c.campi.join("; ") &&
      !b.campos.slice(rotulos.length).some(x => rotulos.includes(x.rotulo));
  }

  function isApprovedCourse(c) {
    if (!c || typeof c !== "object" || c.demo || c.publicacao_autorizada !== true || !STATUS_PUBLICO.has(c.status)) return false;
    if (!checkedText(c.id, 140) || !/^[a-z0-9][a-z0-9-]*$/.test(c.id)) return false;
    if (!checkedText(c.nome, 200) || !c.nome.trim() || !checkedText(c.nivel, 100)) return false;
    if (!Array.isArray(c.campi) || !c.campi.every(v => checkedText(v, 150))) return false;
    if (!Array.isArray(c.blocos) || c.blocos.length === 0) return false;
    if (!c.blocos.every(b => validateBlock(b)) || !validBasicFields(c)) return false;
    if ("pendencias" in c || "revisao_coordenacao" in c || "validacao" in c) return false;
    return true;
  }
  function validateBlock(b) {
    if (!b || !ALLOWED_TYPES.has(b.tipo)) return false;
    if ("instrucao" in b || "validacao" in b) return false;
    if (b.titulo !== undefined && !checkedText(b.titulo, 200)) return false;
    if (["texto", "introducao"].includes(b.tipo) && !checkedText(b.conteudo || "", b.tipo === "introducao" ? 280 : 12000)) return false;
    if (b.tipo === "dados-basicos") return Array.isArray(b.campos) && b.campos.every(x => checkedText(x.rotulo, 160) && checkedText(x.valor, 500) && !("validacao" in x));
    if (b.tipo === "tabela") return Array.isArray(b.colunas) && b.colunas.length > 0 && b.colunas.every(x => checkedText(x, 160)) && Array.isArray(b.linhas) && b.linhas.every(x => Array.isArray(x) && x.length === b.colunas.length && x.every(v => checkedText(v, 1200)));
    if (b.tipo === "faq") return Array.isArray(b.itens) && b.itens.length > 0 && b.itens.every(x => checkedText(x.pergunta, 300) && checkedText(x.resposta, 2000));
    if (b.tipo === "links") return Array.isArray(b.itens) && true && b.itens.every(x => checkedText(x.rotulo, 160) && isValidURL(x.url));
    if (b.tipo === "link-unico") return b.link && checkedText(b.link.rotulo, 160) && isValidURL(b.link.url);
    if (b.tipo === "galeria") return Array.isArray(b.itens) && true && b.itens.every(x => checkedText(x.legenda, 300) && checkedText(x.alt, 300) && typeof x.url === "string" && x.url.startsWith("https:"));
    return true;
  }

  function renderInline(s) {
    // Escapar primeiro. O único destaque inline reconhecido é a marca ==...==.
    return escapeHTML(s).replace(/==([^=\n]{1,250})==/g, '<mark>$1</mark>')
      .replace(/\*\*([^*\n]{1,250})\*\*/g, "<strong>$1</strong>");
  }
  function textContentToHTML(value) {
    const lines = String(value || "").split(/\r?\n/);
    let result = "", pendingList = [];
    const flush = () => { if (pendingList.length) { result += "<ul>" + pendingList.map(x => "<li>" + renderInline(x) + "</li>").join("") + "</ul>"; pendingList = []; } };
    for (const line of lines) {
      if (/^\s*[-•]\s+/.test(line)) { pendingList.push(line.replace(/^\s*[-•]\s+/, "")); continue; }
      flush();
      if (line.trim()) result += "<p>" + renderInline(line.trim()) + "</p>";
    }
    flush();
    return result;
  }
  const blockName = { "dados-basicos": "Dados básicos", "texto": "Texto", "introducao": "Introdução", "tabela": "Tabela", "faq": "FAQ", "galeria": "Galeria", "links": "Links", "link-unico": "Link único" };
  function blockCopy(b) {
    if (b.tipo === "dados-basicos") return b.campos.map(x => x.rotulo + ": " + x.valor).join("\n");
    if (b.tipo === "tabela") return [b.colunas.join("\t"),...b.linhas.map(row => row.join("\t"))].join("\n");
    if (b.tipo === "faq") return b.itens.map(x => "Pergunta: " + x.pergunta + "\nResposta: " + x.resposta).join("\n\n");
    if (b.tipo === "links") return b.itens.map(x => x.rotulo + " — " + x.url).join("\n");
    if (b.tipo === "link-unico") return [b.link.rotulo,b.link.descricao || "",b.link.url].join("\n");
    if (b.tipo === "galeria") return b.itens.map(x => (x.legenda || "") + " — " + (x.alt || "") + " — " + x.url).join("\n");
    return [b.titulo || "",b.conteudo || ""].filter(Boolean).join("\n\n");
  }
  function blockPreview(b, i) {
    // A prévia do conteúdo publicado não exibe blocos vazios ou pendências editoriais.
    // O modo Copiar continua exibindo todos os campos para preenchimento no CMS.
    if (b.tipo === "introducao" && !(b.conteudo || "").trim()) return "";
    if (b.tipo === "galeria" && !(b.itens || []).length) return "";
    if (b.tipo === "texto" && (b.conteudo || "").trim() === "Informação incompleta") return "";
    const id = "bloco-" + i, label = '<span class="block-overline">' + escapeHTML(blockName[b.tipo]) + "</span>";
    const head = b.titulo ? "<h2>" + escapeHTML(b.titulo) + "</h2>" : "";
    if (b.tipo === "introducao") return '<section class="content-section intro-section" id="' + id + '">' + label + (b.conteudo ? "<p>" + renderInline(b.conteudo) + "</p>" : "") + "</section>";
    if (b.tipo === "dados-basicos") return '<section class="content-section" id="' + id + '">' + label + head + '<div class="table-wrap"><table><tbody>' + b.campos.map(x => '<tr><th scope="row">' + escapeHTML(x.rotulo) + '</th><td>' + escapeHTML(x.valor) + '</td></tr>').join("") + "</tbody></table></div></section>";
    if (b.tipo === "texto") return '<section class="content-section" id="' + id + '">' + label + head + textContentToHTML(b.conteudo) + "</section>";
    if (b.tipo === "tabela") return '<section class="content-section" id="' + id + '">' + label + head + '<div class="table-wrap"><table><thead><tr>' + b.colunas.map(x => '<th scope="col">' + escapeHTML(x) + '</th>').join("") + '</tr></thead><tbody>' + b.linhas.map(row => '<tr>' + row.map(x => '<td>' + renderInline(x) + '</td>').join("") + '</tr>').join("") + '</tbody></table></div></section>';
    if (b.tipo === "faq") return '<section class="content-section" id="' + id + '">' + label + head + b.itens.map(x => '<details class="faq-item"><summary>' + escapeHTML(x.pergunta) + '</summary>' + textContentToHTML(x.resposta) + '</details>').join("") + "</section>";
    if (b.tipo === "links") return '<section class="content-section" id="' + id + '">' + label + head + '<div class="link-list">' + b.itens.map(x => '<a class="link-chip" href="' + escapeHTML(x.url) + '" target="_blank" rel="noopener noreferrer">' + escapeHTML(x.rotulo) + ' <span aria-hidden="true">↗</span></a>').join("") + "</div></section>";
    if (b.tipo === "link-unico") return '<section class="content-section" id="' + id + '">' + label + head + '<div class="link-list"><a class="link-chip" href="' + escapeHTML(b.link.url) + '" target="_blank" rel="noopener noreferrer">' + escapeHTML(b.link.rotulo) + ' <span aria-hidden="true">↗</span></a></div>' + (b.link.descricao ? '<p>' + escapeHTML(b.link.descricao) + '</p>' : '') + "</section>";
    if (b.tipo === "galeria") return '<section class="content-section" id="' + id + '">' + label + head + '<div class="link-list">' + b.itens.map(x => '<figure><img loading="lazy" src="' + escapeHTML(x.url) + '" alt="' + escapeHTML(x.alt) + '"><figcaption>' + escapeHTML(x.legenda) + '</figcaption></figure>').join("") + '</div></section>';
    return "";
  }

  // Os campos Wagtail são copiáveis um a um. Nos campos de texto, o clipboard
  // recebe text/html e text/plain; o CMS decide quais marcas são permitidas.
  function asPlain(value) {
    return String(value || "").replace(/==([^=\n]+)==/g,"$1").replace(/\*\*([^*\n]+)\*\*/g,"$1");
  }
  function richHTML(value, title = "") {
    const heading = title ? "<h2>" + escapeHTML(title) + "</h2>" : "";
    return heading + textContentToHTML(value).replace(/<mark>/g, "<strong>").replace(/<\/mark>/g, "</strong>");
  }
  function tableHTML(b) {
    return "<table><thead><tr>" + b.colunas.map(x => "<th>" + escapeHTML(x) + "</th>").join("") +
      "</tr></thead><tbody>" + b.linhas.map(row => "<tr>" + row.map(x => "<td>" + renderInline(x).replace(/<mark>/g,"<strong>").replace(/<\/mark>/g,"</strong>") + "</td>").join("") + "</tr>").join("") + "</tbody></table>";
  }
  function editorFields(b) {
    const raw = (label, value, setting = false) => ({label, value: String(value ?? ""), rich: false, html: "", setting});
    const rich = (label, value) => ({label, value: String(value ?? ""), rich: true, html: richHTML(value)});
    if (b.tipo === "dados-basicos") return b.campos.map(x => raw(x.rotulo, x.valor));
    if (b.tipo === "texto") {
      // Cabeçalhos de FAQ são títulos de seção, sem segundo campo de conteúdo.
      if (/^perguntas frequentes$/i.test((b.titulo || "").trim()) &&
          (!String(b.conteudo || "").trim() || /^informação incompleta$/i.test(b.conteudo.trim()))) {
        return [{label:"Título da seção", value:b.titulo, rich:true,
          html:richHTML("", b.titulo)}];
      }
      // Um bloco Texto do Wagtail corresponde a um único campo Rich Text.
      // O título, quando existe, vai no mesmo conteúdo que os parágrafos.
      // Quando ainda não há conteúdo, manter o título da seção visível,
      // mas não oferecer cópia de um placeholder para o Wagtail.
      if (/^informação incompleta$/i.test((b.conteudo || "").trim())) {
        // O título é parte da instrução de preenchimento e deve ser copiável,
        // mesmo quando o corpo da seção ainda não foi produzido.
        return [
          ...(b.titulo ? [{label:"Título da seção",value:b.titulo,rich:true,
            html:richHTML("",b.titulo)}] : []),
          {label:"Conteúdo",value:"Informação incompleta",rich:false,html:""}
        ];
      }
      const value = [b.titulo || "", b.conteudo || ""].filter(Boolean).join("\n\n");
      return value ? [{label:"Conteúdo", value, rich:true,
        html:richHTML(b.conteudo || "", b.titulo || "")}] : [];
    }
    if (b.tipo === "introducao") return [rich("Conteúdo em destaque", b.conteudo)];
    // Mesmo componente Wagtail para dois usos editoriais distintos:
    // "Informações dos campi" tem rótulos "Campus ..." em Pergunta;
    // o FAQ de candidatos contém perguntas reais. Não criar um bloco Texto.
    if (b.tipo === "faq") return b.itens
      .filter(x => x.pergunta?.trim() && x.resposta?.trim() &&
        !/^informação incompleta$/i.test(x.pergunta.trim()) &&
        !/^informação incompleta$/i.test(x.resposta.trim()))
      .flatMap((x,i) => [
        raw("Pergunta " + (i+1), x.pergunta),
        rich("Resposta " + (i+1), x.resposta)
      ]);
    if (b.tipo === "link-unico") return [
      raw("Estilo", b.estilo || "Padrão", true),
      raw("Título / texto do link", b.link.rotulo),
      raw("Descrição", b.link.descricao || ""),
      raw("URL", b.link.url)
    ];
    if (b.tipo === "links" && !b.itens.length) return [raw("Links", "Informação incompleta")];
    if (b.tipo === "links") return [
      raw("Estilo", b.estilo || "Padrão", true),
      ...b.itens.flatMap((x,i) => [
        raw("Link " + (i+1) + " · Título", x.rotulo),
        raw("Link " + (i+1) + " · URL", x.url)
      ])
    ];
    if (b.tipo === "galeria" && !b.itens.length) return [raw("Imagens", "Informação incompleta")];
    if (b.tipo === "galeria") return b.itens.flatMap((x,i) => [
      raw("Imagem " + (i+1) + " · Legenda", x.legenda),
      raw("Imagem " + (i+1) + " · Texto alternativo", x.alt),
      raw("Imagem " + (i+1) + " · URL de referência", x.url, true)
    ]);
    if (b.tipo === "tabela") return [{
      label:"Tabela",
      value:blockCopy(b),
      rich:true,
      html:tableHTML(b),
      table:true
    }];
    return [];
  }
  function fieldHTML(field, blockIndex, fieldIndex) {
    const content = field.rich
      ? '<div class="field-example rich-example' + (field.table ? ' table-wrap editor-table' : '') + '">' + (field.html || '<span class="review-value">Informação incompleta</span>') + '</div>'
      : '<div class="field-example text-example">' + escapeHTML(field.value || "Informação incompleta") + '</div>';
    const incomplete = !field.value.trim() || /^informação incompleta$/i.test(field.value.trim());
    const action = field.setting
      ? '<span class="editor-setting" aria-label="Selecionar esta opção no Wagtail">selecionar no Wagtail</span>'
      : incomplete ? '<span class="editor-setting">Informação incompleta</span>'
      : '<button type="button" class="copy-button" data-copy-field="' + fieldIndex +
          '" data-copy-block="' + blockIndex + '">' + (field.table ? "Copiar tabela" : "Copiar") + ' <span aria-hidden="true">↗</span></button>';
    return '<div class="editor-field"><div class="editor-field-top"><span class="editor-field-label">' +
      escapeHTML(field.label) + '</span><div class="editor-field-actions">' + action +
      '</div></div>' + content + '</div>';
  }
  function editorBlock(b, i) {
    const fields = editorFields(b);
    return '<section class="block-card" id="bloco-' + i + '" aria-labelledby="block-heading-' + i + '">' +
      '<span class="block-badge" aria-hidden="true">' + String(i+1).padStart(2,"0") + '</span>' +
      '<header class="block-card-header"><h2 class="block-card-title" id="block-heading-' + i +
      '">' + escapeHTML(b.tipo === "faq" && b.titulo === "Informações dos campi" ? "FAQ · Informações dos campi" : blockName[b.tipo]) + '</h2></header>' +
      (b.tipo === "galeria" ? '<div class="gallery-guidance" role="note"><strong>Galeria da experiência: ' + escapeHTML(b.referencia || "Experiência do curso") + '</strong><p>Insira qualquer imagem provisória para preencher esta galeria. A coordenação do curso deverá substituí-la pela imagem definitiva correspondente à experiência.</p></div>' : "") +
      '<div class="editor-fields">' + fields.map((field,j) => fieldHTML(field,i,j)).join("") + '</div>' +
      '</section>';
  }
  async function copyValue(plain, html = "") {
    const text = asPlain(plain);
    if (html && navigator.clipboard?.write && typeof ClipboardItem !== "undefined") {
      try {
        const item = new ClipboardItem({
          "text/html": new Blob([html],{type:"text/html"}),
          "text/plain": new Blob([text],{type:"text/plain"})
        });
        await navigator.clipboard.write([item]);
        return "rich";
      } catch (e) { /* O navegador ou o editor pode não aceitar HTML. */ }
    }
    if (!navigator.clipboard?.writeText) throw Error("Área de transferência indisponível");
    await navigator.clipboard.writeText(text);
    return "plain";
  }
  async function performCopy(button, plain, html = "") {
    try {
      const result = await copyValue(plain, html);
      notify(result === "rich" ? "Copiado com formatação." :
        html ? "Copiado como texto simples; confira o resultado no Wagtail." : "Copiado.");
      const previous = button.innerHTML;
      button.textContent = "Copiado ✓";
      setTimeout(() => { if (button.isConnected) button.innerHTML = previous; }, 1700);
    } catch {
      notify("Não foi possível copiar. Selecione o texto visível para copiar manualmente.");
    }
  }
  function renderCourse(course) {
    const root = $("course-content");
    const activePreview = state.tab === "preview";
    const title = escapeHTML(course.nome), kind = escapeHTML([course.nivel, course.tipo].filter(Boolean).join(" / "));
    $("course-breadcrumb").textContent = course.nome;
    const flags = course.demo ? "" : [...(course.campi || []), ...(course.modalidade ? [course.modalidade] : [])].map(x => '<span class="tag">' + escapeHTML(x) + '</span>').join("");

    const headings = course.blocos.map((b,i) => {
      const previousTitle = course.blocos.slice(0,i).reverse().find(x => x.titulo)?.titulo;
      const suffix = previousTitle ? " · " + previousTitle : "";
      const label = b.tipo === "galeria" && b.referencia ? "Galeria · " + b.referencia : b.titulo || ((b.tipo === "tabela" || b.tipo === "faq") ? blockName[b.tipo] + suffix : blockName[b.tipo]);
      return { title: label, index: i };
    }).filter(x => !activePreview || blockPreview(course.blocos[x.index], x.index));
    root.innerHTML = '<div class="course-head"><div><div class="course-kicker">' + (course.demo ? "Exemplo fictício" : kind) + '</div><h1>' + title + '</h1>' + (course.descricao ? '<p>' + escapeHTML(course.descricao) + '</p>' : '') + (flags ? '<div class="course-flags">' + flags + '</div>' : '') + '</div></div>' +
      '<div class="course-tabs" role="tablist" aria-label="Modo de visualização da página"><button class="course-tab" type="button" role="tab" id="tab-editor" aria-controls="course-body" data-tab="editor" aria-selected="' + (!activePreview) + '">Copiar</button><button class="course-tab" type="button" role="tab" id="tab-preview" aria-controls="course-body" data-tab="preview" aria-selected="' + activePreview + '">Visualizar</button></div>' +
      '<div class="course-layout"><div class="course-body" id="course-body" role="tabpanel" aria-labelledby="tab-' + (activePreview ? "preview" : "editor") + '">' +
      (!activePreview ? '' : '') +
      (activePreview ? course.blocos.map(blockPreview).join("") : course.blocos.map(editorBlock).join("")) +
      '' +
      '</div><aside class="course-side"><div class="side-label">NESTA PÁGINA</div><nav aria-label="Índice dos blocos">' +
      headings.map(x => '<a href="#bloco-' + x.index + '" data-anchor="' + x.index + '"><span class="side-number">' + String(x.index+1).padStart(2,"0") + '</span>' + escapeHTML(x.title) + '</a>').join("") +
      '</nav></aside></div>';
  }

  function filterCourses() {
    return state.courses.filter(c => (!state.query || normalize([c.nome,c.nivel,c.tipo,...c.campi].join(" ")).includes(normalize(state.query))) &&
      (!state.level || c.nivel === state.level) && (!state.campus || c.campi.includes(state.campus)))
      .sort((a,b) => a.nome.localeCompare(b.nome,"pt-BR",{sensitivity:"base",numeric:true}) ||
        String(a.tipo||"").localeCompare(String(b.tipo||""),"pt-BR") || a.id.localeCompare(b.id,"pt-BR"));
  }
  function optionHTML(v) { return '<option value="' + escapeHTML(v) + '">' + escapeHTML(v) + "</option>"; }
  function updateFilters() {
    const levels = [...new Set(state.courses.map(c => c.nivel))].sort((a,b) => a.localeCompare(b,"pt-BR"));
    const campuses = [...new Set(state.courses.flatMap(c => c.campi))].sort((a,b) => a.localeCompare(b,"pt-BR"));
    $("filter-level").innerHTML = '<option value="">Todos os níveis</option>' + levels.map(optionHTML).join("");
    $("filter-campus").innerHTML = '<option value="">Todos os campi</option>' + campuses.map(optionHTML).join("");
  }
  function renderCatalog() {
    const list = filterCourses();
    $("catalog-count").textContent = list.length ? list.length + (list.length===1?" curso":" cursos") : "";
    const rows = list.map((c,i) =>
      '<a class="course-card" href="#curso/' + encodeURIComponent(c.id) +
      '"><span class="label">' + String(i+1).padStart(2,"0") +
      '</span><div class="course-card-main"><span class="course-type">' +
      escapeHTML(c.nivel) + (c.tipo ? " / " + escapeHTML(c.tipo) : "") +
      '</span><h2>' + escapeHTML(c.nome) + '</h2></div><span class="course-meta">' +
      escapeHTML(c.campi.join(" · ")) +
      '</span><span class="card-arrow" aria-hidden="true">↗</span></a>').join("");
    const hasFilter = Boolean(state.query || state.level || state.campus);
    const noCourses = !state.courses.length;
    const emptyLabel = state.failed ? "Catálogo indisponível." :
      hasFilter || !noCourses ? "Nenhum resultado." : "Nenhum curso publicado.";
    const demoRow = !state.failed && noCourses && !hasFilter
      ? '<a class="course-card demo-course-row" href="#curso/demonstracao">' +
        '<span class="label">ex.</span><div class="course-card-main">' +
        '<span class="course-type">Exemplo fictício</span><h2>Demonstração</h2></div>' +
        '<span class="card-arrow" aria-hidden="true">↗</span></a>' : "";
    $("catalog-results").innerHTML = list.length ? rows :
      '<p class="empty-state">' + emptyLabel + '</p>' + demoRow;
  }
  function route() {
    const hash = decodeURIComponent(location.hash.slice(1) || "catalogo");
    const courseID = hash.startsWith("curso/") ? hash.slice(6).split("#")[0] : "";
    const selectedView = courseID ? "course" : hash.startsWith("orientacoes") ? "help" : "home";
    ["home","help","course"].forEach(view => $(view + "-view").hidden = view !== selectedView);
    document.querySelectorAll("[data-nav]").forEach(a => {
      const nav = a.getAttribute("data-nav"), selected =
        (selectedView === "home" && nav === "catalogo") ||
        (selectedView === "help" && nav === "orientacoes");
      if (selected) a.setAttribute("aria-current","page"); else a.removeAttribute("aria-current");
    });
    if (selectedView === "home") renderCatalog();
    if (selectedView === "course") {
      const c = courseID === "demonstracao" ? demo : state.courses.find(x => x.id === courseID || x.aliases?.includes(courseID));
      if (c) {
        if (state.current !== c.id) state.tab = "editor";
        state.current = c.id;
        renderCourse(c);
        document.title = c.nome + " · Guia de cursos IFMG";
      } else { location.replace("#catalogo"); return; }
    } else {
      state.current = "";
      document.title = "Guia de páginas de cursos · IFMG";
    }
    window.scrollTo({top:0,behavior:"instant"});
  }

  function events() {
    $("theme-toggle").addEventListener("click", () => {
      const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      try { localStorage.setItem("tema-cursos-ifmg", next); } catch {}
    });
    $("filter-search").addEventListener("input", e => { state.query = e.target.value; renderCatalog(); });
    $("filter-level").addEventListener("change", e => { state.level = e.target.value; renderCatalog(); });
    $("filter-campus").addEventListener("change", e => { state.campus = e.target.value; renderCatalog(); });
    $("catalog-filters").addEventListener("reset", () => { state.query = state.level = state.campus = ""; setTimeout(renderCatalog,0); });
    $("course-content").addEventListener("click", async e => {
      const tab = e.target.closest("[data-tab]");
      if (tab) {
        const selected = tab.dataset.tab;
        if (!["preview","editor"].includes(selected)) return;
        state.tab = selected;
        const c = state.current === "demonstracao" ? demo : state.courses.find(x => x.id === state.current || x.aliases?.includes(state.current));
        if (c) { renderCourse(c); $("tab-" + selected).focus(); }
        return;
      }
      const button = e.target.closest("[data-copy-field]");
      if (button) {
        const c = state.current === "demonstracao" ? demo : state.courses.find(x => x.id === state.current || x.aliases?.includes(state.current));
        const b = c?.blocos[Number(button.dataset.copyBlock)];
        const field = b ? editorFields(b)[Number(button.dataset.copyField)] : null;
        if (field && !field.setting) {
          await performCopy(button, field.value, field.rich ? field.html : "");
        }
      }
    });
    document.addEventListener("click", (e) => {
      const indexAnchor = e.target.closest("a[data-anchor]");
      if (!indexAnchor) return;
      e.preventDefault();
      const item = $("bloco-" + indexAnchor.dataset.anchor);
      if (item) { item.scrollIntoView({behavior:"smooth",block:"start"}); item.setAttribute("tabindex","-1"); item.focus({preventScroll:true}); }
    });
    window.addEventListener("hashchange", route);
  }
  async function init() {
    try {
      const saved = localStorage.getItem("tema-cursos-ifmg"),systemDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.dataset.theme = ["light","dark"].includes(saved) ? saved : (systemDark ? "dark" : "light");
    } catch {}
    events();
    try {
      const response = await fetch(BASE + "data/cursos-publicados.json", {cache:"no-store"});
      if (!response.ok) throw new Error("HTTP " + response.status);
      const obj = await response.json();
      if (!obj || obj.schemaVersion !== 1 || !Array.isArray(obj.courses)) throw new Error("Formato de catálogo inválido");
      const valid = obj.courses.filter(isApprovedCourse);
      if (valid.length !== obj.courses.length) console.warn("O catálogo contém registros não aprovados ou inválidos. Eles foram ocultados.");
      const ids = new Set();
      state.courses = valid.filter(x => { if (ids.has(x.id)) return false; ids.add(x.id); return true; });
    } catch (e) { state.failed = true; console.error("Falha ao ler o catálogo público:", e); }
    updateFilters(); route();
  }
  init();
})();
