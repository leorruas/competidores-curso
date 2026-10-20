/**
 * Contrato estrutural do guia: independente da quantidade de cursos, campi
 * e galerias. Não atribui aprovação acadêmica ao conteúdo.
 */
export function validarEstruturaCurso(curso) {
  const erros = [];
  if (!curso || typeof curso !== "object" || !Array.isArray(curso.blocos)) {
    return ["curso sem blocos"];
  }
  const blocos = curso.blocos;
  // Ordem de cadastro no Wagtail: oito campos obrigatórios, seguidos de dados complementares.
  const ordemCadastro = ["Categoria","Tipo de oferta","Carga horária","Duração","Apresentação","Modalidade","Eixo tecnológico","Campi"];
  const categoriasCadastro = {"Graduação":"Cursos de graduação","Pós-graduação":"Cursos de pós-graduação","Técnico":"Cursos técnicos"};
  const ofertasCadastro = {"Bacharelado":"Graduação","Licenciatura":"Licenciaturas","Tecnólogo":"Tecnólogos","Especialização":"Pós-graduação lato sensu","Mestrado profissional":"Mestrado","Integrado":"Técnico integrado","Integrado ao Ensino Médio":"Técnico integrado","Integrado EJA":"Técnico integrado EJA","Subsequente":"Técnico subsequente"};
  // Turno, PPC/matriz e contato pertencem às seções por campus ou documentos,
  // não aos campos de cadastro copiáveis como Dados básicos.
  const campoForaDoCadastro = label => /^(?:turnos?(?:$|[\s/-])|ppc(?:$|[\s/-])|matriz(?:$|[\s/-])|e-mails?\s+d(?:a|as)\s+coordenaç(?:ão|ões)(?:$|[\s-])|coordenação\/contato$|contatos$)/i.test(String(label || "").trim());
  const dadosBasicos = blocos.filter(b => b?.tipo === "dados-basicos");
  if (dadosBasicos.length !== 1 || blocos[0] !== dadosBasicos[0]) {
    erros.push("dados básicos devem ser o primeiro bloco e aparecer uma única vez");
  } else {
    const campos = dadosBasicos[0].campos;
    if (!Array.isArray(campos) || campos.length < ordemCadastro.length ||
        ordemCadastro.some((rotulo, i) => campos[i]?.rotulo !== rotulo)) {
      erros.push("dados básicos: ordem obrigatória dos oito campos de cadastro");
    } else {
      const valores = campos.slice(0, ordemCadastro.length).map(x => x.valor);
      if (valores.some(x => typeof x !== "string" || !x.trim()))
        erros.push("dados básicos: os oito campos precisam de valor ou Informação incompleta");
      if (valores[0] !== categoriasCadastro[curso.nivel])
        erros.push("dados básicos: categoria incompatível com o nível do curso");
      if (valores[1] !== ofertasCadastro[curso.tipo])
        erros.push("dados básicos: tipo de oferta incompatível com a formação");
      if (typeof valores[4] !== "string" || valores[4].trim().length < 50 || valores[4].length > 180 || /[\r\n]/.test(valores[4]))
        erros.push("dados básicos: apresentação obrigatória com 50 a 180 caracteres, em uma linha");
      if (Array.isArray(curso.campi) && valores[7] !== curso.campi.join("; "))
        erros.push("dados básicos: campi divergentes da lista oficial do roteiro");
      const duplicados = campos.slice(ordemCadastro.length).filter(c => ordemCadastro.includes(c?.rotulo));
      if (duplicados.length) erros.push("dados básicos: campos de cadastro duplicados");
      if (campos.slice(ordemCadastro.length).some(x => campoForaDoCadastro(x?.rotulo)))
        erros.push("dados básicos: retirar Turno, PPC/matriz e e-mail da coordenação; usar seções específicas");
    }
  }
  // As tabelas do Wagtail devem exibir a primeira linha como cabeçalho.
  // A legenda do próprio bloco deve permanecer vazia, sem texto inventado.
  for (const [i, bloco] of blocos.entries()) {
    if (bloco?.tipo !== "tabela") continue;
    if (bloco.cabecalhoPrimeiraLinha !== true)
      erros.push("tabela " + i + ": selecionar Exibir a primeira linha como cabeçalho");
    if ("legenda" in bloco && bloco.legenda !== "")
      erros.push("tabela " + i + ": Legenda da tabela deve ficar em branco");
  }
  // Na pós-graduação, a continuidade é opcional: só faz sentido apresentar
  // uma formação de nível superior disponível no IFMG e comprovada editorialmente.
  // A validação estrutural confere o avanço de nível; a evidência da oferta
  // permanece sob responsabilidade da auditoria privada.
  const posGraduacao = curso.nivel === "Pós-graduação";
  const pos = titulo => blocos.findIndex(b => b?.tipo === "texto" && b.titulo === titulo);
  const obrigatorias = [
    ...(!posGraduacao ? ["Continue seus estudos no IFMG"] : []),
    "Experiências e conquistas dos estudantes", "Perguntas frequentes",
    "Forma de ingresso", "Mundo do Trabalho"
  ];
  for (const titulo of obrigatorias) {
    if (blocos.filter(b => b?.tipo === "texto" && b.titulo === titulo).length !== 1)
      erros.push("seção obrigatória deve aparecer uma vez: " + titulo);
  }
  // F9.5/F9.6: os tópicos de orientação ao candidato e a ordem dos Links
  // são requisitos determinísticos, já conferidos no catálogo. O FAQ de campi
  // é independente e não substitui o FAQ de candidatos.
  const faqHeading = pos("Perguntas frequentes");
  const linkPositions = blocos.flatMap((b,i) => b?.tipo === "links" ? [i] : []);
  const normFAQ = value => String(value ?? "").normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"").toLowerCase();
  if (faqHeading >= 0) {
    const candidate = blocos[faqHeading+1];
    if (candidate?.tipo !== "faq" || candidate.titulo)
      erros.push("FAQ de candidatos deve vir imediatamente depois de Perguntas frequentes");
    else {
      const perguntas = Array.isArray(candidate.itens) ? candidate.itens.map(x => normFAQ(x?.pergunta)) : [];
      for (const [assunto, expressao] of [
        ["ingresso",/ingress|inscri|candidat|processo seletivo|matricul|sisu|entrar/],
        ["cotas",/cotas?|reserva de vagas|acoes afirmativas/],
        ["assistência estudantil",/assistencia|auxilio|permanencia|apoio financeiro/]
      ]) {
        if (!perguntas.some(p => expressao.test(p)))
          erros.push("FAQ de candidatos sem pergunta explícita sobre " + assunto);
      }
    }
    if (linkPositions.length > 1)
      erros.push("deve existir no máximo um bloco Links por curso");
    if (!posGraduacao && !linkPositions.length)
      erros.push("curso técnico ou de graduação sem Links de orientação ao candidato");
    if (linkPositions.length && linkPositions[0] !== faqHeading+2)
      erros.push("Links devem vir imediatamente após o FAQ de candidatos");
    if (!posGraduacao && linkPositions.length) {
      const urls = Array.isArray(blocos[linkPositions[0]].itens)
        ? blocos[linkPositions[0]].itens.map(x => x?.url) : [];
      const servicos = [
        "https://portal.ifmg.edu.br/estudantes/como-ingressar-no-ifmg/",
        "https://portal.ifmg.edu.br/estudantes/como-ingressar-no-ifmg/reserva-de-vagas-cotas/",
        "https://portal.ifmg.edu.br/estudantes/nucleos-de-apoio/assistencia-estudantil/"
      ];
      if (servicos.some(url => !urls.includes(url)))
        erros.push("Links sem algum dos três destinos institucionais de ingresso, cotas e assistência");
    }
  }
  // Contrato transitório do JSON: H2 e H3 permanecem como registros Texto separados.
  // No modo Copiar, app.js os apresenta juntos no mesmo campo rico quando adjacentes.
  // Confirmar a colagem real na homologação antes de mudar o contrato de dados (F9.1).
  // O conteúdo do registro H2 permanece vazio, sem parágrafo artificial.
  for (const [i,b] of blocos.entries()) {
    if (b?.tipo !== "texto") continue;
    if (b.titulo === "Continue seus estudos no IFMG") {
      if (b.nivelTitulo !== 2 || String(b.conteudo || "").trim())
        erros.push("bloco " + i + ": Continue seus estudos no IFMG deve ser H2 isolado, sem conteúdo no mesmo bloco");
    }
    if (b.titulo === "Graduação" || b.titulo === "Pós-graduação") {
      if (b.nivelTitulo !== 3)
        erros.push("bloco " + i + ": Graduação/Pós-graduação devem ser H3 em bloco Texto separado");
      const antecedente = blocos.slice(0,i).findLastIndex(x => x?.tipo === "texto" &&
        x.titulo === "Continue seus estudos no IFMG");
      const fechamento = pos("Experiências e conquistas dos estudantes");
      if (antecedente < 0 || (fechamento >= 0 && i >= fechamento))
        erros.push("bloco " + i + ": subtítulo H3 deve ficar dentro da seção Continue seus estudos no IFMG");
    }
  }
  const continuidade = pos("Continue seus estudos no IFMG");
  if (!posGraduacao && pos("Experiências e conquistas dos estudantes") <= continuidade)
    erros.push("continuidade deve anteceder as experiências");
  if (posGraduacao && continuidade >= 0) {
    if (blocos.filter(b => b?.tipo === "texto" && b.titulo === "Continue seus estudos no IFMG").length !== 1)
      erros.push("continuidade da pós-graduação deve aparecer uma única vez");
    if (pos("Experiências e conquistas dos estudantes") <= continuidade)
      erros.push("continuidade deve anteceder as experiências");

    // Um título sem programa de nível acima não é conteúdo pronto para copiar.
    const tabela = blocos[continuidade + 1];
    const colunas = tabela?.colunas;
    const indice = titulo => Array.isArray(colunas) ? colunas.indexOf(titulo) : -1;
    const temTabela = tabela?.tipo === "tabela" && indice("Curso") >= 0 &&
      indice("Campus") >= 0 && indice("Nível") >= 0 &&
      Array.isArray(tabela.linhas) && tabela.linhas.length > 0;
    if (!temTabela) {
      erros.push("continuidade da pós-graduação exige tabela de cursos de nível acima com Curso, Campus e Nível");
    } else {
      const tipo = String(curso.tipo || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      const superiores = /especializ|mba/.test(tipo)
        ? ["mestrado", "doutorado"]
        : /mestrado/.test(tipo) ? ["doutorado"] : [];
      const campo = indice("Nível");
      for (const linha of tabela.linhas) {
        const nivel = String(linha?.[campo] || "").normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
        if (!superiores.some(x => nivel === x || nivel.startsWith(x + " ")))
          erros.push("continuidade da pós-graduação deve indicar somente formação de nível acima");
        if (["Curso", "Campus"].some(rotulo =>
          !String(linha?.[indice(rotulo)] || "").trim() ||
          String(linha[indice(rotulo)]).trim() === "Informação incompleta"))
          erros.push("continuidade da pós-graduação precisa identificar curso e campus confirmados");
      }
    }
  }
  if (blocos.at(-2)?.titulo !== "Forma de ingresso" || blocos.at(-1)?.titulo !== "Mundo do Trabalho")
    erros.push("os dois últimos blocos devem ser Forma de ingresso e Mundo do Trabalho");
  const refs = new Set();
  let galerias = 0;
  for (let i = 0; i < blocos.length; i++) {
    const b = blocos[i];
    if (b?.tipo !== "galeria") continue;
    galerias++;
    if (typeof b.referencia !== "string" || b.referencia.trim().length < 10)
      erros.push("galeria " + i + " sem referência descritiva");
    else if (refs.has(b.referencia))
      erros.push("referência de galeria repetida: " + b.referencia);
    else refs.add(b.referencia);
    const anterior = blocos[i - 1];
    // Galerias de infraestrutura podem seguir um título de seção sem parágrafo.
    // Jamais aceitar galerias para um relato marcado como Informação incompleta.
    const textoAntes = anterior?.tipo === "texto" &&
      (anterior.conteudo?.trim() !== "Informação incompleta") &&
      (Boolean(anterior.conteudo?.trim()) || Boolean(anterior.titulo?.trim()));
    if (!textoAntes)
      erros.push("galeria " + i + " deve seguir título ou texto de contexto válido");
  }
  if (!galerias) erros.push("curso sem nenhum bloco de galeria");
  const ix = pos("Experiências e conquistas dos estudantes");
  // Dois pilotos apresentam reconhecimento institucional (avaliação/portaria)
  // como abertura da seção; não são relatos de uma vivência estudantil a ilustrar.
  const destaqueInstitucionalSemFoto = new Set([
    "administracao-bacharelado",
    "engenharia-de-producao-bacharelado"
  ]);
  if (ix >= 0) {
    let end = ix + 1;
    while (end < blocos.length && !(blocos[end]?.tipo === "texto" && blocos[end].titulo)) end++;
    for (let i = ix; i < end; i++) {
      const b = blocos[i];
      if (b?.tipo !== "texto" || !b.conteudo?.trim() || b.conteudo.trim() === "Informação incompleta") continue;
      if (i === ix && destaqueInstitucionalSemFoto.has(curso.id) &&
          blocos[i + 1]?.tipo !== "galeria") continue;
      if (blocos[i + 1]?.tipo !== "galeria")
        erros.push("experiência em bloco " + i + " deve ter galeria imediatamente depois");
    }
  }
  const t = blocos.find(b => b?.tipo === "tabela" && Array.isArray(b.colunas) &&
    b.colunas[0] === "Campus" && b.colunas.some(col => col.startsWith("E-mail da coordenação")));
  if (!t) erros.push("faltou tabela de ofertas por campus e contato");
  else if (Array.isArray(curso.campi)) {
    const list = t.linhas?.map(row => row[0]) || [];
    if (list.length !== curso.campi.length ||
        new Set(list).size !== list.length ||
        curso.campi.some(nome => !list.includes(nome)))
      erros.push("a tabela de ofertas deve listar exatamente os campi do curso");
  }
  return erros;
}
