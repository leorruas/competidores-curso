import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validarEstruturaCurso} from "../scripts/validar-estrutura.mjs";
const data=JSON.parse(readFileSync("data/cursos-publicados.json","utf8"));
const prefix="tecnico-em-planejamento-e-controle-da-producao";
const regular=data.courses.find(x=>x.id===prefix+"-integrado");
const eja=data.courses.find(x=>x.id===prefix+"-eja");
const field=(c,key)=>c.blocos[0].campos.find(x=>x.rotulo===key)?.valor;
const txt=(c,key)=>c.blocos.find(x=>x.tipo==="texto"&&x.titulo===key);
const term=c=>JSON.stringify(c);
test("F7.P3: dois registros independentes, com nome comum e modalidade explícita",()=>{
 assert.ok(regular&&eja);
 assert.equal(regular.nome,eja.nome);
 assert.equal(regular.tipo,"Integrado");
 assert.equal(eja.tipo,"Integrado EJA");
 assert.notEqual(regular.id,eja.id);
 for(const c of [regular,eja]) {
  assert.deepEqual(c.campi,["João Monlevade"]);
  assert.equal(c.modalidade,"Presencial");
  assert.equal(c.blocos.length,23);
  assert.deepEqual(validarEstruturaCurso(c),[]);
  assert.equal(c.blocos.filter(b=>b.tipo==="galeria").length,1);
  assert.equal(c.blocos.find(b=>b.tipo==="galeria").itens.length,0);
  assert.ok(c.blocos.find(b=>b.tipo==="introducao").conteudo.length<=280);
  assert.deepEqual(c.blocos.slice(-2).map(b=>b.titulo),["Forma de ingresso","Mundo do Trabalho"]);
  assert.equal(txt(c,"Experiências e conquistas dos estudantes").conteudo,"");
 }
 assert.equal(field(regular,"Turno"),"Manhã e tarde");
 assert.equal(field(eja,"Turno"),"Noite");
 assert.equal(field(eja,"Tipo de oferta"),"Técnico integrado EJA");
 assert.equal(field(regular,"Tipo de oferta"),"Técnico integrado");
 assert.doesNotMatch(field(regular,"Tipo de oferta"),/EJA/);
});
test("F7.P3: eixo é Produção Industrial, demais campos sem invenção",()=>{
 for(const c of [regular,eja]){
  assert.equal(field(c,"Eixo tecnológico"),"Produção Industrial",c.id+":Eixo tecnológico");
  for(const key of ["Duração","Carga horária","Estágio supervisionado","Trabalho de Conclusão de Curso","E-mail da coordenação"])
   assert.equal(field(c,key),"Informação incompleta",c.id+":"+key);
  const table=c.blocos.find(b=>b.tipo==="tabela"&&b.colunas[0]==="Campus");
  assert.deepEqual(table.colunas,["Campus","Modalidade","Turno","Duração mínima","Carga horária total","E-mail da coordenação"]);
  assert.equal(table.linhas.length,1);
  assert.equal(table.linhas[0][2],field(c,"Turno"));
  assert.equal(table.linhas[0][4],"Informação incompleta");
  assert.equal(table.linhas[0][5],"Informação incompleta");
  assert.equal(c.blocos[c.blocos.indexOf(table)+1].titulo,"Campus João Monlevade");
  assert.ok(!c.blocos.some(b=>b.tipo==="faq"&&b.titulo==="Informações dos campi"));
  for(const x of ["40 vagas","1.020/2026","1.021/2026","2027","192h","assuntosinstitucionais.joaomonlevade@ifmg.edu.br","https://www.ifmg.edu.br/","Benchmark/"])
   assert.ok(!term(c).includes(x),c.id+":"+x);
 }
});
test("F7.P3: faixa etária e requisitos são exclusivos da EJA",()=>{
 assert.match(txt(eja,"Para quem é o curso").conteudo,/18 anos ou mais/);
 assert.match(txt(eja,"Forma de ingresso").conteudo,/ainda não ter concluído o ensino médio/);
 assert.match(txt(regular,"Forma de ingresso").conteudo,/ensino fundamental/);
 assert.doesNotMatch(txt(regular,"Forma de ingresso").conteudo,/18 anos/);
 assert.match(txt(regular,"Campus João Monlevade").conteudo,/manhã e à tarde/);
 assert.match(txt(eja,"Campus João Monlevade").conteudo,/noturnas/);
 const fre=regular.blocos.find(b=>b.tipo==="faq"&&!b.titulo).itens;
 const feja=eja.blocos.find(b=>b.tipo==="faq"&&!b.titulo).itens;
 assert.equal(fre.length,4);assert.equal(feja.length,4);
 assert.ok(fre.some(x=>/EJA/.test(x.pergunta)));
 assert.ok(feja.some(x=>/EJA/.test(x.pergunta)));
 assert.ok(feja.some(x=>/18 anos ou mais/.test(x.resposta)));
});
test("F7.P3: continuidade de estudos em cursos existentes e ordenação do catálogo",()=>{
 for(const c of [regular,eja]){
  const i=c.blocos.findIndex(b=>b.titulo==="Continue seus estudos no IFMG");
  assert.equal(c.blocos[i].conteudo,"");
  assert.equal(c.blocos[i+1].titulo,"Graduação");
  assert.equal(c.blocos[i+2].tipo,"tabela");
  assert.ok(c.blocos[i+2].linhas.some(r=>/Engenharia de Produção/.test(r[0])));
  assert.equal(c.blocos[i+3].titulo,"Pós-graduação");
  assert.ok(c.blocos[i+4].linhas.some(r=>/Gestão de Projetos e Operações/.test(r[0])));
  assert.ok(!term(c).includes("Processos Gerenciais"));
 }
 const ordered=[...data.courses].sort((a,b)=>a.nome.localeCompare(b.nome,"pt-BR",{sensitivity:"base",numeric:true})||String(a.tipo||"").localeCompare(String(b.tipo||""),"pt-BR")||a.id.localeCompare(b.id,"pt-BR"));
 assert.deepEqual(data.courses.map(x=>x.id),ordered.map(x=>x.id));
});
