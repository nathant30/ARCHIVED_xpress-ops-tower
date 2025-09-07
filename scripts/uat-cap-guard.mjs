#!/usr/bin/env node
import fs from "fs";

const mode = process.env.RELEASE_STATE || "parked"; // parked | uat | live

if (mode !== "uat") { 
  console.log("UAT cap guard skipped:", mode); 
  process.exit(0); 
}

const allow = fs.existsSync("audit/uat_public.txt")
  ? fs.readFileSync("audit/uat_public.txt","utf8")
      .split("\n")
      .map(s => s.trim())
      .filter(Boolean)
  : [];

if (allow.length > 3) {
  console.error(`🚨 UAT cap exceeded: ${allow.length} > 3 (audit/uat_public.txt)`); 
  console.error("Current allowlist:");
  allow.forEach((ep, i) => console.error(`  ${i+1}. ${ep}`));
  process.exit(1);
}

console.log(`✅ UAT cap OK: ${allow.length}/3`);