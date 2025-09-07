#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const SPEC = "docs/api/openapi.json";
if (!fs.existsSync(SPEC)) {
  console.error("OpenAPI not found at docs/api/openapi.json");
  process.exit(1);
}

const spec = JSON.parse(fs.readFileSync(SPEC, "utf8"));

spec.components ||= {};
spec.components.schemas ||= {};

// helpers
const toPascal = (s) =>
  s.split(/[^A-Za-z0-9]+/).filter(Boolean).map(x=>x[0].toUpperCase()+x.slice(1)).join("");
const pathToName = (p) => {
  // /api/v1/auth/login -> AuthLogin ; /regions/{region_id}/drivers -> RegionsDrivers
  const parts = p.split("/").filter(Boolean).filter(seg => !seg.match(/^\{.*\}$/) && !seg.match(/^v\d+$/i) && seg !== "api");
  return toPascal(parts.join("-")) || "Root";
};
const ensureSchema = (name) => {
  if (!spec.components.schemas[name]) {
    spec.components.schemas[name] = {
      type: "object",
      properties: { ok: { type: "boolean" }, data: { type: "object", additionalProperties: true } },
      required: ["ok"]
    };
  }
};

const methods = ["get","post","put","patch","delete","options","head"];
for (const rawPath of Object.keys(spec.paths || {})) {
  const item = spec.paths[rawPath] || {};
  const baseName = pathToName(rawPath);

  for (const m of methods) {
    if (!item[m]) continue;
    const op = item[m];

    // Create canonical names
    const Method = m.toUpperCase();
    const reqName = `${baseName}${toPascal(Method)}Request`;
    const resName = `${baseName}${toPascal(Method)}Response`;

    // Seed schemas if missing
    ensureSchema(reqName);
    ensureSchema(resName);

    // Request body for write methods
    if (["post","put","patch"].includes(m)) {
      op.requestBody ||= { required: false, content: { "application/json": { schema: { "$ref": `#/components/schemas/${reqName}` } } } };
      // seed example
      const rb = op.requestBody.content["application/json"];
      rb.example ||= { ok: true, data: { note: "replace with real request shape" } };
    }

    // Responses
    op.responses ||= {};
    op.responses["200"] ||= { description: "OK", content: { "application/json": { schema: { "$ref": `#/components/schemas/${resName}` }, example: { ok: true, data: { note: "replace with real response shape" } } } } };
    // Standard errors (don't overwrite if already present)
    op.responses["400"] ||= { description: "Bad Request" };
    op.responses["401"] ||= { description: "Unauthorized" };
    op.responses["403"] ||= { description: "Forbidden" };
    op.responses["404"] ||= { description: "Not Found" };

    // Minimal operationId for codegen ergonomics
    op.operationId ||= `${m}_${baseName}`;
    // Tag by first path segment after /api[/vX] if present
    if (!op.tags || !op.tags.length) {
      const first = rawPath.split("/").filter(Boolean).find(seg => !/^api$/.test(seg) && !/^v\d+$/i.test(seg) && !/^\{/.test(seg));
      if (first) op.tags = [toPascal(first)];
    }
  }
}

fs.writeFileSync(SPEC, JSON.stringify(spec, null, 2));
console.log("Stubified per-endpoint schemas + examples into", SPEC);