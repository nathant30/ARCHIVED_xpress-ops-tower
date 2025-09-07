#!/usr/bin/env node
import fs from "fs"; import path from "path";
const spec = JSON.parse(fs.readFileSync("docs/api/openapi.json","utf8"));
const budgetFile = "audit/stub_budget.max";
const ops = [];
for (const [p, item] of Object.entries(spec.paths||{})) {
  for (const [m, op] of Object.entries(item||{})) {
    if (!["get","post","put","patch","delete","options","head"].includes(m)) continue;
    if (op && op["x-status"] === "stub") ops.push(`${m.toUpperCase()} ${p}`);
  }
}
const count = ops.length;
if (!fs.existsSync("audit")) fs.mkdirSync("audit",{recursive:true});
fs.writeFileSync("audit/stub_list.txt", ops.sort().join("\n") + (ops.length?"\n":""));
fs.writeFileSync("audit/stub_count.txt", String(count));

let max = Number(process.env.STUB_BUDGET||"");
if (!max && fs.existsSync(budgetFile)) max = Number(fs.readFileSync(budgetFile,"utf8").trim());
if (!max) { fs.writeFileSync(budgetFile, String(count)); console.log(`Initialized stub budget at ${count}`); process.exit(0); }

if (Number.isNaN(max)) { console.error("Invalid stub budget"); process.exit(2); }
if (count > max) { console.error(`Stub budget exceeded: ${count} > ${max}`); process.exit(1); }

console.log(`Stub budget OK: ${count} ≤ ${max}`);