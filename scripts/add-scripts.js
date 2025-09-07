const fs = require("fs");
const pkg = JSON.parse(fs.readFileSync("package.json","utf8"));
pkg.scripts = pkg.scripts || {};
Object.assign(pkg.scripts, {
  "gen:openapi": "ts-node openapi/generate.ts",
  "lint:openapi": "spectral lint artifacts/openapi.json && redocly lint artifacts/openapi.json",
  "gen:permissions": "ts-node rbac/generate.ts",
  "gen:events": "ts-node events/generate_asyncapi.ts",
  "gen:schema": "node scripts/gen-schema.js"
});
fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2));
console.log("✓ package.json scripts updated");
