#!/usr/bin/env node
// Hot-glass breaker tools for production emergencies

import fs from "fs";
import { execSync } from "child_process";

const [,, action, endpoint] = process.argv;

if (!action) {
  console.log(`
🚨 Emergency Production Breakers

Usage: node scripts/emergency-breakers.mjs <action> [endpoint]

Actions:
  demote <endpoint>     - Instantly demote public endpoint to internal
  demote-all            - Demote ALL public endpoints to internal (emergency park)
  freeze-surface        - Freeze public API surface (prevent changes)
  unfreeze-surface      - Unfreeze public API surface
  sanity-check          - Verify no ghosts, correct public count
  list-public           - List all public endpoints

Examples:
  node scripts/emergency-breakers.mjs demote /api/analytics
  node scripts/emergency-breakers.mjs freeze-surface
  node scripts/emergency-breakers.mjs sanity-check
`);
  process.exit(1);
}

const SPEC_PATH = "docs/api/openapi.json";
const PUBLIC_SPEC_PATH = "docs/api/openapi.public.json";
const SDK_PATH = "src/sdk/api-types.public.gen.ts";

function loadSpec() {
  return JSON.parse(fs.readFileSync(SPEC_PATH, "utf8"));
}

function saveSpec(spec) {
  fs.writeFileSync(SPEC_PATH, JSON.stringify(spec, null, 2));
}

function runGate() {
  try {
    execSync("npm run -s guard:public-openapi", { stdio: 'pipe' });
    console.log("✅ Public API guard: PASSED");
  } catch (error) {
    console.log("❌ Public API guard: FAILED");
    console.log(error.stdout?.toString() || error.message);
  }
}

switch (action) {
  case 'demote':
    if (!endpoint) {
      console.error("❌ Error: endpoint required for demote action");
      process.exit(1);
    }
    
    console.log(`🚨 EMERGENCY: Demoting ${endpoint} from public to internal...`);
    
    const spec = loadSpec();
    let found = false;
    
    for (const path in spec.paths) {
      for (const method in spec.paths[path]) {
        if (path === endpoint && spec.paths[path][method]["x-visibility"] === "public") {
          spec.paths[path][method]["x-visibility"] = "internal";
          found = true;
          console.log(`   Demoted: ${method.toUpperCase()} ${path}`);
        }
      }
    }
    
    if (found) {
      saveSpec(spec);
      console.log("✅ Endpoint demoted successfully");
      runGate();
      
      // Regenerate public spec
      execSync("node scripts/spec-public-only.mjs", { stdio: 'inherit' });
      console.log("✅ Public spec regenerated");
    } else {
      console.log(`❌ Error: Public endpoint ${endpoint} not found`);
      process.exit(1);
    }
    break;

  case 'freeze-surface':
    console.log("🧊 Freezing public API surface (preventing accidental changes)...");
    try {
      execSync(`git update-index --assume-unchanged ${PUBLIC_SPEC_PATH}`, { stdio: 'pipe' });
      execSync(`git update-index --assume-unchanged ${SDK_PATH}`, { stdio: 'pipe' });
      console.log("✅ Public surface frozen");
      console.log("   Run 'unfreeze-surface' when you want to make intentional changes");
    } catch (error) {
      console.log("⚠️  Files may already be frozen or not exist");
    }
    break;

  case 'unfreeze-surface':
    console.log("🔥 Unfreezing public API surface...");
    try {
      execSync(`git update-index --no-assume-unchanged ${PUBLIC_SPEC_PATH}`, { stdio: 'pipe' });
      execSync(`git update-index --no-assume-unchanged ${SDK_PATH}`, { stdio: 'pipe' });
      console.log("✅ Public surface unfrozen");
    } catch (error) {
      console.log("⚠️  Files may not be frozen");
    }
    break;

  case 'sanity-check':
    console.log("🔍 Running sanity checks...");
    
    // Check for ghost routes
    try {
      const ghostOutput = execSync("comm -3 audit/code_routes_full.txt audit/spec_routes_full.txt", { encoding: 'utf8' });
      if (ghostOutput.trim()) {
        console.log("❌ Ghost routes detected:");
        console.log(ghostOutput);
      } else {
        console.log("✅ No ghost routes (code routes = spec routes)");
      }
    } catch (error) {
      console.log("⚠️  Could not check ghost routes - audit files may be missing");
    }
    
    // Count public APIs
    const spec2 = loadSpec();
    let publicCount = 0;
    for (const p in spec2.paths) {
      for (const m in spec2.paths[p]) {
        if ((spec2.paths[p][m]["x-visibility"] || "internal") === "public") {
          publicCount++;
        }
      }
    }
    console.log(`✅ Public API count: ${publicCount}`);
    
    // Run production gate
    try {
      execSync("npm run -s gate:production", { stdio: 'inherit' });
    } catch (error) {
      console.log("❌ Production gate failed");
    }
    break;

  case 'list-public':
    console.log("📋 Public endpoints:");
    const spec3 = loadSpec();
    for (const p in spec3.paths) {
      for (const m in spec3.paths[p]) {
        if ((spec3.paths[p][m]["x-visibility"] || "internal") === "public") {
          console.log(`   ${m.toUpperCase()} ${p}`);
        }
      }
    }
    break;

  case 'demote-all':
    console.log("🚨 EMERGENCY PARK: Demoting ALL public endpoints to internal...");
    
    const specDemoteAll = loadSpec();
    const publicEndpoints = [];
    let demotedCount = 0;
    
    // First collect all public endpoints
    for (const path in specDemoteAll.paths) {
      for (const method in specDemoteAll.paths[path]) {
        const operation = specDemoteAll.paths[path][method];
        if (operation["x-visibility"] === "public") {
          publicEndpoints.push(`${method.toUpperCase()} ${path}`);
        }
      }
    }
    
    if (publicEndpoints.length === 0) {
      console.log("✅ No public endpoints found, already parked");
      break;
    }
    
    // Save current public endpoints to restore candidate list
    if (publicEndpoints.length > 0) {
      fs.writeFileSync("audit/public_rc.txt", publicEndpoints.join("\n") + "\n");
      console.log(`📋 Saved ${publicEndpoints.length} public endpoints to audit/public_rc.txt`);
    }
    
    // Demote all public endpoints
    for (const path in specDemoteAll.paths) {
      for (const method in specDemoteAll.paths[path]) {
        const operation = specDemoteAll.paths[path][method];
        if (operation["x-visibility"] === "public") {
          operation["x-visibility"] = "internal";
          operation["x-parked-at"] = new Date().toISOString();
          demotedCount++;
          console.log(`   Demoted: ${method.toUpperCase()} ${path}`);
        }
      }
    }
    
    saveSpec(specDemoteAll);
    console.log(`\n✅ Emergency park complete: Demoted ${demotedCount} public endpoints`);
    console.log("🅿️ System is now PARKED - all endpoints internal");
    runGate();
    break;

  default:
    console.error(`❌ Unknown action: ${action}`);
    process.exit(1);
}