#!/usr/bin/env node

const mode = process.env.RELEASE_STATE || "";

if (mode !== "uat") {
  console.log("🛡️  Rate limit guard: skipped (not UAT mode)");
  process.exit(0);
}

console.log("🛡️  UAT Rate Limit Guard");

const enabled = String(process.env.RATE_LIMIT_ENABLED || "false") === "true";
const max = Number(process.env.RATE_LIMIT_MAX || 0);
const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 60000);

console.log(`   RATE_LIMIT_ENABLED: ${enabled}`);
console.log(`   RATE_LIMIT_MAX: ${max} requests`);
console.log(`   RATE_LIMIT_WINDOW_MS: ${windowMs}ms`);

if (!enabled) {
  console.error("❌ UAT rate limiting is DISABLED (RATE_LIMIT_ENABLED=false)");
  console.error("   UAT environment must have rate limiting enabled for proper testing");
  process.exit(1);
}

if (max <= 0) {
  console.error("❌ UAT rate limit is unlimited (RATE_LIMIT_MAX=0)");
  console.error("   UAT environment must have finite rate limits for burst testing");
  process.exit(1);
}

if (max > 100) {
  console.warn("⚠️  UAT rate limit is very high (RATE_LIMIT_MAX=" + max + ")");
  console.warn("   Consider lowering for more effective burst testing");
}

console.log("✅ UAT rate limit guard: ENABLED and properly configured");
console.log(`   Limit: ${max} requests per ${Math.round(windowMs/1000)} seconds`);