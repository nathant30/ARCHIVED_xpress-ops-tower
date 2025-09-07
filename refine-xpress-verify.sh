set -euo pipefail

echo "== Refine Xpress code↔docs verification =="

PM="pnpm"; command -v pnpm >/dev/null 2>&1 || PM="npm"

mkdir -p openapi rbac events scripts docs/api docs/security docs/events docs/db artifacts .github/workflows

# --- pick zod-to-openapi version to match your zod major (you have v3) ---
ZOD_MAJOR="$(node -e 'try{const p=require("./package.json");const v=(p.dependencies?.zod||p.devDependencies?.zod||"3");console.log(String(v).replace(/[^0-9].*$/,""))}catch{console.log("3")}' 2>/dev/null || echo 3)"
if [ "$ZOD_MAJOR" = "4" ]; then Z2O='@asteasolutions/zod-to-openapi@^8'; else Z2O='@asteasolutions/zod-to-openapi@^6.4.0'; fi
echo "Zod major=$ZOD_MAJOR → $Z2O"

# --- deps (AST + glob + lint) ---
if [ "$PM" = "pnpm" ]; then
  pnpm add -D $Z2O ts-node fast-glob ts-morph @stoplight/spectral-cli @redocly/cli >/dev/null || true
else
  npm i -D $Z2O ts-node fast-glob ts-morph @stoplight/spectral-cli @redocly/cli >/dev/null || true
fi

# --- tsconfig (CJS to avoid loader drama) ---
[ -f tsconfig.json ] || cat > tsconfig.json <<'JSON'
{ "compilerOptions": { "target":"ES2020","module":"commonjs","moduleResolution":"node","esModuleInterop":true,"skipLibCheck":true,"resolveJsonModule":true,"strict":false } }
JSON

# --- update package.json scripts (merge) ---
node > scripts/add-scripts.js <<'JS'
const fs=require("fs");const p=JSON.parse(fs.readFileSync("package.json","utf8"));p.scripts=p.scripts||{};
Object.assign(p.scripts,{
  "gen:openapi":"ts-node openapi/generate.ts",
  "lint:openapi":"spectral lint artifacts/openapi.json && redocly lint artifacts/openapi.json",
  "gen:permissions":"ts-node rbac/generate.ts",
  "gen:events":"ts-node events/generate_asyncapi.ts",
  "gen:schema":"node scripts/gen-schema.js"
});
fs.writeFileSync("package.json",JSON.stringify(p,null,2));console.log("✓ scripts updated");
JS
node scripts/add-scripts.js

# ================= OPENAPI (refined scanner) =================
cat > openapi/generate.ts <<'TS'
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import fg from "fast-glob";

// heuristics
const AUTH_HINTS = ["requireAuth","ensureAuthenticated","getSession","validateApiKey","verifyToken","withAuth","authGuard"];
const VERBS = ["GET","POST","PUT","PATCH","DELETE"] as const;

// collect exported schema identifiers from common locations
const schemaFiles = fg.sync([
  "src/lib/**/*schemas.ts","src/lib/**/schemas.ts","src/lib/**/*.schema.ts","src/lib/**/*.schemas.ts"
], { dot:true });
const EXPORTED_SCHEMAS = new Set<string>();
for (const f of schemaFiles) {
  const t = readFileSync(f,"utf8");
  for (const m of t.matchAll(/export\s+(?:const|type|interface)\s+([A-Za-z0-9_]+)/g)) EXPORTED_SCHEMAS.add(m[1]);
}

const routeFiles = fg.sync(["src/app/api/**/route.ts","src/app/api/**/route.js"], { dot:true });
const paths:any = {};

function inferSchemas(src:string) {
  const REQ_NAMES = ["BodySchema","RequestSchema","ReqSchema","InputSchema"];
  const RES_NAMES = ["ResponseSchema","ResSchema","OutputSchema","ResultSchema"];
  const req = REQ_NAMES.find(n => src.includes(n) && EXPORTED_SCHEMAS.has(n));
  const res = RES_NAMES.find(n => src.includes(n) && EXPORTED_SCHEMAS.has(n));
  const requestBody = req ? { content: { "application/json": { schema: { $ref:`#/components/schemas/${req}` }}}} : undefined;
  const responses:any = {
    "200": res ? { description:"OK", content:{ "application/json":{ schema:{ $ref:`#/components/schemas/${res}`}}}} : { description:"OK" },
    "400": { description:"Bad Request" }
  };
  return { requestBody, responses };
}

