import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const {courses}=JSON.parse(readFileSync("data/cursos-publicados.json","utf8"));
const c=courses.find(x=>x.id==="tecnico-em-mecanica-integrado");
const b=c?.blocos||[];
test("F7.4: Técnico em Mecânica Integrado agrupa os quatro campi da matriz 2027",()=>{
 assert.ok(c);
 assert.deepEqual(c.campi,["Arcos","Betim","Congonhas","Conselheiro Lafaiete"]);
 assert.equal(c.tipo,"Integrado");
 assert.match(c.modalidade,/Arcos: 6% EaD/);
 const t=b.find(x=>x.tipo==="tabela"&&x.colunas?.[0]==="Campus");
 assert.deepEqual(t.linhas.map(r=>r[0]),c.campi);
 assert.deepEqual(t.linhas.map(r=>r[3]),["tec.mecanica.arcos@ifmg.edu.br","coord.tec.mecanica@ifmg.edu.br","coordtecmec.congonhas@ifmg.edu.br","coord.meccl@ifmg.edu.br"]);
 const local=b.find(x=>x.tipo==="faq"&&x.titulo==="Informações dos campi");
 assert.equal(local.itens.length,4);
 assert.ok(b.some(x=>x.tipo==="faq"&&!x.titulo));
});
test("F9.3: Mecânica Integrado preserva apenas galeria pertinente de práticas",()=>{
 const gs=b.filter(x=>x.tipo==="galeria");
 assert.equal(gs.length,1);
 assert.equal(new Set(gs.map(x=>x.referencia)).size,1);
 assert.ok(gs.every(x=>Array.isArray(x.itens)&&x.itens.length===0));
 for(const ix of b.map((x,i)=>x.tipo==="galeria"?i:-1).filter(i=>i>=0))assert.equal(b[ix-1].tipo,"texto");
 assert.equal(b.find(x=>x.titulo==="Experiências e conquistas dos estudantes").conteudo,"Informação incompleta");
 assert.ok(!b.some(x=>x.tipo==="texto"&&/João Lucas Vieira Campos/.test(x.conteudo||"")));
 assert.ok(!b.some(x=>x.tipo==="texto"&&/27 de fevereiro de 2026/.test(x.conteudo||"")));
 assert.deepEqual(b.slice(-2).map(x=>x.titulo),["Forma de ingresso","Mundo do Trabalho"]);
});

test("F9.5/F9.6: Mecânica Integrado mantém FAQ de ingresso, cotas e assistência com Links logo após",()=>{
 const i=b.findIndex(x=>x.titulo==="Perguntas frequentes");
 assert.ok(i>=0);
 assert.equal(b[i+1].tipo,"faq");
 assert.equal(b[i+2].tipo,"links");
 const itens=b[i+1].itens;
 assert.equal(itens.length,7);
 assert.match(itens[0].pergunta,/ingress|candidat/i);
 assert.match(itens[1].pergunta,/cotas|reserva de vagas/i);
 assert.match(itens[2].pergunta,/assistência estudantil/i);
 assert.match(itens[2].resposta,/não garante automaticamente/i);
 assert.deepEqual(b[i+2].itens.map(x=>x.rotulo),[
  "Como ingressar no IFMG","Reserva de vagas e cotas","Assistência estudantil"
 ]);
 assert.deepEqual(b[0].campos.slice(0,8).map(x=>x.rotulo),[
  "Categoria","Tipo de oferta","Carga horária","Duração",
  "Apresentação","Modalidade","Eixo tecnológico","Campi"
 ]);
 assert.ok(!b[0].campos.some(x=>/Turno|PPC|E-mail da coordenação/i.test(x.rotulo)));
 assert.equal(b[i+3].titulo,"Outras modalidades relacionadas");
});
