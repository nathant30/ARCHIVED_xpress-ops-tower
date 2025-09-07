#!/usr/bin/env node
import fs from "fs";
const specPath = "docs/api/openapi.json";
const addList  = "audit/code_only_routes.txt";
if (!fs.existsSync(specPath) || !fs.existsSync(addList)) {
  console.error("Missing spec or code_only_routes.txt"); process.exit(1);
}
const spec = JSON.parse(fs.readFileSync(specPath,"utf8"));

function ensure(obj,k,init){ return obj[k] ?? (obj[k]=init); }
function toSlug(s){ return s.replace(/[\/{}:]+/g,"_").replace(/^_+|_+$/g,""); }

const internalPatterns = [
  /^GET \/api\/healthz$/,
  /^GET \/api\/metrics$/,
  /^GET \/api\/admin\//,
  /^GET \/api\/_internal\//,
  /^.*/ // fallback: treat as internal until reviewed
];

const lines = fs.readFileSync(addList,"utf8").split("\n").map(s=>s.trim()).filter(Boolean);
for (const line of lines) {
  const [methodRaw, ...rest] = line.split(" ");
  const method = (methodRaw||"GET").toLowerCase();
  const path = rest.join(" ");
  const vis = internalPatterns.some(rx => rx.test(line)) ? "internal" : "public";

  ensure(spec, "paths", {});
  spec.paths[path] = spec.paths[path] || {};
  if (!spec.paths[path][method]) {
    spec.paths[path][method] = {
      summary: "(imported from code-only)",
      "x-visibility": vis,
      "x-status": "baseline",
      operationId: `${method}_${toSlug(path)}`,
      responses: { "200": { description: "OK", content: { "application/json": { schema: { "$ref": "#/components/schemas/GenericObject" } } } } }
    };
  }
}

fs.writeFileSync(specPath, JSON.stringify(spec, null, 2));
console.log(`Added ${lines.length} code-only routes to OpenAPI with x-visibility=internal by default.`);