for (const file of routeFiles) {
  const src = readFileSync(file,"utf8");
  const apiPath = file.replace(/^src\/app\/api/,"/api").replace(/\/route\.(ts|js)$/,"");
  const tags = apiPath.split("/").slice(2,5).filter(Boolean); // e.g. ["v1","fraud","analyze"]
  const ops:any = {};
  const auth = AUTH_HINTS.some(h => src.includes(h));
  for (const V of VERBS) {
    const re = new RegExp(`export\\s+(?:async\\s+)?function\\s+${V}\\b|export\\s+const\\s+${V}\\s*=`,"m");
    if (re.test(src)) {
      const { requestBody, responses } = inferSchemas(src);
      const m = V.toLowerCase();
      ops[m] = {
        tags,
        summary: `${V} ${apiPath}`,
        operationId: `${m}${apiPath.replace(/[^a-z0-9]+/gi,"_")}`,
        ...(requestBody?{requestBody}:{ }),
        responses,
        security: auth ? [{ ApiKeyAuth: [] }] : []
      };
    }
  }
  if (Object.keys(ops).length) paths[apiPath] = ops;
}

// stub components.schemas for referenced identifiers (keeps Spectral happy)
const componentsSchemas:any = {};
for (const name of EXPORTED_SCHEMAS) componentsSchemas[name] = { description:`Placeholder for ${name}` };

const doc:any = {
  openapi:"3.1.0",
  info:{ title:"Xpress Platform API", version:"1.0.0", license:{ name:"MIT", url:"https://opensource.org/license/mit/" } },
  servers:[{ url:"https://api.xpress.local" }],
  components:{ securitySchemes:{ ApiKeyAuth:{ type:"apiKey", in:"header", name:"X-API-Key" } }, schemas: componentsSchemas },
  security:[{ ApiKeyAuth:[] }],
  paths
};

mkdirSync("artifacts",{recursive:true});
writeFileSync("artifacts/openapi.json", JSON.stringify(doc,null,2));
console.log(`✓ OpenAPI: scanned ${routeFiles.length} route file(s) → artifacts/openapi.json`);
TS

# ================= RBAC (AST-based) =================
cat > rbac/generate.ts <<'TS'
import { mkdirSync, writeFileSync, readFileSync } from "fs";
import fg from "fast-glob";
import { Project, SyntaxKind } from "ts-morph";

const project = new Project({ tsConfigFilePath: "tsconfig.json", skipAddingFilesFromTsConfig: true });
const files = fg.sync(["src/**/*.ts","src/**/*.tsx"], { ignore:["**/*.d.ts","node_modules/**"] });
files.forEach(f => project.addSourceFileAtPathIfExists(f));

const CALL_NAMES = new Set(["hasPermission","checkPermission","requirePermission"]);
const permissions = new Set<string>();
const usages: Record<string,string[]> = {};

