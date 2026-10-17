import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const d=JSON.parse(readFileSync('data/cursos-publicados.json','utf8'));
const c=d.courses.find(x=>x.id==='tecnico-em-informatica-integrado'),b=c?.blocos||[];
test('F7.10: oito ofertas de Informática Integrado respeitam modalidades e contato',()=>{
 assert.ok(c);assert.equal(c.tipo,'Integrado');assert.equal(c.campi.length,8);
 const tab=b.find(x=>x.tipo==='tabela'&&x.colunas?.[0]==='Campus');
 assert.deepEqual(tab.linhas.map(x=>x[0]),c.campi);
 assert.match(tab.linhas.find(x=>x[0]==='Ibirité')[1],/8,3% EaD/);
 assert.match(tab.linhas.find(x=>x[0]==='Sabará')[1],/16,67% EaD/);
 assert.equal(tab.linhas.find(x=>x[0]==='Ribeirão das Neves')[3],'Informação incompleta');
 assert.ok(!JSON.stringify(c).includes('laerte.rodrigues@ifmg.edu.br'));
 assert.ok(!JSON.stringify(c).includes('Técnico em Técnico em Informática'));
 assert.equal(b.find(x=>x.titulo==='Continue seus estudos no IFMG').conteudo,'');
 assert.deepEqual(b.slice(-2).map(x=>x.titulo),['Forma de ingresso','Mundo do Trabalho']);
});
test('F7.10: nove experiências reais com galerias próprias e FAQ não tecnicista',()=>{
 const g=b.map((x,i)=>x.tipo==='galeria'?{...x,i}:null).filter(Boolean);
 assert.equal(g.length,10);assert.equal(new Set(g.map(x=>x.referencia)).size,10);
 assert.ok(g.every(x=>x.itens.length===0&&b[x.i-1].tipo==='texto'));
 const faq=b.find(x=>x.tipo==='faq'&&!x.titulo).itens;
 assert.ok(faq.every(x=>!/^O que (é|são) /.test(x.pergunta)));
 const s=JSON.stringify(c);
 for(const term of ['Golden Girls','ConectaMed',"MinasCoder","Canguru","Troféu de Robustez","14 experimentos","779,3","960 pontos"])assert.ok(s.includes(term),term);
 assert.ok(!s.includes('Auditoria de fontes'));
});
