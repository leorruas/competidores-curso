#!/usr/bin/env node
/**
 * Auditoria exploratória para o backlog de revisão da experiência de edição.
 * Nunca remove conteúdo nem falha a publicação: relevância editorial exige revisão humana.
 * Uso: node scripts/auditar-backlog-editorial.mjs [--json]
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const norm = s => String(s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const has = (s, re) => re.test(norm(s));
const topics = {
  ingresso: /ingress|candidat|inscri|processo seletivo|matricul|sisu/,
  cotas: /cotas?|reserva de vagas|acoes afirmativas/,
  assistencia: /assistencia estudantil|auxilio|permanencia|apoio financeiro/
};

export function auditarCursos(courses) {
  const achados = [];
  const resumo = {
    cursos: courses.length, continuidadeComSubtituloSeparado: 0,
    tituloFaqIsolado: 0, linksAusentes: 0, linksForaDoLugar: 0,
    faqSemIngresso: 0, faqSemCotas: 0, faqSemAssistencia: 0,
    possiveisConquistasRotineiras: 0, textosContiguosParaRevisao: 0
  };
  const add = (curso, tipo, bloco, detalhes) => achados.push({
    curso: curso.id, tipo, bloco, detalhes
  });
  for (const c of courses) {
    const blocks = c.blocos || [];
    const continuation = blocks.findIndex(b => b?.tipo === "texto" &&
      b.titulo === "Continue seus estudos no IFMG");
    if (continuation >= 0 && blocks[continuation+1]?.tipo === "texto" &&
        ["Graduação","Pós-graduação"].includes(blocks[continuation+1].titulo)) {
      resumo.continuidadeComSubtituloSeparado++;
      add(c,"continuidade-fragmentada",continuation,"H2 e H3 em Textos consecutivos; testar consolidação no Wagtail");
    }
    const hFaq = blocks.findIndex(b => b?.tipo === "texto" && b.titulo === "Perguntas frequentes");
    if (hFaq >= 0 && !String(blocks[hFaq].conteudo || "").trim()) {
      resumo.tituloFaqIsolado++;
      add(c,"titulo-faq-isolado",hFaq,"Cópia de H2 sem corpo; testar colagem real, não inventar texto");
    }
    const faq = blocks.findIndex((b,i) => i > hFaq && b?.tipo === "faq" &&
      b.titulo !== "Informações dos campi");
    const links = blocks.findIndex(b => b?.tipo === "links");
    if (links < 0) {
      resumo.linksAusentes++;
      add(c,"links-a-avaliar",null,"Sem bloco Links; pós-graduação pode exigir exceção justificada");
    } else if (faq >= 0 && links !== faq+1) {
      resumo.linksForaDoLugar++;
      add(c,"links-deslocados",links,links < faq
        ? "Links precedem o FAQ de candidatos"
        : "Há outros blocos entre FAQ de candidatos e Links");
    }
    const questions = faq >= 0 ? (blocks[faq].itens || []).map(x => x.pergunta || "") : [];
    for (const [topic,pattern] of Object.entries(topics)) {
      if (!questions.some(q => has(q,pattern))) {
        const key = "faqSem" + {ingresso:"Ingresso",cotas:"Cotas",assistencia:"Assistencia"}[topic];
        resumo[key]++;
        add(c,"faq-sem-"+topic,faq,"Pergunta explícita ausente; verificar respostas e regra por modalidade");
      }
    }
    const xp = blocks.findIndex(b => b?.tipo === "texto" &&
      b.titulo === "Experiências e conquistas dos estudantes");
    if (xp >= 0) {
      const end=blocks.findIndex((b,i) => i>xp && b?.tipo === "texto" &&
        ["Perguntas frequentes","Forma de ingresso","Mundo do Trabalho"].includes(b.titulo));
      const limit=end < 0 ? blocks.length : end;
      for (let i=xp;i<limit;i++) {
        const b=blocks[i];
        if (b?.tipo !== "texto" || !b.conteudo || b.conteudo === "Informação incompleta") continue;
        if (has(b.conteudo,/\benem\b|\bredacao\b|\bformatura\b|\bcerimonia de formatura\b|\bcolacao de grau\b/)) {
          resumo.possiveisConquistasRotineiras++;
          add(c,"conquista-revisar",i,"Nota individual/Enem/formatura: verificar mérito real e fonte; não coletar imagens; revisão humana");
        }
      }
    }
    for(let i=0;i<blocks.length-1;i++){
      if(blocks[i]?.tipo === "texto" && blocks[i+1]?.tipo === "texto" &&
          blocks[i].titulo !== "Forma de ingresso" && blocks[i+1].titulo !== "Mundo do Trabalho") {
        resumo.textosContiguosParaRevisao++;
        add(c,"textos-contiguos",i,"Possível fragmentação: verificar se pertencem à mesma seção antes de fundir");
      }
    }
  }
  return {resumo, achados};
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const base = JSON.parse(readFileSync("data/cursos-publicados.json","utf8"));
  const result = auditarCursos(base.courses);
  if (process.argv.includes("--json")) console.log(JSON.stringify(result,null,2));
  else {
    console.log("Auditoria editorial (diagnóstico não bloqueante):");
    console.log(JSON.stringify(result.resumo,null,2));
    console.log("Detalhes: node scripts/auditar-backlog-editorial.mjs --json");
  }
}
