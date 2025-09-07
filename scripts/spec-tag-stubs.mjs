#!/usr/bin/env node
import fs from "node:fs";
const specPath = "docs/api/openapi.json";
const missPath = "audit/fe_missing_in_code.txt";
const spec = JSON.parse(fs.readFileSync(specPath,"utf8"));
if (!fs.existsSync(missPath)) process.exit(0);
const lines = fs.readFileSync(missPath,"utf8").split("\n").map(s=>s.trim()).filter(Boolean);
for (const line of lines) {
  const [method, ...rest] = line.split(" ");
  const p = rest.join(" ");
  const m = method.toLowerCase();
  spec.paths ??= {};
  spec.paths[p] ??= {};
  spec.paths[p][m] ??= { responses: { "501": { description: "Not Implemented" } } };
  spec.paths[p][m]["x-status"] = "stub";
}
fs.writeFileSync(specPath, JSON.stringify(spec,null,2));
console.log(`Tagged ${lines.length} operations as x-status: stub`);