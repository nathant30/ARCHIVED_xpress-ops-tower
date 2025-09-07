#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const CODE_GLOBS = [
  "src/",
  "apps/",
  "packages/"
];
const OPENAPI_PATHS = [
  path.join(repoRoot, "docs/api/openapi.json"),
  path.join(repoRoot, "artifacts/openapi.json"),
];

function* walk(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name.startsWith(".")) continue;
      yield* walk(p);
    } else yield p;
  }
}
function matchesGlobs(p) {
  return CODE_GLOBS.some(prefix => p.includes(`/${prefix}`) || p.endsWith(`/${prefix}`));
}

const files = [];
for (const start of [repoRoot]) {
  for (const f of walk(start)) if (matchesGlobs(f) && (f.endsWith(".ts") || f.endsWith(".js"))) files.push(f);
}

const methodRE = "(get|post|put|patch|delete|options|head)";
const expressRE = new RegExp(`\\b(?:app|router)\\.${methodRE}\\s*\\(\\s*['"\`]([^'"\\)\\}]+)['"\`]`,"ig");
const fastifyRE = new RegExp(`\\bfastify\\.${methodRE}\\s*\\(\\s*['"\`]([^'"\\)\\}]+)['"\`]`,"ig");
const nestRE    = new RegExp(`@\\s*(Get|Post|Put|Patch|Delete|Options|Head)\\s*\\(\\s*['"\`]([^'"\\)\\}]+)?['"\`]??\\s*\\)`, "ig");

const up = s=>s.toUpperCase();
const normPath = p=>{
  if (!p) return "/";
  let out = p.replace(/:([A-Za-z0-9_]+)/g, "{$1}");
  out = "/" + out.replace(/^\/+/, "").replace(/\/{2,}/g, "/");
  if (out !== "/" && out.endsWith("/")) out = out.slice(0,-1);
  return out;
};

const codeRoutes = new Set();
for (const f of files) {
  let t; try { t = fs.readFileSync(f,"utf8"); } catch { continue; }
  for (const m of t.matchAll(expressRE)) codeRoutes.add(`${up(m[1])} ${normPath(m[2])}`);
  for (const m of t.matchAll(fastifyRE)) codeRoutes.add(`${up(m[1])} ${normPath(m[2])}`);
  for (const m of t.matchAll(nestRE))    codeRoutes.add(`${up(m[1])} ${normPath(m[2]||"/")}`);
}

function loadOpenApi() {
  for (const p of OPENAPI_PATHS) {
    if (fs.existsSync(p)) {
      try {
        const j = JSON.parse(fs.readFileSync(p,"utf8"));
        if (j.paths && typeof j.paths === "object") return {doc:j, path:p};
      } catch {}
    }
  }
  return {doc:{paths:{}}, path:null};
}
const {doc:openapi, path:openapiPath} = loadOpenApi();

const apiRoutes = new Set();
for (const raw in openapi.paths||{}) {
  const item = openapi.paths[raw]||{};
  for (const m of Object.keys(item)) {
    const M = m.toUpperCase();
    if (["GET","POST","PUT","PATCH","DELETE","OPTIONS","HEAD"].includes(M)) {
      apiRoutes.add(`${M} ${normPath(raw)}`);
    }
  }
}

const diff=(a,b)=>[...a].filter(x=>!b.has(x)).sort();
const missingInDocs = diff(codeRoutes, apiRoutes);
const missingInCode = diff(apiRoutes, codeRoutes);

fs.writeFileSync("audit/missing_in_docs.txt", missingInDocs.join("\n")+(missingInDocs.length?"\n":""));
fs.writeFileSync("audit/missing_in_code.txt", missingInCode.join("\n")+(missingInCode.length?"\n":""));

const lines=[];
lines.push("=== API Drift Report ===");
lines.push(`OpenAPI file: ${openapiPath ?? "(not found; using empty spec)"}`);
lines.push(`Code routes found: ${codeRoutes.size}`);
lines.push(`OpenAPI routes found: ${apiRoutes.size}`);
lines.push(`Missing in docs (code -> not in OpenAPI): ${missingInDocs.length}`);
lines.push(`Missing in code (OpenAPI -> not in code): ${missingInCode.length}`);
if (missingInDocs.length) { lines.push("\n-- Missing in docs (first 20) --", ...missingInDocs.slice(0,20)); }
if (missingInCode.length) { lines.push("\n-- Missing in code (first 20) --", ...missingInCode.slice(0,20)); }
console.log(lines.join("\n"));

process.exit((missingInDocs.length||missingInCode.length)?1:0);