#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const CODE_GLOBS = ["src/", "apps/", "packages/"];

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
const nestRE = new RegExp(`@\\s*(Get|Post|Put|Patch|Delete|Options|Head)\\s*\\(\\s*['"\`]([^'"\\)\\}]+)?['"\`]??\\s*\\)`, "ig");
const nextjsRE = new RegExp(`export\\s+async\\s+function\\s+(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\\s*\\(`, "ig");

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
  
  // Next.js App Router detection
  if (f.includes('/app/api/') && f.endsWith('/route.ts')) {
    for (const m of t.matchAll(nextjsRE)) {
      const method = m[1].toUpperCase();
      const apiPath = f
        .replace(/.*\/app(\/api\/.*)\/route\.ts$/, '$1')
        .replace(/\[([^\]]+)\]/g, '{$1}');
      codeRoutes.add(`${method} ${normPath(apiPath)}`);
    }
  }
}

// Write code routes
const codeList = [...codeRoutes].sort();
fs.writeFileSync('audit/code_routes_full.txt', codeList.join('\n') + '\n');
console.log(`Code routes: ${codeList.length}`);