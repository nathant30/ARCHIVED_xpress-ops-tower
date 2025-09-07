#!/usr/bin/env node

import { execSync } from "child_process";

console.log("🎯 UAT One-Shot Promotion");

try {
  // Promote endpoints from UAT allowlist
  execSync("node scripts/promote-public.mjs audit/uat_public.txt", { stdio: "inherit" });
  
  // Generate public-only spec
  execSync("node scripts/spec-public-only.mjs", { stdio: "inherit" });
  
  console.log("✅ UAT promotion done.");
} catch (error) {
  console.error("❌ UAT promotion failed:", error.message);
  process.exit(1);
}