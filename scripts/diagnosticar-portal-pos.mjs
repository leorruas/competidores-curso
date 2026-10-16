// F4.4: diagnosticar acesso público ao portal migrado e registrar candidatos
// encontrados em sitemap. Um candidato nunca é considerado link verificado.
import { resolve4 } from "node:dns/promises";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(await readFile(path.join(root, "data/cursos-publicados.json"), "utf8"));
const host = "portal.ifmg.edu.br";
const origins = [
  "https://" + host + "/",
  "https://" + host + "/robots.txt",
  "https://" + host + "/sitemap.xml"
];
const existing = [...new Set(data.courses.flatMap(c => c.blocos.flatMap(b =>
  b.tipo === "links" ? b.itens.map(i => i.url) : b.tipo === "link-unico" ? [b.link.url] : []
)).filter(u => new URL(u).hostname === host))];
const targets = [...new Set([...origins,...existing])];
const result = {date:new Date().toISOString(),host,context:"Verificação técnica F4.4; URLs candidatas do sitemap não estão aprovadas para publicação",dns:null,urls:[],candidateUrls:[]};
try { result.dns = {ok:true,ipv4:await resolve4(host)}; }
catch(e) { result.dns = {ok:false,reason:e.code || e.message}; }
const names = ["bim","seguranca-do-trabalho","patrimonio-cultural","defesa-civil","sustentabilidade","gestao-de-negocios","gestao-publica","mestrado","meio-ambiente","pos-graduacao"];
for(const url of targets) {
  const item={url,status:null,finalUrl:null,reachable:false,reason:null};
  try {
    const r=await fetch(url,{redirect:"follow",signal:AbortSignal.timeout(8000),headers:{"User-Agent":"IFMG-Cursos-QA/1.0"}});
    item.status=r.status;item.finalUrl=r.url;item.reachable=r.ok;
    if(url.endsWith("/sitemap.xml") && r.ok) {
      const xml=await r.text();
      const locs=[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(x=>x[1].replace(/&amp;/g,"&"));
      result.candidateUrls=[...new Set(locs.filter(u=>{try{return new URL(u).hostname===host && names.some(n=>u.toLowerCase().includes(n))}catch{return false}}))].slice(0,100);
    }
  }catch(e){item.reason=e.cause?.code || e.name || e.message}
  result.urls.push(item);
}
await mkdir(path.join(root,"link-audit-results"),{recursive:true});
await writeFile(path.join(root,"link-audit-results/diagnostico.json"),JSON.stringify(result,null,2)+"\n");
console.log(JSON.stringify({dns:result.dns,checked:result.urls,siteMapCandidates:result.candidateUrls.length},null,2));
