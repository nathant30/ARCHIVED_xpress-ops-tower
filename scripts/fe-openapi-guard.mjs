#!/usr/bin/env node
import fs from "fs";

console.log("🔒 Frontend-OpenAPI Guardrail Check...");

// Read current state
const feRoutes = new Set(
  fs.readFileSync("audit/fe_routes_guess.txt", "utf8")
    .split("\n")
    .filter(Boolean)
);

const specRoutes = new Set(
  fs.readFileSync("audit/spec_routes_full.txt", "utf8") 
    .split("\n")
    .filter(Boolean)
);

// Update spec routes from current OpenAPI
const spec = JSON.parse(fs.readFileSync("docs/api/openapi.json", "utf8"));
const currentSpecRoutes = new Set();

Object.keys(spec.paths || {}).forEach(path => {
  Object.keys(spec.paths[path] || {}).forEach(method => {
    if (["get", "post", "put", "patch", "delete", "options", "head"].includes(method)) {
      const normalizedPath = path.replace(/\{[^}]+\}/g, '{param}');
      currentSpecRoutes.add(`${method.toUpperCase()} ${normalizedPath}`);
    }
  });
});

// Find violations
const missing = [...feRoutes].filter(route => !currentSpecRoutes.has(route));

if (missing.length > 0) {
  console.error("🚨 GUARDRAIL VIOLATION: Frontend calls undocumented routes:");
  missing.forEach(route => console.error(`  ❌ ${route}`));
  console.error("\n💡 Fix options:");
  console.error("  1. Add routes to OpenAPI: npm run spec:seed");  
  console.error("  2. Remove stale frontend calls");
  console.error("  3. Implement missing backend endpoints");
  process.exit(1);
} else {
  console.log("✅ All frontend API calls are documented in OpenAPI");
  console.log(`📊 Validated ${feRoutes.size} frontend routes`);
}