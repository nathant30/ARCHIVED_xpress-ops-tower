#!/usr/bin/env node

import fs from "fs";
import { execSync } from "child_process";

const mode = process.env.RELEASE_STATE || "parked"; // parked | uat | staging | live

console.log(`🛡️  Environment Guard: Checking release state (${mode})`);

// Read OpenAPI spec to check for public endpoints
const spec = JSON.parse(fs.readFileSync("docs/api/openapi.json", "utf8"));
const publicEndpoints = [];

for (const [path, methods] of Object.entries(spec.paths)) {
  for (const [method, operation] of Object.entries(methods)) {
    if (operation["x-visibility"] === "public") {
      publicEndpoints.push(`${method.toUpperCase()} ${path}`);
    }
  }
}

if (mode === "parked") {
  if (publicEndpoints.length > 0) {
    console.log("🚨 BLOCKED: Found public endpoints in parked mode!");
    console.log("Public endpoints detected:");
    publicEndpoints.forEach(ep => console.log(`  - ${ep}`));
    console.log("\nTo fix: npm run demote-all-public");
    process.exit(1);
  }
  console.log("✅ Parked Guard: All checks passed, no public exposure risk");
  process.exit(0);
}

if (mode === "uat") {
  // Load UAT allowlist
  const allowlistPath = "audit/uat_public.txt";
  const allowedEndpoints = fs.existsSync(allowlistPath)
    ? new Set(fs.readFileSync(allowlistPath, "utf8")
        .split("\n")
        .map(s => s.trim())
        .filter(Boolean))
    : new Set();
  
  // Check for unauthorized public endpoints
  const unauthorizedEndpoints = publicEndpoints.filter(ep => !allowedEndpoints.has(ep));
  
  if (unauthorizedEndpoints.length > 0) {
    console.log("🚨 BLOCKED: Public endpoints not in UAT allowlist!");
    console.log("Unauthorized endpoints:");
    unauthorizedEndpoints.forEach(ep => console.log(`  - ${ep}`));
    console.log(`\nAllowed endpoints (${allowedEndpoints.size}):`);
    allowedEndpoints.forEach(ep => console.log(`  ✅ ${ep}`));
    console.log("\nTo fix: Update audit/uat_public.txt or demote unauthorized endpoints");
    process.exit(1);
  }
  
  console.log(`✅ UAT Guard: ${publicEndpoints.length} public endpoints match allowlist`);
  process.exit(0);
}

if (mode === "staging") {
  if (publicEndpoints.length > 0) {
    console.log("🚨 BLOCKED: Staging should have NO public endpoints!");
    console.log("Public endpoints detected:");
    publicEndpoints.forEach(ep => console.log(`  - ${ep}`));
    console.log("\nStaging is internal-only for CI/CD validation");
    process.exit(1);
  }
  console.log("✅ Staging Guard: Internal-only mode confirmed");
  process.exit(0);
}

// Check dangerous environment variables for all modes
const dangerousVars = [
  "DEPLOY_TO_PRODUCTION",
  "ENABLE_PUBLIC_API", 
  "LIVE_TRAFFIC_ENABLED"
];

for (const varName of dangerousVars) {
  if (process.env[varName] === "true" && mode !== "live") {
    console.log(`🚨 BLOCKED: ${varName} is set to true in ${mode} mode!`);
    process.exit(1);
  }
}

console.log(`✅ Environment Guard: ${mode} mode validated, publicOps=${publicEndpoints.length}`);