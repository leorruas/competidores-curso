import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validarEstruturaCurso} from "../scripts/validar-estrutura.mjs";

const data=JSON.parse(readFileSync("data/cursos-publicados.json","utf8"));
const c=data.courses.find(x=>x.id==="engenharia-de-producao-bacharelado");
const b=c?.blocos??[];

test("F9.4: Engenharia de Produção destaca produção discente, não ato regulatório institucional",()=>{
 assert.ok(c);
 assert.deepEqual(c.campi,["Bambuí","Congonhas","Governador Valadares"]);
 const idx=b.findIndex(x=>x.titulo==="Experiências e conquistas dos estudantes");
 assert.ok(idx>0);
 assert.match(b[idx].conteudo,/estudantes de Engenharia de Produção de \*\*Bambuí\*\* lideraram/);
 assert.match(b[idx].conteudo,/revitalização do espaço do Diretório Acadêmico/);
 assert.equal(b[idx+1].tipo,"galeria");
 assert.match(b[idx+1].referencia,/Diretório Acadêmico/);
 assert.match(b[idx+2].conteudo,/artigo publicado em 2025/);
 assert.equal(b[idx+3].tipo,"galeria");
 assert.match(b[idx+3].referencia,/impressão 3D/);
 assert.equal(b[idx+4].titulo,"Forma de ingresso");
 assert.equal(b.filter(x=>x.titulo==="Experiências e conquistas dos estudantes").length,1);
 assert.doesNotMatch(JSON.stringify(b.slice(idx,idx+4)),/Portaria SERES|reconhecimento renovado/);
 assert.deepEqual(validarEstruturaCurso(c),[]);
});
