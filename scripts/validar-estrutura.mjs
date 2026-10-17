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
  const pos = titulo => blocos.findIndex(b => b?.tipo === "texto" && b.titulo === titulo);
  const obrigatorias = ["Continue seus estudos no IFMG", "Experiências e conquistas dos estudantes", "Perguntas frequentes", "Forma de ingresso", "Mundo do Trabalho"];
  for (const titulo of obrigatorias) {
    if (blocos.filter(b => b?.tipo === "texto" && b.titulo === titulo).length !== 1)
      erros.push("seção obrigatória deve aparecer uma vez: " + titulo);
  }
  if (pos("Experiências e conquistas dos estudantes") <= pos("Continue seus estudos no IFMG"))
    erros.push("continuidade deve anteceder as experiências");
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
