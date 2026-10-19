import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validarEstruturaCurso} from "../scripts/validar-estrutura.mjs";

const data=JSON.parse(readFileSync("data/cursos-publicados.json","utf8"));
const c=data.courses.find(x=>x.id==="tecnico-em-marketing-digital-integrado");
const b=c?.blocos||[];
const field=rotulo=>b[0].campos.find(x=>x.rotulo===rotulo)?.valor;
const section=titulo=>b.find(x=>x.tipo==="texto"&&x.titulo===titulo);

test("F7.P2: página própria do Técnico em Marketing Digital Integrado Bom Despacho",()=>{
 assert.ok(c);
 assert.equal(c.nome,"Técnico em Marketing Digital");
 assert.equal(c.nivel,"Técnico");
 assert.equal(c.tipo,"Integrado");
 assert.deepEqual(c.campi,["Bom Despacho"]);
 assert.equal(c.modalidade,"Presencial");
 assert.equal(b.length,23);
 assert.deepEqual(validarEstruturaCurso(c),[]);
 assert.equal(field("Campus"),"Bom Despacho");
 assert.equal(field("Turno"),"Manhã e tarde");
 assert.equal(field("Duração"),"3 anos (6 semestres)");
 assert.equal(field("Eixo tecnológico"),"Gestão e Negócios");
 assert.ok(b.find(x=>x.tipo==="introducao").conteudo.length<=280);
 assert.deepEqual(b.slice(-2).map(x=>x.titulo),["Forma de ingresso","Mundo do Trabalho"]);
});

test("F7.P2: carga proposta, PPC, estágio e contatos sem homologação ficam incompletos",()=>{
 for(const rotulo of ["Carga horária total","Estágio supervisionado","Trabalho de Conclusão de Curso","E-mail da coordenação"])
  assert.equal(field(rotulo),"Informação incompleta",rotulo);
 const tabela=b.find(x=>x.tipo==="tabela"&&x.colunas[0]==="Campus");
 assert.deepEqual(tabela.colunas,["Campus","Modalidade","Turno","Duração","Carga horária total","E-mail da coordenação"]);
 assert.deepEqual(tabela.linhas,[["Bom Despacho","Presencial","Manhã e tarde","3 anos (6 semestres)","Informação incompleta","Informação incompleta"]]);
 assert.equal(b[b.indexOf(tabela)+1].titulo,"Campus Bom Despacho");
 assert.ok(!b.some(x=>x.tipo==="faq"&&x.titulo==="Informações dos campi"));
 assert.match(section("Para quem é o curso").conteudo,/ensino fundamental/);
 const raw=JSON.stringify(c);
 for(const term of ["3.000 horas","3000 horas","PCC","2026","2027","80 vagas","40 máquinas","Processos Gerenciais","copese.bomdespacho@ifmg.edu.br","assuntosinstitucionais.bomdespacho@ifmg.edu.br","Consulta pública","Plano de Criação","Benchmark/","https://www.ifmg.edu.br/"])
  assert.ok(!raw.includes(term),term);
});

test("F7.P2: sem inventar vivências de turmas que ainda não ingressaram",()=>{
 assert.equal(section("Experiências e conquistas dos estudantes").conteudo,"");
 const galerias=b.filter(x=>x.tipo==="galeria");
 assert.equal(galerias.length,1);
 assert.deepEqual(galerias[0].itens,[]);
 assert.equal(b[b.indexOf(galerias[0])-1].titulo,"Aprendizagem prática");
 assert.ok(galerias[0].referencia.includes("Bom Despacho"));
 assert.equal(section("Continue seus estudos no IFMG").conteudo,"");
 const grad=b.findIndex(x=>x.titulo==="Graduação");
 assert.ok(b[grad+1].linhas.some(x=>x[0]==="Administração (Bacharelado)"));
 assert.ok(b[grad+1].linhas.some(x=>x[0]==="Sistemas de Informação (Bacharelado)"));
 assert.equal(b[grad+2].titulo,"Pós-graduação");
 assert.ok(b[grad+3].linhas.some(x=>x[0]==="Especialização em Gestão de Negócios"));
 assert.ok(b[grad+3].linhas.some(x=>x[0]==="Mestrado Profissional em Administração"));
});
test("F7.P2: FAQ útil e conteúdo atemporal, catálogo em ordem alfabética",()=>{
 const faq=b.find(x=>x.tipo==="faq"&&!x.titulo);
 assert.equal(faq.itens.length,4);
 assert.ok(faq.itens.some(x=>x.pergunta.includes("redes sociais")));
 assert.ok(faq.itens.some(x=>x.pergunta.includes("Técnico em Administração Integrado")));
 assert.ok(faq.itens.every(x=>x.resposta.length>70));
 assert.ok(section("Forma de ingresso").conteudo.includes("edital vigente"));
 assert.match(section("Mundo do Trabalho").conteudo,/organização de campanhas/);
 const sorted=[...data.courses].sort((a,z)=>a.nome.localeCompare(z.nome,"pt-BR",{sensitivity:"base",numeric:true})||String(a.tipo||"").localeCompare(String(z.tipo||""),"pt-BR")||a.id.localeCompare(z.id,"pt-BR"));
 assert.deepEqual(data.courses.map(x=>x.id),sorted.map(x=>x.id));
});
