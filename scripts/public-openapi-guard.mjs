#!/usr/bin/env node
import fs from "fs";
const spec = JSON.parse(fs.readFileSync("docs/api/openapi.json","utf8"));
const bad = [];
const paths = spec.paths || {};
for (const p of Object.keys(paths)) {
  const item = paths[p];
  for (const m of Object.keys(item)) {
    if (!["get","post","put","patch","delete","options","head"].includes(m)) continue;
    const op = item[m] || {};
    if ((op["x-visibility"] || "internal") !== "public") continue;

    // 1) security required
    const hasSec = Array.isArray(op.security) && op.security.length > 0;
    if (!hasSec) bad.push(`${m.toUpperCase()} ${p} - missing security`);

    // 2) summary, tags, operationId
    if (!op.summary)      bad.push(`${m.toUpperCase()} ${p} - missing summary`);
    if (!op.operationId)  bad.push(`${m.toUpperCase()} ${p} - missing operationId`);
    if (!Array.isArray(op.tags) || !op.tags.length)
                          bad.push(`${m.toUpperCase()} ${p} - missing tags`);

    // 3) no GenericObject for 2xx
    const res = op.responses || {};
    const twoXX = Object.keys(res).filter(k=>/^2\d\d$/.test(k));
    for (const code of twoXX) {
      const c = res[code]?.content?.["application/json"]?.schema;
      const asStr = JSON.stringify(c||{});
      if (asStr.includes('#/components/schemas/GenericObject'))
        bad.push(`${m.toUpperCase()} ${p} - 2xx uses GenericObject`);
    }
  }
}
if (bad.length) {
  console.error("Public OpenAPI guard failures:\n" + bad.map(s=>"- "+s).join("\n"));
  process.exit(1);
}
console.log("Public OpenAPI guard: OK");