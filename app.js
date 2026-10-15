/* Guia de páginas de cursos IFMG — publicação seletiva.
 * A aplicação lê SOMENTE data/cursos-publicados.json deste repositório público.
 * Nenhum arquivo da vault privada é carregado aqui, nem em tempo de execução.
 */
(() => {
  "use strict";
  const ALLOWED_TYPES = new Set(["dados-basicos", "texto", "introducao", "tabela", "faq", "galeria", "links", "link-unico"]);
  const STATUS_PUBLICO = "aprovado_para_divulgacao";
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
    id: "demonstracao", nome: "Curso demonstrativo", nivel: "Exemplo", tipo: "Fictício",
    campi: ["Unidade ilustrativa"], modalidade: "Exemplo — não é uma oferta real",
    descricao: "Este material é uma demonstração do fluxo de leitura e preenchimento. Todos os dados são fictícios.",
    status: "demonstracao", publicacao_autorizada: false, demo: true,
    blocos: [
      { tipo: "dados-basicos", titulo: "Dados básicos", instrucao: "Preencha os campos próprios da página Curso antes dos blocos de conteúdo. Não duplique a área de processos seletivos.", campos: [{ rotulo: "Nome do curso", valor: "Curso demonstrativo (fictício)" }, { rotulo: "Modalidade", valor: "Apenas um exemplo de preenchimento" }, { rotulo: "Campus", valor: "Unidade ilustrativa" }] },
      { tipo: "texto", titulo: "Para quem é este curso?", instrucao: "Insira um único bloco Texto com título e parágrafos abaixo.", conteudo: "Esta é uma seção de exemplo com **palavras em negrito** para testar a cópia com formatação. Em um roteiro aprovado, ela explicará para quem o curso se destina e o que o estudante precisa conhecer." },
      { tipo: "introducao", instrucao: "Adicione um bloco Introdução. Ele deve destacar uma razão de escolha comprovada, não apenas repetir o parágrafo anterior. Limite: 280 caracteres.", conteudo: "Este é um destaque demonstrativo: nos documentos reais, ele deve evidenciar uma informação útil para a escolha do estudante." },
      { tipo: "texto", titulo: "Como comparar opções", instrucao: "Insira título e texto em um único bloco Texto.", conteudo: "O conteúdo público deve ajudar a comparar condições de estudo, formação, experiências e campus. Cada informação precisa de fonte e aprovação editorial." },
      { tipo: "tabela", titulo: "Comparação ilustrativa", instrucao: "Adicione um bloco Tabela com os cabeçalhos e linhas de demonstração.", colunas: ["Informação", "Exemplo de preenchimento"], linhas: [["Campus", "Unidade ilustrativa"], ["Contato", "Preencher somente com caixa funcional confirmada"]] },
      { tipo: "texto", titulo: "Perguntas frequentes", instrucao: "Use um bloco Texto só para o título, porque a próxima informação estará em um bloco FAQ.", conteudo: "" },
      { tipo: "faq", instrucao: "Crie um único bloco FAQ, contendo cada pergunta e resposta abaixo.", itens: [{ pergunta: "Este curso existe?", resposta: "Não. Esta página é fictícia e mostra somente a estrutura de um roteiro para o Wagtail." }, { pergunta: "Quando um curso pode aparecer no catálogo?", resposta: "Depois da revisão das fontes e da aprovação explícita de seu conteúdo para divulgação." }] },
      { tipo: "link-unico", instrucao: "Configure estilo Cartão, título, descrição e destino.", estilo: "Cartão", link: { rotulo: "Consultar o Guia do Portal", descricao: "Instruções gerais do Wagtail", url: "https://leorruas.github.io/guiaportalifmg/" } }
    ]
  };

  function isApprovedCourse(c) {
    if (!c || typeof c !== "object" || c.demo || c.publicacao_autorizada !== true || c.status !== STATUS_PUBLICO) return false;
    if (!checkedText(c.id, 140) || !/^[a-z0-9][a-z0-9-]*$/.test(c.id)) return false;
    if (!checkedText(c.nome, 200) || !c.nome.trim() || !checkedText(c.nivel, 100)) return false;
    if (!Array.isArray(c.campi) || !c.campi.every(v => checkedText(v, 150))) return false;
    if (!Array.isArray(c.blocos) || c.blocos.length === 0) return false;
    if (!c.blocos.every(b => validateBlock(b))) return false;
    return true;
  }
  function validateBlock(b) {
    if (!b || !ALLOWED_TYPES.has(b.tipo)) return false;
    if (b.instrucao !== undefined && !checkedText(b.instrucao, 3500)) return false;
    if (b.titulo !== undefined && !checkedText(b.titulo, 200)) return false;
    if (["texto", "introducao"].includes(b.tipo) && !checkedText(b.conteudo || "", b.tipo === "introducao" ? 280 : 12000)) return false;
    if (b.tipo === "dados-basicos") return Array.isArray(b.campos) && b.campos.every(x => checkedText(x.rotulo, 160) && checkedText(x.valor, 500));
    if (b.tipo === "tabela") return Array.isArray(b.colunas) && b.colunas.length > 0 && b.colunas.every(x => checkedText(x, 160)) && Array.isArray(b.linhas) && b.linhas.every(x => Array.isArray(x) && x.length === b.colunas.length && x.every(v => checkedText(v, 1200)));
    if (b.tipo === "faq") return Array.isArray(b.itens) && b.itens.length > 0 && b.itens.every(x => checkedText(x.pergunta, 300) && checkedText(x.resposta, 2000));
    if (b.tipo === "links") return Array.isArray(b.itens) && b.itens.every(x => checkedText(x.rotulo, 160) && isValidURL(x.url));
    if (b.tipo === "link-unico") return b.link && checkedText(b.link.rotulo, 160) && isValidURL(b.link.url);
    if (b.tipo === "galeria") return Array.isArray(b.itens) && b.itens.every(x => checkedText(x.legenda, 300) && checkedText(x.alt, 300) && typeof x.url === "string" && x.url.startsWith("https:"));
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
    const raw = (label, value) => ({ label, value: String(value || ""), rich: false, html: "" });
    const rich = (label, value, heading = "") => ({label, value: String(value || ""), rich: true, html: richHTML(value, heading)});
    if (b.tipo === "dados-basicos") return b.campos.map(x => raw(x.rotulo, x.valor));
    if (b.tipo === "texto") {
      const parts = [];
      if (b.titulo) parts.push(rich("Título da seção", b.titulo, "")); 
      if (b.conteudo) parts.push(rich("Texto do bloco", b.conteudo));
      return parts;
    }
    if (b.tipo === "introducao") return [rich("Texto em destaque (Introdução)", b.conteudo)];
    if (b.tipo === "faq") return b.itens.flatMap((x,i) => [raw("Item " + (i+1) + " · Pergunta", x.pergunta),rich("Item " + (i+1) + " · Resposta", x.resposta)]);
    if (b.tipo === "link-unico") return [
      raw("Estilo do bloco", b.estilo || "Padrão"),
      raw("Título / texto do link", b.link.rotulo),
      raw("Descrição / texto de apoio", b.link.descricao || ""),
      raw("Link / URL de destino", b.link.url)
    ];
    if (b.tipo === "links") return b.itens.flatMap((x,i) => [
      raw("Link " + (i+1) + " · Texto", x.rotulo),
      raw("Link " + (i+1) + " · Endereço", x.url)
    ]);
    if (b.tipo === "galeria") return b.itens.flatMap((x,i) => [
      raw("Imagem " + (i+1) + " · Legenda", x.legenda),
      raw("Imagem " + (i+1) + " · Texto alternativo", x.alt),
      raw("Imagem " + (i+1) + " · URL", x.url)
    ]);
    if (b.tipo === "tabela") return [
      {label:"Tabela completa (colunas e linhas)",value:blockCopy(b),rich:true,html:tableHTML(b)}
    ];
    return [];
  }
  function fieldHTML(field, blockIndex, fieldIndex) {
    const info = escapeHTML(field.label);
    const content = field.rich
      ? '<div class="field-example rich-example">' + (field.label === "Título da seção" ? "<strong>" + escapeHTML(field.value) + "</strong>" : field.html) + '</div>'
      : '<div class="field-example text-example">' + escapeHTML(field.value || "—") + '</div>';
    const actions = field.rich
      ? '<button type="button" class="copy-button" data-copy-field="' + fieldIndex + '" data-copy-block="' + blockIndex + '" data-copy-format="rich">copiar formatado</button>' +
        '<button type="button" class="copy-button copy-secondary" data-copy-field="' + fieldIndex + '" data-copy-block="' + blockIndex + '" data-copy-format="plain">copiar texto</button>'
      : '<button type="button" class="copy-button" data-copy-field="' + fieldIndex + '" data-copy-block="' + blockIndex + '" data-copy-format="plain">copiar</button>';
    return '<div class="editor-field"><div class="editor-field-top"><span class="editor-field-label">' + info +
      '</span><div class="editor-field-actions">' + actions + '</div></div>' + content + '</div>';
  }
  function linkExample(b) {
    const link = b.link;
    if (!isValidURL(link.url)) return "";
    return '<div class="block-link-example"><div class="example-overline">Exemplo de como o Link único aparece na página</div>' +
      '<a class="link-example" href="' + escapeHTML(link.url) + '" target="_blank" rel="noopener noreferrer">' +
      '<strong>' + escapeHTML(link.rotulo) + '</strong>' +
      (link.descricao ? '<span>' + escapeHTML(link.descricao) + '</span>' : "") +
      '<span aria-hidden="true">↗</span></a></div>';
  }
  function editorBlock(b, i) {
    const info = b.instrucao || ("Preencha o bloco " + blockName[b.tipo] + " com os campos indicados.");
    const fields = editorFields(b);
    const example = b.tipo === "link-unico" ? linkExample(b) : "";
    const whole = b.tipo === "texto" || b.tipo === "faq" || b.tipo === "tabela" || b.tipo === "links";
    return '<article class="block-card" id="bloco-' + i + '"><div class="block-card-top"><span class="block-index">' + String(i + 1).padStart(2, "0") +
      '</span><span class="block-type">Bloco Wagtail / ' + escapeHTML(blockName[b.tipo]) + '</span></div>' +
      '<div class="block-instructions"><strong>Como preencher</strong><p>' + escapeHTML(info) + '</p></div>' +
      example +
      '<div class="editor-fields">' + fields.map((field,j) => fieldHTML(field,i,j)).join("") + '</div>' +
      (whole ? '<div class="block-actions"><button class="copy-button copy-whole" type="button" data-copy-whole="' + i +
      '">copiar bloco completo' + (b.tipo === "texto" || b.tipo === "tabela" ? " com formatação" : "") + '</button></div>' : "") +
      '</article>';
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
      const message = result === "rich" ? "Copiado com formatação HTML e texto simples." :
        html ? "Este navegador copiou o texto sem formatação." : "Campo copiado.";
      notify(message);
      const previous = button.textContent;
      button.textContent = result === "rich" ? "formatado ✓" : "copiado ✓";
      setTimeout(() => { if (button.isConnected) button.textContent = previous; }, 1700);
    } catch {
      notify("Não foi possível copiar. Selecione o valor visível para copiar manualmente.");
    }
  }
  function renderCourse(course) {
    const root = $("course-content");
    const activePreview = state.tab === "preview";
    const title = escapeHTML(course.nome), kind = escapeHTML([course.nivel, course.tipo].filter(Boolean).join(" / "));
    $("course-breadcrumb").textContent = course.nome;
    const flags = [...(course.campi || []), ...(course.modalidade ? [course.modalidade] : [])].map(x => '<span class="tag">' + escapeHTML(x) + '</span>').join("");
    const headings = course.blocos.map((b,i) => ({ title: b.titulo || blockName[b.tipo], index: i }));
    root.innerHTML = '<div class="course-head"><div><div class="course-kicker">' + (course.demo ? "Demonstração fictícia" : "Conteúdo revisado") + ' / ' + kind + '</div><h1>' + title + '</h1><p>' + escapeHTML(course.descricao || "") + '</p><div class="course-flags">' + (course.demo ? '<span class="tag demo-tag">Exemplo sem dados reais</span>' : "") + flags + '</div></div><a class="button button-outline" href="#catalogo">Voltar ao catálogo <span aria-hidden="true">↗</span></a></div>' +
      '<div class="course-tabs" role="tablist" aria-label="Modo de visualização da página"><button class="course-tab" type="button" role="tab" id="tab-preview" aria-controls="course-body" data-tab="preview" aria-selected="' + activePreview + '">Visualização</button><button class="course-tab" type="button" role="tab" id="tab-editor" aria-controls="course-body" data-tab="editor" aria-selected="' + (!activePreview) + '">Como preencher no Wagtail</button></div>' +
      '<div class="course-layout"><div class="course-body" id="course-body" role="tabpanel" aria-labelledby="tab-' + (activePreview ? "preview" : "editor") + '">' +
      (activePreview ? course.blocos.map(blockPreview).join("") : course.blocos.map(editorBlock).join("")) +
      (course.demo ? '<div class="course-warning">Este é um exemplo fictício. Não representa curso, campus ou oferta do IFMG.</div>' : "") +
      '</div><aside class="course-side"><div class="side-label">NESTA PÁGINA</div><nav aria-label="Índice dos blocos">' +
      headings.map(x => '<a href="#bloco-' + x.index + '" data-anchor="' + x.index + '">' + escapeHTML(x.title) + '</a>').join("") +
      '</nav><p>' + (activePreview ? "Prévia visual dos blocos aprovados." : "Siga a ordem e copie o conteúdo de cada bloco para o Wagtail.") + '</p></aside></div>';
  }

  function filterCourses() {
    return state.courses.filter(c => (!state.query || normalize([c.nome,c.nivel,c.tipo,...c.campi].join(" ")).includes(normalize(state.query))) &&
      (!state.level || c.nivel === state.level) && (!state.campus || c.campi.includes(state.campus)));
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
    $("catalog-count").textContent = list.length + (list.length === 1 ? " roteiro" : " roteiros") + " disponíveis";
    $("catalog-results").innerHTML = list.length ? list.map((c,i) => '<a class="course-card" href="#curso/' + encodeURIComponent(c.id) + '"><span class="label">' + String(i + 1).padStart(2, "0") + '</span><div class="course-card-main"><span class="course-type">' + escapeHTML(c.nivel) + (c.tipo ? " / " + escapeHTML(c.tipo) : "") + '</span><h2>' + escapeHTML(c.nome) + '</h2></div><span class="course-meta">' + escapeHTML(c.campi.join(" · ")) + '</span><span class="card-arrow" aria-hidden="true">↗</span></a>').join("") :
      '<div class="empty-state"><span class="empty-icon">' + (state.failed ? "ERRO DE CARREGAMENTO" : (state.courses.length ? "NENHUM RESULTADO" : "AGUARDANDO CONTEÚDOS APROVADOS")) + '</span><h2>' +
      (state.failed ? "O catálogo não pôde ser carregado." : (state.courses.length ? "Nenhum curso corresponde à busca." : "O catálogo começa pela revisão.")) +
      '</h2><p>' + (state.failed ? "Não foi possível acessar o índice de cursos. Confira a conexão ou a configuração dos arquivos públicos." : (state.courses.length ? "Experimente outros termos ou limpe os filtros." : "Os primeiros roteiros ainda estão em validação editorial. Você pode conhecer a estrutura do guia usando um exemplo inteiramente fictício.")) +
      '</p><button class="button button-outline" type="button" id="demo-from-catalog">Abrir demonstração <span aria-hidden="true">↗</span></button></div>';
    const demoButton = $("demo-from-catalog");
    if (demoButton) demoButton.addEventListener("click", () => { location.hash = "#curso/demonstracao"; });
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
      const c = courseID === "demonstracao" ? demo : state.courses.find(x => x.id === courseID);
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
        const c = state.current === "demonstracao" ? demo : state.courses.find(x => x.id === state.current);
        if (c) { renderCourse(c); $("tab-" + selected).focus(); }
        return;
      }
      const button = e.target.closest("[data-copy-field], [data-copy-whole]");
      if (button) {
        const c = state.current === "demonstracao" ? demo : state.courses.find(x => x.id === state.current);
        const index = Number(button.dataset.copyBlock ?? button.dataset.copyWhole);
        const b = c?.blocos[index];
        if (!b) return;
        if (button.hasAttribute("data-copy-field")) {
          const field = editorFields(b)[Number(button.dataset.copyField)];
          if (field) await performCopy(button, field.value, button.dataset.copyFormat === "rich" ? field.html : "");
        } else {
          const html = b.tipo === "texto" ? richHTML(b.conteudo,b.titulo) :
            b.tipo === "tabela" ? tableHTML(b) : "";
          await performCopy(button, blockCopy(b), html);
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