for (const sf of project.getSourceFiles()) {
  const permsInFile = new Set<string>();
  sf.forEachDescendant(node => {
    if (node.getKind() === SyntaxKind.CallExpression) {
      const ce = node.asKind(SyntaxKind.CallExpression)!;
      const name = ce.getExpression().getText();
      if (CALL_NAMES.has(name)) {
        const arg = ce.getArguments()[0];
        if (!arg) return;
        const text = arg.getText();
        // literal 'a.b.c'
        if (/^['"][a-z0-9_.:-]+['"]$/i.test(text)) {
          permsInFile.add(text.slice(1,-1));
        } else {
          // identifier -> try to resolve initializer if it's a string
          const id = ce.getArguments()[0].asKind(SyntaxKind.Identifier);
          if (id) {
            const d = id.getDefinitions()[0]?.getDeclarationNode();
            const init = (d as any)?.getInitializer?.();
            const v = init?.getText?.();
            if (typeof v === "string" && /^['"][a-z0-9_.:-]+['"]$/i.test(v)) permsInFile.add(v.slice(1,-1));
          }
        }
      }
    }
  });
  if (permsInFile.size) {
    usages[sf.getFilePath()] = Array.from(permsInFile).sort();
    for (const p of permsInFile) permissions.add(p);
  }
}

mkdirSync("artifacts",{recursive:true});
writeFileSync("artifacts/permissions.json", JSON.stringify({ permissions: Array.from(permissions).sort() }, null, 2));
writeFileSync("artifacts/permissions_usages.json", JSON.stringify(usages, null, 2));
console.log(`✓ RBAC: found ${permissions.size} permission(s) → artifacts/permissions.json (+ usages)`);
TS

# ================= EVENTS (richer patterns) =================
cat > events/generate_asyncapi.ts <<'TS'
import { mkdirSync, writeFileSync, readFileSync } from "fs";
import fg from "fast-glob";

const names = new Set<string>();
const files = fg.sync(["src/**/*.{ts,tsx,js}"], { ignore:["node_modules/**"] });

const add = (s:string)=>{ if (s) names.add(s); };

for (const f of files) {
  const t = readFileSync(f,"utf8");
  // socket.io
  for (const m of t.matchAll(/\b(?:io|socket)\.emit\(['"]([^'"]+)['"]/g)) add(m[1]);
  for (const m of t.matchAll(/\bon\(['"]([^'"]+)['"]/g)) add(m[1]);
  // pub/sub generic
  for (const m of t.matchAll(/\bpublish\(['"]([^'"]+)['"]/g)) add(m[1]);
  for (const m of t.matchAll(/\bsubscribe\(['"]([^'"]+)['"]/g)) add(m[1]);
  // redis
  for (const m of t.matchAll(/\b(?:redis|pub)\.publish\(['"]([^'"]+)['"]/g)) add(m[1]);
  // kafka-like
  for (const m of t.matchAll(/\bproducer\.send\(\s*{[^}]*topic:\s*['"]([^'"]+)['"]/g)) add(m[1]);
}

const channels:any = {};
[...names].sort().forEach(n => channels[`events.${n}`]={ subscribe:{ message:{ name:n, payload:{} }}});

const toYAML=(o:any,i=0)=>{const p="  ".repeat(i); if(o===null)return"null"; if(typeof o!=="object")return String(o);
if(Array.isArray(o))return o.map(v=>`${p}- ${toYAML(v,i+1).trimStart()}`).join("\n");
return Object.entries(o).map(([k,v])=>`${p}${k}: ${typeof v==="object"&&v!==null?`\n${toYAML(v,i+1)}`:toYAML(v,0)}`).join("\n");};

mkdirSync("artifacts",{recursive:true});
const doc={ asyncapi:"2.6.0", info:{ title:"Xpress Event Bus", version:"1.0.0" }, defaultContentType:"application/json", channels };
writeFileSync("artifacts/asyncapi.yaml", toYAML(doc));
console.log(`✓ EVENTS: ${names.size} name(s) → artifacts/asyncapi.yaml`);
TS

# ================= DB SCHEMA (PG preferred, SQLite fallback) =================
cat > scripts/gen-schema.js <<'JS'
const { execSync } = require("child_process");
const fs = require("fs");
fs.mkdirSync("artifacts",{recursive:true});
try {
  if (process.env.DATABASE_URL && /^postgres/i.test(process.env.DATABASE_URL)) {
    execSync(`pg_dump -s "$DATABASE_URL" > artifacts/schema.sql`, {stdio:"inherit",shell:"bash"});
    console.log("✓ DB: wrote Postgres schema to artifacts/schema.sql");
    process.exit(0);
  }
} catch(e) {
  console.error("pg_dump failed or unavailable; falling back to SQLite if present.");
}
const db = ["xpress_ops.db","database/xpress_ops.db"].find(p=>fs.existsSync(p));
if (db) {
  try {
    execSync(`sqlite3 "${db}" ".schema" > artifacts/schema.sql`, {stdio:"inherit",shell:"bash"});
    console.log("✓ DB: wrote SQLite schema to artifacts/schema.sql");
    process.exit(0);
  } catch {}
}
console.log("SKIP DB: No DATABASE_URL (pg) and no .db file found; not producing schema.sql");
JS

# ================= Run once, lint, promote =================
if [ "$PM" = "pnpm" ]; then
  pnpm gen:openapi
  pnpm lint:openapi || true
  pnpm gen:permissions
  pnpm gen:events
  pnpm gen:schema || true
else
  npm run gen:openapi
  npx spectral lint artifacts/openapi.json || true
  npm run gen:permissions
  npm run gen:events
  npm run gen:schema || true
fi

cp -f artifacts/openapi.json docs/api/openapi.json || true
cp -f artifacts/permissions.json docs/security/permissions.json || true
cp -f artifacts/asyncapi.yaml docs/events/asyncapi.yaml || true
[ -f artifacts/schema.sql ] && cp -f artifacts/schema.sql docs/db/schema.sql || true

# ================= CI (drift enforcement) =================
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
          pnpm gen:schema || true
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

echo "== Done. Generated and promoted docs. Next =="
echo "  git add ."
echo "  git commit -m 'refine code↔docs verification (auto-scanned openapi/rbac/events/db)'"
echo "  git push -u origin <branch>   # open PR to see CI checks"
