#!/usr/bin/env node
import fs from "fs";

const SPEC = "docs/api/openapi.json";
const LIST = process.argv[2] || "audit/public_candidates.txt";
if (!fs.existsSync(SPEC)) throw new Error("Missing docs/api/openapi.json");
if (!fs.existsSync(LIST)) throw new Error(`Missing ${LIST}`);

const spec = JSON.parse(fs.readFileSync(SPEC, "utf8"));
spec.components ||= {}; spec.components.schemas ||= {};

const toPascal = s => s.split(/[^A-Za-z0-9]+/).filter(Boolean).map(x => x[0].toUpperCase()+x.slice(1)).join("");
const pathToName = p => {
  const parts = p.split("/").filter(Boolean).filter(seg => !seg.match(/^\{.*\}$/i) && seg !== "api" && !/^v\d+$/i.test(seg));
  return toPascal(parts.join("-")) || "Root";
};

function ensureSchema(name, type="response") {
  if (!spec.components.schemas[name]) {
    spec.components.schemas[name] = {
      type: "object",
      properties: type==="response"
        ? { ok: { type:"boolean" }, data: { type:"object", additionalProperties: true } }
        : { },
      additionalProperties: true
    };
  }
}

const lines = fs.readFileSync(LIST,"utf8").split("\n").map(s=>s.trim()).filter(Boolean);
let promoted = 0;

for (const line of lines) {
  const [methodRaw, ...rest] = line.split(" ");
  const m = (methodRaw || "GET").toLowerCase();
  const p = rest.join(" ");
  if (!spec.paths?.[p]?.[m]) continue; // skip unknown

  const op = spec.paths[p][m];

  // visibility + security
  op["x-visibility"] = "public";
  op.security = [{ bearerAuth: [] }];

  // tags + summary + operationId
  const firstSeg = p.split("/").filter(Boolean).find(seg => !/^api$/.test(seg) && !/^v\d+$/i.test(seg) && !/^\{/.test(seg)) || "Public";
  op.tags = op.tags && op.tags.length ? op.tags : [toPascal(firstSeg)];
  op.summary = op.summary || "(public) fill me";
  op.operationId = op.operationId || `${m}_${p.replace(/[\/{}:]/g,"_")}`;

  // named schemas (no GenericObject)
  const base = pathToName(p);
  const Req = `${base}${toPascal(m)}Request`;
  const Res = `${base}${toPascal(m)}Response`;

  // request body for write methods
  if (["post","put","patch"].includes(m)) {
    ensureSchema(Req, "request");
    op.requestBody ||= { required: false, content: { "application/json": { schema: { "$ref": `#/components/schemas/${Req}` } } } };
  }

  // 2xx response
  op.responses ||= {};
  const ok = (m==="post") ? "201" : "200";
  ensureSchema(Res, "response");
  op.responses[ok] = {
    description: "OK",
    content: { "application/json": { schema: { "$ref": `#/components/schemas/${Res}` } } }
  };

  // standard errors
  op.responses["400"] ||= { description: "Bad Request" };
  op.responses["401"] ||= { description: "Unauthorized" };
  op.responses["403"] ||= { description: "Forbidden" };
  op.responses["404"] ||= { description: "Not Found" };

  promoted++;
}

fs.writeFileSync(SPEC, JSON.stringify(spec, null, 2));
console.log(`Promoted ${promoted} operations to public with named schemas.`);