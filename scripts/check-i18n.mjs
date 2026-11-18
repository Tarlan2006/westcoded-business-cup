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
for (const file of fs.readdirSync("src", {recursive:true}).filter(f => f.endsWith(".tsx"))) {
  const path = "src/" + file;
  const source = ts.createSourceFile(path, fs.readFileSync(path, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  function rendered(expr) {
    if (!expr) return "";
    if (ts.isStringLiteralLike(expr)) return expr.text;
    if (ts.isConditionalExpression(expr)) return rendered(expr.whenTrue) + " " + rendered(expr.whenFalse);
    if (ts.isTemplateExpression(expr)) return expr.head.text + expr.templateSpans.map(span => rendered(span.expression) + span.literal.text).join("");
    if (ts.isBinaryExpression(expr) && expr.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) return rendered(expr.right);
    return "";
  }
  function check(node) {
    const text = ts.isJsxText(node) ? node.text : ts.isJsxExpression(node) && !ts.isJsxAttribute(node.parent) ? rendered(node.expression) : ts.isJsxAttribute(node) && /^(aria-label|alt|title|placeholder|label|detail|description)$/.test(node.name.getText(source)) && node.initializer ? ts.isStringLiteral(node.initializer) ? node.initializer.text : ts.isJsxExpression(node.initializer) ? rendered(node.initializer.expression) : "" : "";
    if (/[A-Za-z]/.test(text.replace(/&nbsp;|\b(?:XP|KZ|EN)\b/g, "")) && !allowed.has(text.trim())) problems.push(path + ":" + (source.getLineAndCharacterOfPosition(node.getStart()).line + 1) + " " + text.trim());
    ts.forEachChild(node, check);
  }
  check(source);
}
if (problems.length) { console.error(problems.join("\n")); process.exitCode = 1; }
else console.log(Object.keys(en).length + " matching keys; JSX check passed.");
