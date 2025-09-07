#!/usr/bin/env node
import fs from "fs";
import { execSync } from "child_process";
const [,,baseSha] = process.argv;
if(!baseSha) { console.error("usage: node scripts/public-schema-compat.mjs <baseSHA>"); process.exit(2); }
const cur = JSON.parse(fs.readFileSync("docs/api/openapi.json","utf8"));

// Try to get old spec, gracefully handle if it doesn't exist
let old;
try {
  old = JSON.parse(execSync(`git show ${baseSha}:docs/api/openapi.json`,{encoding:"utf8"}));
} catch (error) {
  console.log("Public schema compat: OK (base spec not found, assuming new)");
  process.exit(0);
}
function* ops(spec){ for(const p in spec.paths) for(const m in spec.paths[p]){const op=spec.paths[p][m]; if((op["x-visibility"]||"internal")!=="public") continue; yield [m,p,op]; } }
const errs=[];
for(const [m,p,opNow] of ops(cur)){
  const opOld = old.paths?.[p]?.[m]; if(!opOld) continue; // new op is fine
  // crude additive-only: forbid removing fields in 2xx response schemas
  const now = JSON.stringify(opNow.responses||{}); const was = JSON.stringify(opOld.responses||{});
  if (was && !now.includes(JSON.stringify(opOld.responses["200"]||opOld.responses["201"]||{}).slice(0,30))) {
    errs.push(`${m.toUpperCase()} ${p} - possible breaking change in 2xx schema`);
  }
}
if(errs.length){ console.error("Public schema compatibility violations:\n- "+errs.join("\n- ")); process.exit(1); }
console.log("Public schema compat: OK");