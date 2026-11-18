import fs from "node:fs";
import ts from "typescript";
import en from "../src/i18n/en.ts";
import kk from "../src/i18n/kk.ts";

const problems = [];
const allowed = new Set(["KZ", "EN", "XP", "YouTube", "{brand}"]);
for (const key of new Set([...Object.keys(en), ...Object.keys(kk)])) {
  if (!en[key]?.trim() || !kk[key]?.trim()) problems.push(key + ": missing or blank");
  else if (en[key] === kk[key] && /[A-Za-z]/.test(en[key]) && !allowed.has(en[key])) problems.push(key + ": identical");
  const tokens = s => [...(s ?? "").matchAll(/\{\w+\}/g)].map(m => m[0]).sort().join();
  if (tokens(en[key]) !== tokens(kk[key])) problems.push(key + ": placeholders differ");
}
for (const file of fs.readdirSync("src", {recursive:true}).filter(f => f.endsWith(".tsx") && !f.endsWith("preview.tsx"))) {
  const path = "src/" + file;
  const source = ts.createSourceFile(path, fs.readFileSync(path, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  function check(node) {
    const text = ts.isJsxText(node) ? node.text : ts.isJsxAttribute(node) && /^(aria-label|alt|title|placeholder|label|detail|description)$/.test(node.name.getText(source)) && node.initializer && ts.isStringLiteral(node.initializer) ? node.initializer.text : "";
    if (/[A-Za-z]/.test(text.replace(/&nbsp;|\bXP\b/g, "")) && !allowed.has(text.trim())) problems.push(path + ":" + (source.getLineAndCharacterOfPosition(node.getStart()).line + 1) + " " + text.trim());
    ts.forEachChild(node, check);
  }
  check(source);
}
if (problems.length) { console.error(problems.join("\n")); process.exitCode = 1; }
else console.log(Object.keys(en).length + " matching keys; JSX check passed.");
