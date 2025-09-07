"use strict";
const { execSync } = require('node:child_process');
const fs = require('node:fs');

function sh(cmd) {
  return execSync(cmd, { stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();
}

let base = 'origin/main';
try { base = sh('git merge-base origin/main HEAD'); } catch {}

const changed = sh(`git diff --name-only ${base}...HEAD`).split('\n').filter(Boolean);

const codeRoots = [/^src\//, /^apps\//, /^packages\//, /^server\//, /^api\//];
const isCode = p => codeRoots.some(rx => rx.test(p)) && !/^docs\//.test(p) && !/\.md$/i.test(p);
const isDoc  = p => /^docs\//.test(p) || /\.md$/i.test(p);

const codeFiles = changed.filter(isCode);
const docFiles  = changed.filter(isDoc);

const areas = [
  { name: 'Bookings/AI',    rx: /(bookings|modal|ai|ml|nexus)/i, docs: ['docs/ui/bookings.md','docs/ai/overview.md'] },
  { name: 'Pricing API',    rx: /(pricing|price|quote|billing)/i, docs: ['docs/api/pricing.md','docs/security/advisories.md'] },
  { name: 'Pricing Center', rx: /(pricing[-_\/ ]?center|region[-_\/ ]?profile)/i, docs: ['docs/apps/pricing-center.md','docs/migrations/pricing-v4.md'] },
  { name: 'Auth/RBAC',      rx: /(rbac|auth|policy|abac)/i, docs: ['docs/security/rbac.md'] },
];

const missing = [];
for (const a of areas) {
  const touched = codeFiles.some(f => a.rx.test(f));
  const docTouched = docFiles.some(f => a.docs.some(dp => f === dp || f.startsWith(dp.replace(/\.md$/,''))));
  if (touched && !docTouched) missing.push({ area: a.name, suggest: a.docs });
}

let out = [];
out.push('# Docs Drift Report','');
out.push(`Base: ${base}`,'');
out.push(`Changed files: ${changed.length}`);
out.push(`- Code files: ${codeFiles.length}`);
out.push(`- Doc files: ${docFiles.length}`,'');
if (!codeFiles.length) out.push('OK: No code changes.');
if (codeFiles.length && docFiles.length) out.push('INFO: both code and docs changed.');
if (codeFiles.length && !docFiles.length) out.push('FAIL: code changed but NO docs changed.');

if (missing.length) {
  out.push('', '## Areas likely missing docs');
  for (const m of missing) out.push(`- ${m.area} -> add/update: ${m.suggest.join(', ')}`);
}

out.push('', '## Code changes (sample)');
out.push(codeFiles.slice(0,50).map(f => `- ${f}`).join('\n') || '_none_');
out.push('', '## Doc changes (sample)');
out.push(docFiles.slice(0,50).map(f => `- ${f}`).join('\n') || '_none_');

fs.writeFileSync('docs-drift-report.md', out.join('\n'));
console.log('Wrote docs-drift-report.md');
