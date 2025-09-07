#!/usr/bin/env node
import fs from "fs";
const spec = JSON.parse(fs.readFileSync("docs/api/openapi.json","utf8"));
const miss = fs.existsSync("audit/fe_missing_in_code.txt")
  ? fs.readFileSync("audit/fe_missing_in_code.txt","utf8").split("\n").map(s=>s.trim()).filter(Boolean)
  : [];
const routes = miss.map(l => {
  const [method, ...rest] = l.split(" ");
  return { method: method.toLowerCase(), path: rest.join(" ") };
});
const header = `// AUTO-GENERATED STUBS — DO NOT EDIT BY HAND
import type { Express, Request, Response } from "express";
export function registerStubRoutes(app: Express) {\n`;
const body = routes.map(r => {
  // convert /x/{id}/y -> /x/:id/y for Express
  const p = r.path.replace(/\{([A-Za-z0-9_]+)\}/g, ":$1");
  return `  app.${r.method}("${p}", (req: Request, res: Response) => {
    res.status(501).json({ error: "Not implemented", route: "${r.method.toUpperCase()} ${r.path}" });
  });`;
}).join("\n");
const footer = `\n}\n`;
fs.mkdirSync("src/generated", { recursive: true });
fs.writeFileSync("src/generated/stub-routes.ts", header+body+footer);
console.log("Wrote src/generated/stub-routes.ts");