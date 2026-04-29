import { marked } from "marked";
import fs from "fs";
import { execSync } from "child_process";
import path from "path";

const INPUT = process.argv[2] || "API_REFERENCE.md";
const OUTPUT_PDF = INPUT.replace(/\.md$/, ".pdf");
const TMP_HTML = path.join(process.cwd(), INPUT.replace(/\.md$/, ".tmp.html"));

const md = fs.readFileSync(INPUT, "utf-8");
const body = marked.parse(md);

const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>${INPUT}</title>
<style>
  @page {
    size: A4;
    margin: 18mm 14mm;
    @bottom-right {
      content: "Page " counter(page) " / " counter(pages);
      font-size: 9pt;
      color: #666;
    }
  }
  * { box-sizing: border-box; }
  body {
    font-family: "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    font-size: 10pt;
    line-height: 1.55;
    color: #1f2937;
    max-width: 100%;
    margin: 0;
    padding: 0;
  }
  h1 {
    font-size: 22pt;
    color: #111;
    border-bottom: 3px solid #6366F1;
    padding-bottom: 0.3em;
    margin-top: 0.5em;
    margin-bottom: 0.6em;
    page-break-before: auto;
  }
  h1:first-of-type { page-break-before: avoid; }
  h2 {
    font-size: 15pt;
    color: #4338CA;
    border-bottom: 1px solid #E5E7EB;
    padding-bottom: 0.25em;
    margin-top: 1.5em;
    margin-bottom: 0.6em;
    page-break-after: avoid;
  }
  h3 {
    font-size: 12pt;
    color: #1F2937;
    margin-top: 1.2em;
    margin-bottom: 0.4em;
    page-break-after: avoid;
  }
  h4 {
    font-size: 10.5pt;
    color: #374151;
    margin-top: 1em;
    margin-bottom: 0.3em;
  }
  p { margin: 0.5em 0; }
  a { color: #4338CA; text-decoration: none; }
  ul, ol { margin: 0.4em 0 0.4em 1.4em; padding: 0; }
  li { margin: 0.15em 0; }

  code {
    background: #F3F4F6;
    padding: 1.5px 5px;
    border-radius: 3px;
    font-family: "Consolas", "Courier New", monospace;
    font-size: 0.88em;
    color: #BE185D;
  }

  pre {
    background: #1F2937;
    color: #F9FAFB;
    padding: 12px 14px;
    border-radius: 6px;
    overflow-x: auto;
    font-size: 8.5pt;
    line-height: 1.4;
    page-break-inside: avoid;
    margin: 0.6em 0;
  }
  pre code {
    background: transparent;
    color: inherit;
    padding: 0;
    font-size: inherit;
  }

  table {
    border-collapse: collapse;
    width: 100%;
    margin: 0.6em 0;
    page-break-inside: auto;
    font-size: 9pt;
  }
  thead { display: table-header-group; }
  tr { page-break-inside: avoid; }
  th, td {
    border: 1px solid #D1D5DB;
    padding: 5px 8px;
    text-align: left;
    vertical-align: top;
  }
  th {
    background: #EEF2FF;
    color: #3730A3;
    font-weight: 600;
  }
  tr:nth-child(even) td {
    background: #F9FAFB;
  }

  blockquote {
    border-left: 3px solid #6366F1;
    background: #F5F3FF;
    padding: 8px 12px;
    margin: 0.6em 0;
    color: #4B5563;
    font-style: italic;
  }
  blockquote p { margin: 0.2em 0; }

  hr {
    border: none;
    border-top: 1px solid #D1D5DB;
    margin: 1.5em 0;
  }

  .cover {
    text-align: center;
    padding-top: 25vh;
    page-break-after: always;
  }
  .cover h1 {
    font-size: 32pt;
    border: none;
    color: #4338CA;
  }
  .cover .subtitle {
    font-size: 14pt;
    color: #6B7280;
    margin-top: 1em;
  }
  .cover .meta {
    margin-top: 4em;
    font-size: 11pt;
    color: #6B7280;
  }
</style>
</head>
<body>
<div class="cover">
  <h1>API Faso Yiri</h1>
  <div class="subtitle">Référence technique complète</div>
  <div class="meta">
    Plateforme éducative — Burkina Faso<br>
    Production : apieducative.genius-universe.com<br>
    Version générée le ${new Date().toLocaleDateString("fr-FR")}
  </div>
</div>
${body}
</body>
</html>`;

fs.writeFileSync(TMP_HTML, html);
console.log("[1/2] HTML genere :", TMP_HTML);

// Trouver Chrome
const chromePaths = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
];
const chrome = chromePaths.find(p => fs.existsSync(p));
if (!chrome) {
  console.error("Chrome introuvable");
  process.exit(1);
}

console.log("[2/2] Generation PDF via Chrome headless...");
const fileUrl = "file:///" + TMP_HTML.replace(/\\/g, "/");
const absOutPath = path.resolve(OUTPUT_PDF);
const tempDir = process.env.TEMP || process.env.TMP || "C:\\Windows\\Temp";
const tempPdf = path.join(tempDir, "api_reference_" + Date.now() + ".pdf");

const cmd = `"${chrome}" --headless=new --disable-gpu --no-pdf-header-footer --print-to-pdf="${tempPdf}" --no-margins "${fileUrl}"`;

try {
  execSync(cmd, { stdio: "inherit" });
  fs.unlinkSync(TMP_HTML);
  // Deplacer le PDF du tmp vers le repertoire de sortie
  fs.copyFileSync(tempPdf, absOutPath);
  fs.unlinkSync(tempPdf);
  const stat = fs.statSync(absOutPath);
  console.log(`\nPDF cree : ${absOutPath} (${(stat.size / 1024).toFixed(1)} Ko)`);
} catch (e) {
  console.error("Erreur Chrome :", e.message);
  process.exit(1);
}
