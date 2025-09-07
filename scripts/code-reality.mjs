#!/usr/bin/env node
import fs from "fs"; import path from "path";

const ROOT = process.cwd();
const SRC_DIRS = ["src","apps","packages"].map(d=>path.join(ROOT,d));
const isCode = f => /\.(ts|tsx|js|jsx)$/.test(f) && !/\.d\.ts$/.test(f);
const walk = (d, out=[]) => { if(!fs.existsSync(d)) return out; for (const e of fs.readdirSync(d,{withFileTypes:true})) {
  const p=path.join(d,e.name); if(e.isDirectory()){ if(e.name==="node_modules"||e.name.startsWith(".")) continue; walk(p,out); }
  else if(isCode(p)) out.push(p);
} return out; };

const files = SRC_DIRS.flatMap(d=>walk(d));

const expressRE = /\b(?:app|router)\.(get|post|put|patch|delete|options|head)\s*\(\s*(['"`])([^'"`]+)\2\s*,\s*([\s\S]*?)\)/ig;
const fastifyRE = /\bfastify\.(get|post|put|patch|delete|options|head)\s*\(\s*(['"`])([^'"`]+)\2\s*,\s*([\s\S]*?)\)/ig;
const nestMethRE = /@(?:Get|Post|Put|Patch|Delete|Options|Head)\s*\(\s*(['"`])?([^'"`]*)\1?\s*\)/ig;
const controllerBaseRE = /@Controller\(\s*(['"`])([^'"`]+)\1\s*\)/ig;

const normPath = p => {
  if (!p || p === "") p = "/";
  let out = "/" + p.replace(/^\/+/, "");
  out = out.replace(/:([A-Za-z0-9_]+)/g, "{$1}");
  out = out.replace(/\/{2,}/g,"/");
  if (out !== "/" && out.endsWith("/")) out = out.slice(0,-1);
  return out;
};

const routes = []; // {method,path,file,hasAuth,hasRBAC,hasValidation,usesDB,externalCalls,hasTests,score}

const textCache = new Map();
for (const f of files) {
  let t = fs.readFileSync(f,"utf8"); textCache.set(f,t);

  // Express / Router
  for (const m of t.matchAll(expressRE)) {
    const method = m[1].toUpperCase();
    const pathLit = normPath(m[3]);
    const arglist = (m[4]||"").slice(0,4000); // heuristic
    routes.push(scanRoute({method, path:pathLit, file:f, code:t, arglist}));
  }
  // Fastify
  for (const m of t.matchAll(fastifyRE)) {
    const method = m[1].toUpperCase();
    const pathLit = normPath(m[3]);
    const arglist = (m[4]||"").slice(0,4000);
    routes.push(scanRoute({method, path:pathLit, file:f, code:t, arglist}));
  }
  // NestJS (approx): combine @Controller base + method decorators
  const bases=[]; for (const cm of t.matchAll(controllerBaseRE)) bases.push(cm[2]||"");
  const meths=[]; for (const mm of t.matchAll(nestMethRE)) meths.push(mm[2]||"/");
  if (bases.length || meths.length) {
    const base = normPath(bases[0]||"/");
    for (const raw of meths) {
      const p = normPath(path.posix.join(base, raw||"/"));
      // Method unknown from decorator here; mark as GET (approx) but still scan maturity
      routes.push(scanRoute({method:"GET", path:p, file:f, code:t, arglist:t}));
    }
  }
}

function scanRoute({method, path, file, code, arglist}) {
  const s = {
    method, path, file,
    hasAuth:   /auth|requireAuth|authenticate|passport|jwt/i.test(arglist) || /auth|jwt|passport/i.test(code),
    hasRBAC:   /rbac|acl|can\(|authorize|hasRole/i.test(arglist+code),
    hasValidation: /(zod|yup|joi|celebrate|express-validator|class-validator|schema\s*:\s*{)/i.test(arglist+code),
    usesDB:    /(prisma\.|knex\(|TypeORM|getRepository|createQueryBuilder|sql`)/i.test(code),
    externalCalls: (code.match(/\b(axios|fetch)\s*\(/g)||[]).length,
    hasTests:  false, // fill later
  };
  s.score = (s.hasAuth?1:0)+(s.hasRBAC?1:0)+(s.hasValidation?1:0)+(s.usesDB?1:0)+(s.externalCalls>0?1:0);
  return s;
}

// Map tests to routes (grep test files for path literals)
const testFiles = files.filter(f=>/\.test\.(ts|tsx|js|jsx)$/.test(f));
const pathIndex = new Map();
for (const r of routes) { const key=`${r.method} ${r.path}`; pathIndex.set(key, r); }
for (const tf of testFiles) {
  const tt = textCache.get(tf) || fs.readFileSync(tf,"utf8");
  for (const [key,r] of pathIndex.entries()) {
    if (tt.includes(r.path)) r.hasTests = true;
  }
}

// Collapse duplicates
const uniqKey = r => `${r.method} ${r.path}`;
const byKey = new Map();
for (const r of routes) {
  const k = uniqKey(r);
  const prev = byKey.get(k);
  if (!prev) byKey.set(k, r);
  else {
    prev.hasAuth ||= r.hasAuth;
    prev.hasRBAC ||= r.hasRBAC;
    prev.hasValidation ||= r.hasValidation;
    prev.usesDB ||= r.usesDB;
    prev.externalCalls = Math.max(prev.externalCalls, r.externalCalls);
    prev.hasTests ||= r.hasTests;
    prev.file = prev.file; // keep first
    prev.score = (prev.hasAuth?1:0)+(prev.hasRBAC?1:0)+(prev.hasValidation?1:0)+(prev.usesDB?1:0)+(prev.externalCalls>0?1:0)+(prev.hasTests?1:0);
  }
}

const finalRoutes = [...byKey.values()].sort((a,b)=> (b.score-a.score)||a.path.localeCompare(b.path));

/* Capability map: DB, jobs, integrations, security libs */
const cat = (re) => files.filter(f => re.test(textCache.get(f)||""));
const dbSignals = {
  prisma:  cat(/prisma\.|schema\.prisma/),
  knex:    cat(/\bknex\s*\(|knexfile\./i),
  typeorm: cat(/TypeORM|Entity\(|data-source\./i),
};
const jobs = {
  bull:    cat(/\b(bull|bullmq)\b/i),
  agenda:  cat(/\bagenda\(/i),
  cron:    cat(/\b(node-cron|cron)\b/i),
};
const integrations = {
  stripe:  cat(/\bstripe\b/i),
  twilio:  cat(/\btwilio\b/i),
  sendgrid:cat(/\b@sendgrid|sendgrid\b/i),
  s3:      cat(/\baws-sdk|@aws-sdk\/|S3\b/i),
  gapi:    cat(/\bgoogleapis\b/i),
  redis:   cat(/\b(ioredis|redis)\b/i),
};
const security = {
  helmet:  cat(/\bhelmet\(/i),
  cors:    cat(/\bcors\(/i),
  rateLimit:cat(/\bexpress-rate-limit|rateLimit\(/i),
  sentry:  cat(/\b@sentry\/node|Sentry\./i),
  otel:    cat(/\b@opentelemetry\/|otel\b/i),
};

const report = {
  summary: {
    routes: finalRoutes.length,
    highMaturity: finalRoutes.filter(r=>r.score>=4).length,
    lowMaturity: finalRoutes.filter(r=>r.score<=1).length,
  },
  routes: finalRoutes,
  capabilities: { dbSignals, jobs, integrations, security },
};

fs.writeFileSync("audit/code-reality.json", JSON.stringify(report,null,2));

/* Markdown */
const md = [];
md.push(`# Code Reality Report`);
md.push(`Generated: ${new Date().toISOString()}`);
md.push(`\n## Summary`);
md.push(`- Routes detected: **${report.summary.routes}**`);
md.push(`- High maturity (≥4): **${report.summary.highMaturity}**`);
md.push(`- Low maturity (≤1): **${report.summary.lowMaturity}**`);
md.push(`\n## Top endpoints by maturity`);
md.push(`| Method | Path | Score | Auth | RBAC | Validation | DB | ExtCalls | Tests | File |`);
md.push(`|-------:|------|------:|:----:|:----:|:----------:|:--:|:--------:|:-----:|------|`);
for (const r of finalRoutes.slice(0,50)) {
  md.push(`| ${r.method} | \`${r.path}\` | ${r.score} | ${bool(r.hasAuth)} | ${bool(r.hasRBAC)} | ${bool(r.hasValidation)} | ${bool(r.usesDB)} | ${r.externalCalls>0?r.externalCalls:""} | ${bool(r.hasTests)} | ${rel(r.file)} |`);
}
md.push(`\n## Capability Map (by code presence)`);
md.push(`- DB: prisma(${dbSignals.prisma.length}), knex(${dbSignals.knex.length}), typeorm(${dbSignals.typeorm.length})`);
md.push(`- Jobs: bull/bullmq(${jobs.bull.length}), agenda(${jobs.agenda.length}), cron(${jobs.cron.length})`);
md.push(`- Integrations: stripe(${integrations.stripe.length}), twilio(${integrations.twilio.length}), sendgrid(${integrations.sendgrid.length}), s3(${integrations.s3.length}), googleapis(${integrations.gapi.length}), redis(${integrations.redis.length})`);
md.push(`- Security/Observability: helmet(${security.helmet.length}), cors(${security.cors.length}), rateLimit(${security.rateLimit.length}), sentry(${security.sentry.length}), otel(${security.otel.length})`);
fs.writeFileSync("audit/code-reality.md", md.join("\n"));

function rel(f){ return f?path.relative(ROOT,f):""; }
function bool(b){ return b?"✅":""; }
console.log("Wrote audit/code-reality.md and audit/code-reality.json");