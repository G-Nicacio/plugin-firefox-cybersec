const fs = require("node:fs");
const path = require("node:path");
const { sanitizeHar, analyzeHar, writeJson } = require("./evidence-lib.cjs");
if (require.main === module) {
  const [input, siteUrl, output] = process.argv.slice(2);
  if (!input || !siteUrl || !output) {
    console.error("Uso: node tests/analyze-har.cjs <original.har> <site-url> <saida-sanitizada.har>");
    process.exit(1);
  }
  if (path.resolve(input) === path.resolve(output)) throw new Error("Preserve o original; saída deve ser outro arquivo.");
  const har = sanitizeHar(JSON.parse(fs.readFileSync(input,"utf8").replace(/^\uFEFF/,"")), "manual import; provenance must be recorded in metadata");
  writeJson(output,har);
  writeJson(output.replace(/\.har$/i,"")+".summary.json",analyzeHar(har,siteUrl));
  console.log("HAR sanitizado e resumo escritos.");
}
