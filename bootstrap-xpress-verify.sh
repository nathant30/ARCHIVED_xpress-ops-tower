set -euo pipefail

echo "== Xpress code↔docs bootstrap =="

PM="pnpm"
command -v pnpm >/dev/null 2>&1 || { echo "pnpm not found, using npm"; PM="npm"; }

mkdir -p openapi rbac events scripts docs/api docs/security docs/events docs/db artifacts .github/workflows

# Detect zod major (v3 in your repo)
ZOD_MAJOR="$(node -e 'try{const p=require("./package.json");const v=(p.dependencies?.zod||p.devDependencies?.zod||"3.0.0");console.log(String(v).split(".")[0].replace(/[^0-9]/g,"")||"3")}catch(e){console.log("3")}' 2>/dev/null || echo 3)"
if [ "$ZOD_MAJOR" = "4" ]; then Z2O='@asteasolutions/zod-to-openapi@^8'; else Z2O='@asteasolutions/zod-to-openapi@^6.4.0'; fi
echo "Detected Zod major: $ZOD_MAJOR → $Z2O"

# Install tools
if [ "$PM" = "pnpm" ]; then
  pnpm add -D $Z2O @stoplight/spectral-cli @redocly/cli ts-node globby fast-glob
else
  npm i -D $Z2O @stoplight/spectral-cli @redocly/cli ts-node globby fast-glob
fi

# Minimal tsconfig (avoid ESM headaches)
[ -f tsconfig.json ] || cat > tsconfig.json <<'JSON'
{ "compilerOptions": {
  "target":"ES2020","module":"commonjs","moduleResolution":"node",
  "esModuleInterop":true,"skipLibCheck":true,"resolveJsonModule":true,"strict":false
}}
JSON

# Update package.json scripts
node > scripts/add-scripts.js <<'JS'
const fs=require("fs");const p=JSON.parse(fs.readFileSync("package.json","utf8"));
p.scripts=p.scripts||{};
Object.assign(p.scripts,{
  "gen:openapi":"ts-node openapi/generate.ts",
  "lint:openapi":"spectral lint artifacts/openapi.json && redocly lint artifacts/openapi.json",
  "gen:permissions":"ts-node rbac/generate.ts",
  "gen:events":"ts-node events/generate_asyncapi.ts",
  "gen:schema:pg":"node scripts/gen-pg-schema.js"
});
fs.writeFileSync("package.json",JSON.stringify(p,null,2));console.log("✓ scripts added");
JS
node scripts/add-scripts.js

# --- OpenAPI generator: scan src/app/api/**/route.ts for exported HTTP verbs ---
cat > openapi/generate.ts <<'TS'
import { writeFileSync, mkdirSync } from "fs";
import fg from "fast-glob";

type Method = "GET"|"POST"|"PUT"|"PATCH"|"DELETE";
const VERBS: Method[] = ["GET","POST","PUT","PATCH","DELETE"];

const files = fg.sync(["src/app/api/**/route.ts","src/app/api/**/route.js"], { dot: true });
const paths: Record<string, any> = {};

for (const file of files) {
  const src = require("fs").readFileSync(file, "utf8");
  const apiPath = file
    .replace(/^src\/app\/api/,"/api")
    .replace(/\/route\.(ts|js)$/,"")
    .replace(/\/page\.(ts|js)x?$/,"");

  const ops:any = {};
  for (const v of VERBS) {
    const re = new RegExp(`export\\s+(async\\s+)?function\\s+${v}\\b|export\\s+const\\s+${v}\\s*=`, "m");
    if (re.test(src)) {
      const m = v.toLowerCase();
      ops[m] = {
        tags: ["auto"],
        summary: `AUTO: ${v} ${apiPath}`,
        operationId: `${m}${apiPath.replace(/[^a-z0-9]+/gi,"_")}`,
        responses: { "200": { description: "OK" }, "400": { description: "Bad Request" } },
        security: [{ ApiKeyAuth: [] }]
      };
    }
  }
  if (Object.keys(ops).length) paths[apiPath] = ops;
}

const doc:any = {
  openapi:"3.1.0",
  info:{ title:"Xpress Platform API", version:"1.0.0", license:{ name:"MIT", url:"https://opensource.org/licenses/MIT" } },
  servers:[{ url:"https://api.xpress.local" }],
  components:{ securitySchemes:{ ApiKeyAuth:{ type:"apiKey", in:"header", name:"X-API-Key" } } },
  security:[{ ApiKeyAuth:[] }],
  paths
};

mkdirSync("artifacts",{recursive:true});
writeFileSync("artifacts/openapi.json", JSON.stringify(doc,null,2));
console.log(`✓ OpenAPI from ${files.length} route file(s) → artifacts/openapi.json`);
TS

# --- RBAC generator: scan for hard-coded permission strings ---
cat > rbac/generate.ts <<'TS'
import { mkdirSync, writeFileSync } from "fs";
import fg from "fast-glob";

