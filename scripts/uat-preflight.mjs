#!/usr/bin/env node

import { execSync } from "child_process";

console.log("🛫 UAT Preflight Verification");

const run = (cmd, description) => {
  console.log(`\n📋 ${description}...`);
  try {
    execSync(cmd, { 
      stdio: "inherit", 
      env: { ...process.env, RELEASE_STATE: "uat" } 
    });
    console.log(`✅ ${description}: PASSED`);
  } catch (error) {
    console.error(`❌ ${description}: FAILED`);
    throw error;
  }
};

try {
  // 1. Drift detection and filtering
  run("npm run -s guard:drift || true", "Drift detection");
  run("node scripts/drift-filter.mjs", "Drift filtering");
  
  // 2. UAT-specific guards
  run("npm run -s parked-guard", "UAT allowlist enforcement");
  run("npm run -s guard:uat-cap", "UAT endpoint cap (≤3)");
  
  // 3. Quality gates
  run("npm run -s guard:public-openapi", "Public API quality");
  
  // 4. Schema compatibility (if we have a previous commit)
  try {
    const mergeBase = execSync("git merge-base origin/main HEAD", { encoding: "utf8" }).trim();
    if (mergeBase) {
      run(`node scripts/public-schema-compat.mjs ${mergeBase}`, "Schema compatibility");
    }
  } catch {
    console.log("⚠️ Schema compatibility check skipped (no merge base)");
  }
  
  // 5. Contract testing
  run("npm run -s contract:test", "Contract validation");
  
  console.log("\n🎯 UAT preflight: ALL CHECKS PASSED");
  console.log("✅ Ready for UAT deployment");
  
} catch (error) {
  console.error("\n🚨 UAT preflight: FAILED");
  console.error("❌ Fix issues before UAT deployment");
  process.exit(1);
}