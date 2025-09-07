#!/usr/bin/env node
import fs from "fs";
import { execSync } from "child_process";

console.log("🚀 Running production gate checks...\n");

const checks = [
  {
    name: "API Drift",
    cmd: "npm run -s guard:drift",
    critical: true
  },
  {
    name: "Public API Quality",
    cmd: "npm run -s guard:public-openapi", 
    critical: true
  },
  {
    name: "Schema Compatibility",
    cmd: "node scripts/public-schema-compat.mjs $(git merge-base origin/main HEAD 2>/dev/null || git rev-parse HEAD~1)",
    critical: true
  },
  {
    name: "Load Test",
    cmd: "npx --yes autocannon -d 10 -c 10 http://localhost:4000/api/analytics",
    critical: false,
    validate: (output) => {
      const lines = output.split('\n');
      const avgLatency = lines.find(l => l.includes('Avg'))?.match(/(\d+(?:\.\d+)?)\s*ms/)?.[1];
      const errors = output.includes('ECONNREFUSED');
      if (errors) return { pass: false, msg: "Server not running" };
      if (!avgLatency) return { pass: false, msg: "Could not parse latency" };
      const latencyMs = parseFloat(avgLatency);
      return { 
        pass: latencyMs < 500, 
        msg: `Avg latency: ${latencyMs}ms ${latencyMs < 500 ? '✅' : '⚠️  (>500ms)'}` 
      };
    }
  }
];

let passed = 0;
let failed = 0;

for (const check of checks) {
  try {
    console.log(`📋 ${check.name}...`);
    const output = execSync(check.cmd, { encoding: 'utf8', stdio: 'pipe' });
    
    if (check.validate) {
      const result = check.validate(output);
      if (result.pass) {
        console.log(`✅ ${check.name}: ${result.msg}\n`);
        passed++;
      } else {
        console.log(`${check.critical ? '❌' : '⚠️ '} ${check.name}: ${result.msg}\n`);
        if (check.critical) failed++;
      }
    } else {
      console.log(`✅ ${check.name}: OK\n`);
      passed++;
    }
  } catch (error) {
    const msg = error.stderr || error.message || 'Unknown error';
    console.log(`${check.critical ? '❌' : '⚠️ '} ${check.name}: ${msg}\n`);
    if (check.critical) failed++;
  }
}

console.log(`\n🎯 Production Gate Results: ${passed} passed, ${failed} critical failures`);

if (failed > 0) {
  console.log("❌ GATE FAILED - Fix critical issues before deploying");
  process.exit(1);
} else {
  console.log("✅ GATE PASSED - Ready for production deployment");
  
  // Write gate report
  const report = {
    timestamp: new Date().toISOString(),
    passed,
    failed,
    status: "PASS"
  };
  fs.writeFileSync('audit/production-gate.json', JSON.stringify(report, null, 2));
  console.log("📊 Gate report saved to audit/production-gate.json");
}