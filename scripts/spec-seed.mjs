#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const missingPath = path.join(process.cwd(), "audit/missing_in_docs.txt");
if (!fs.existsSync(missingPath)) {
  console.error("Run: npm run drift:check  (this creates audit/missing_in_docs.txt)");
  process.exit(1);
}
const routes = fs.readFileSync(missingPath,"utf8").split("\n").map(s=>s.trim()).filter(Boolean);
const out = { openapi:"3.0.3", info:{title:"Xpress Ops API (seed)", version:"0.1.0"}, paths:{} };
for (const r of routes) {
  const [method, ...rest] = r.split(" ");
  const p = rest.join(" ");
  out.paths[p] ||= {};
  out.paths[p][method.toLowerCase()] = { summary:"(seed) fill me", responses:{ "200":{ description:"OK" } } };
}
const target = "docs/api/openapi.seed.json";
fs.writeFileSync(target, JSON.stringify(out,null,2));
console.log(`Wrote ${target}`);