const files = fg.sync(["src/**/*.ts","src/**/*.tsx","**/*.md"], { ignore:["node_modules/**","artifacts/**"] });
const PERM_RE = /\b(hasPermission|checkPermission|requirePermission)\s*\(\s*['"]([a-z0-9_.:-]+)['"]\s*\)/ig;
const LITERAL_RE = /['"]([a-z0-9_.:-]+)['"]\s*[,)]/ig;

const found = new Set<string>();
for (const f of files) {
  const t = require("fs").readFileSync(f,"utf8");
  let m:RegExpExecArray|null;
  while ((m = PERM_RE.exec(t))) found.add(m[2]);
  // also collect obvious literals that look like permissions
  const likely = t.match(/[a-z]+(?:\.[a-z0-9_:-]+){1,3}/ig) || [];
  for (const s of likely) if (s.includes(".")) found.add(s);
}

const permissions = Array.from(found).sort();
mkdirSync("artifacts",{recursive:true});
writeFileSync("artifacts/permissions.json", JSON.stringify({ permissions }, null, 2));
console.log(`✓ Extracted ${permissions.length} permissions → artifacts/permissions.json`);
TS

# --- Events generator: naive catalog from filenames & emit/subscribe patterns ---
cat > events/generate_asyncapi.ts <<'TS'
import { mkdirSync, writeFileSync } from "fs";
import fg from "fast-glob";

const eventNames = new Set<string>();
const files = fg.sync(["src/**/*.{ts,tsx,js}"], { ignore:["node_modules/**","artifacts/**"] });

for (const f of files) {
  const t = require("fs").readFileSync(f,"utf8");
  for (const m of t.matchAll(/\bemit\(['"]([A-Za-z0-9_.:-]+)['"]\)/g)) eventNames.add(m[1]);
  for (const m of t.matchAll(/\bpublish\(['"]([A-Za-z0-9_.:-]+)['"]\)/g)) eventNames.add(m[1]);
  for (const m of t.matchAll(/\bsubscribe\(['"]([A-Za-z0-9_.:-]+)['"]\)/g)) eventNames.add(m[1]);
}

const channels:any = {};
[...eventNames].sort().forEach((name)=> {
  channels[`events.${name}`] = { subscribe: { message: { name, payload: {} } } };
});

const doc = {
  asyncapi:"2.6.0",
  info:{ title:"Xpress Event Bus", version:"1.0.0" },
  defaultContentType:"application/json",
  channels
};

mkdirSync("artifacts",{recursive:true});
const toYAML=(o:any,i=0)=>{const p="  ".repeat(i); if(o===null)return"null"; if(typeof o!=="object")return String(o);
if(Array.isArray(o))return o.map(v=>`${p}- ${toYAML(v,i+1).trimStart()}`).join("\n");
return Object.entries(o).map(([k,v])=>`${p}${k}: ${typeof v==="object"&&v!==null?`\n${toYAML(v,i+1)}`:toYAML(v,0)}`).join("\n");};
writeFileSync("artifacts/asyncapi.yaml", toYAML(doc));
console.log(`✓ AsyncAPI with ${eventNames.size} event(s) → artifacts/asyncapi.yaml`);
TS

# --- Postgres schema dump helper (runs only if DATABASE_URL present) ---
cat > scripts/gen-pg-schema.js <<'JS'
const { execSync } = require("child_process");
const fs = require("fs"); const url = process.env.DATABASE_URL || "";
if (!url) { console.log("SKIP: DATABASE_URL not set; skipping pg schema dump"); process.exit(0); }
try {
  fs.mkdirSync("artifacts",{recursive:true});
  execSync(`pg_dump -s "$DATABASE_URL" > artifacts/schema.sql`, { stdio:"inherit", shell:"bash" });
  console.log("✓ Wrote artifacts/schema.sql");
} catch (e) {
  console.error("pg_dump failed. Ensure Postgres client tools are installed and DATABASE_URL is reachable.");
  process.exit(0); // don't hard fail bootstrap
}
JS

# Generate everything once
if [ "$PM" = "pnpm" ]; then
  pnpm gen:openapi
  pnpm lint:openapi || true
  pnpm gen:permissions
  pnpm gen:events
  pnpm gen:schema:pg || true
else
  npm run gen:openapi
  npx spectral lint artifacts/openapi.json || true
  npm run gen:permissions
  npm run gen:events
  npm run gen:schema:pg || true
fi

# Promote golden copies
cp -f artifacts/openapi.json docs/api/openapi.json || true
cp -f artifacts/permissions.json docs/security/permissions.json || true
cp -f artifacts/asyncapi.yaml docs/events/asyncapi.yaml || true
[ -f artifacts/schema.sql ] && cp -f artifacts/schema.sql docs/db/schema.sql || true

# CI workflow
cat > .github/workflows/verify-code-docs.yml <<'YML'
name: Verify Code ↔ Docs
on:
  pull_request:
  push: { branches: [ main ] }
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: corepack enable
      - run: pnpm i --frozen-lockfile
      - name: Generate artifacts
        run: |
          pnpm gen:openapi
          pnpm gen:permissions
          pnpm gen:events
          pnpm gen:schema:pg || true
      - name: Lint OpenAPI
        run: |
          pnpm spectral lint artifacts/openapi.json
          pnpm redocly lint artifacts/openapi.json
      - name: Verify drift vs docs
        run: |
          diff -u artifacts/openapi.json docs/api/openapi.json
          diff -u artifacts/permissions.json docs/security/permissions.json
          diff -u artifacts/asyncapi.yaml docs/events/asyncapi.yaml
          if [ -f artifacts/schema.sql ] && [ -f docs/db/schema.sql ]; then diff -u artifacts/schema.sql docs/db/schema.sql; else echo "SKIP DB schema diff"; fi
YML

echo "== Done =="
echo "Docs now:"
ls -lh docs/api/openapi.json docs/security/permissions.json docs/events/asyncapi.yaml docs/db/schema.sql 2>/dev/null || true
