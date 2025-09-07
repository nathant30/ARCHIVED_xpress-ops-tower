#!/usr/bin/env node

import fs from "fs";

console.log("🎯 UAT Coverage Analysis");

// Load UAT allowlist
const allowlistPath = "audit/uat_public.txt";
if (!fs.existsSync(allowlistPath)) {
  console.error(`❌ UAT allowlist not found: ${allowlistPath}`);
  process.exit(1);
}

const allowedEndpoints = new Set(
  fs.readFileSync(allowlistPath, "utf8")
    .split("\n")
    .map(s => s.trim())
    .filter(Boolean)
);

// Load smoke test endpoints
const endpointsPath = "audit/uat_endpoints.json";
if (!fs.existsSync(endpointsPath)) {
  console.error(`❌ UAT endpoints specification not found: ${endpointsPath}`);
  process.exit(1);
}

const smokeEndpoints = JSON.parse(fs.readFileSync(endpointsPath, "utf8"));
const coveredEndpoints = new Set(
  smokeEndpoints.map(endpoint => 
    `${(endpoint.method || "GET").toUpperCase()} ${endpoint.path}`
  )
);

console.log(`\n📋 Coverage Analysis:`);
console.log(`   UAT allowlist: ${allowedEndpoints.size} endpoints`);
console.log(`   Smoke tests: ${coveredEndpoints.size} endpoints`);

// Find missing endpoints (in allowlist but not in smoke tests)
const missingFromSmoke = [...allowedEndpoints].filter(endpoint => 
  !coveredEndpoints.has(endpoint)
);

// Find extra endpoints (in smoke tests but not in allowlist)
const extraInSmoke = [...coveredEndpoints].filter(endpoint => 
  !allowedEndpoints.has(endpoint)
);

// Report results
if (missingFromSmoke.length > 0) {
  console.log(`\n❌ UAT smoke tests missing endpoints:`);
  missingFromSmoke.forEach(endpoint => {
    console.log(`   - ${endpoint}`);
  });
}

if (extraInSmoke.length > 0) {
  console.log(`\n⚠️  Smoke tests include non-allowlisted endpoints:`);
  extraInSmoke.forEach(endpoint => {
    console.log(`   - ${endpoint}`);
  });
}

if (missingFromSmoke.length === 0 && extraInSmoke.length === 0) {
  console.log(`\n✅ Perfect coverage: All allowlisted endpoints are tested`);
  
  // Show what's covered
  console.log(`\n📍 Covered endpoints:`);
  [...allowedEndpoints].sort().forEach(endpoint => {
    console.log(`   ✓ ${endpoint}`);
  });
  
  process.exit(0);
} else {
  console.log(`\n🔧 Recommendations:`);
  
  if (missingFromSmoke.length > 0) {
    console.log(`   1. Add missing endpoints to ${endpointsPath}`);
    console.log(`   2. Or remove them from ${allowlistPath} if not needed`);
  }
  
  if (extraInSmoke.length > 0) {
    console.log(`   1. Add extra endpoints to ${allowlistPath} if they should be public`);
    console.log(`   2. Or remove them from ${endpointsPath} if they should stay internal`);
  }
  
  console.log(`\n❌ UAT coverage incomplete`);
  process.exit(1);
}