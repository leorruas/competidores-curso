import { createServer } from "node:http";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "visual-qa-results");
await mkdir(output, { recursive: true });
const data = JSON.parse(await readFile(path.join(root, "data/cursos-publicados.json"), "utf8"));
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml" };
const server = createServer(async (req, res) => {
  try {
    const relative = decodeURIComponent(new URL(req.url, "http://localhost").pathname).replace(/^\/+/, "") || "index.html";
    const file = path.resolve(root, relative);
    if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    const body = await readFile(file);
    res.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream" });
    res.end(body);
  } catch { res.writeHead(404).end("Not found"); }
});
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const port = server.address().port, origin = "http://127.0.0.1:" + port;
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const report = [], errors = [];
const widths = [375, 768, 1440];
try {
  for (const width of widths) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1, permissions: ["clipboard-read", "clipboard-write"] });
    const page = await context.newPage();
    page.on("pageerror", err => errors.push(width + ": " + err.message));
    await page.goto(origin + "/#catalogo");
    await page.locator(".course-card").first().waitFor();
    assert.equal(await page.locator(".catalog-grid .course-card").count(), data.courses.length, width + ": catálogo");
    const catalogMetrics = await metrics(page);
    assert.ok(catalogMetrics.horizontalOverflow <= 2, JSON.stringify({ width, view: "catalogo", ...catalogMetrics }));
    await page.screenshot({ path: path.join(output, "catalogo-" + width + ".png") });
    if (width === 375) {
      await page.locator("#filter-search").fill("Direito");
      assert.equal(await page.locator(".catalog-grid .course-card").count(), 1, "busca");
      await page.locator("#catalog-filters button[type=reset]").click();
      await page.waitForFunction(expected => document.querySelectorAll(".catalog-grid .course-card").length === expected, data.courses.length);
      assert.equal(await page.locator(".catalog-grid .course-card").count(), data.courses.length, "limpar filtros");
    }
    for (const course of data.courses) {
      await page.goto(origin + "/#curso/" + encodeURIComponent(course.id));
      await page.locator("#course-view:not([hidden]) .course-head h1").waitFor();
      assert.equal((await page.locator(".course-head h1").innerText()).trim(), course.nome, course.id);
      const editor = await metrics(page);
      assert.equal(await page.locator("#course-body .block-card").count(), course.blocos.length, course.id + " — blocos Wagtail");
      assert.ok(editor.horizontalOverflow <= 2, JSON.stringify({ width, course: course.id, mode: "copiar", ...editor }));
      assert.ok(await page.locator(".course-side nav a").count() >= 12, course.id + ": índice");
      const sideLabels = await page.locator(".course-side nav").innerText();
      assert.ok(sideLabels.includes("Forma de ingresso"), course.id + ": títulos no índice lateral");
      const copies = await page.locator("#course-body [data-copy-field]").count();
      assert.ok(copies > 0, course.id + ": campos copiáveis");
      if (width === 375) {
        await page.screenshot({ path: path.join(output, "editor-" + course.id + "-mobile.png") });
      }
      if (width === 1440 && course.id === "tecnico-em-administracao-integrado") {
        await page.screenshot({ path: path.join(output, "editor-administracao-desktop.png") });
        await page.locator("#course-body [data-copy-field]").first().click();
        const clip = await page.evaluate(() => navigator.clipboard.readText());
        assert.ok(clip.trim().length > 0, "copiar campo para clipboard");
      }
      await page.locator('[data-tab="preview"]').click();
      assert.equal(await page.locator('#tab-preview[aria-selected="true"]').count(), 1, course.id + ": aba prévia");
      const preview = await metrics(page);
      assert.ok(preview.horizontalOverflow <= 2, JSON.stringify({ width, course: course.id, mode: "visualizar", ...preview }));
      assert.ok(await page.locator("#course-body .content-section").count() >= 8, course.id + ": prévia");
      const faq = page.locator("#course-body details.faq-item");
      assert.ok(await faq.count() >= 4, course.id + ": FAQ da prévia");
      await faq.first().locator("summary").click();
      assert.ok(await faq.first().evaluate(x => x.open), course.id + ": expandir FAQ");
      if (width === 1440 && course.id === "engenharia-de-producao-bacharelado")
        await page.screenshot({ path: path.join(output, "previa-producao-desktop.png") });
      if (width === 375 && course.id === "direito-bacharelado-arcos")
        await page.screenshot({ path: path.join(output, "previa-direito-mobile.png") });
      report.push({ width, id: course.id, blocks: course.blocos.length, copies, editorOverflow: editor.horizontalOverflow, previewOverflow: preview.horizontalOverflow, faqItems: await faq.count() });
    }
    await context.close();
  }
  assert.deepEqual(errors, [], "exceções de navegador");
  await writeFile(path.join(output, "report.json"), JSON.stringify({ count: report.length, testedAt: new Date().toISOString(), results: report }, null, 2));
  console.log("F1.6 Browser QA: " + report.length + " combinações curso/tela, " + widths.length + " resoluções; 0 overflow, 0 erros de script.");
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
async function metrics(page) {
  return page.evaluate(() => ({
    horizontalOverflow: document.documentElement.scrollWidth - window.innerWidth,
    viewport: window.innerWidth,
    bodyWidth: document.body.scrollWidth
  }));
}
