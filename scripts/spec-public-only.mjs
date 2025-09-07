#!/usr/bin/env node
import fs from "fs";
const spec = JSON.parse(fs.readFileSync("docs/api/openapi.json","utf8"));
const out = { ...spec, paths: {} };
for (const p of Object.keys(spec.paths||{})) {
  for (const m of Object.keys(spec.paths[p]||{})) {
    const op = spec.paths[p][m];
    if ((op["x-visibility"]||"internal") === "public") {
      out.paths[p] = out.paths[p] || {};
      out.paths[p][m] = op;
    }
  }
}
fs.writeFileSync("docs/api/openapi.public.json", JSON.stringify(out,null,2));
console.log("Wrote docs/api/openapi.public.json");