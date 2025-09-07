#!/usr/bin/env node

import http from "node:http";
import https from "node:https";
import fs from "node:fs";

console.log("💨 UAT Smoke Test");

const BASE = process.env.UAT_BASE || "http://localhost:4000";
const JWT = process.env.JWT_TOKEN || "";
const SPEC_PATH = "docs/api/openapi.public.json";
const LIST_PATH = "audit/uat_endpoints.json";
const TIMEOUT_MS = Number(process.env.TIMEOUT_MS || 8000);

if (!fs.existsSync(LIST_PATH)) {
  console.error(`❌ Missing ${LIST_PATH}`);
  process.exit(2);
}

const targets = JSON.parse(fs.readFileSync(LIST_PATH, "utf8"));

let spec = null;
if (fs.existsSync(SPEC_PATH)) {
  try { 
    spec = JSON.parse(fs.readFileSync(SPEC_PATH, "utf8")); 
  } catch (e) {
    console.warn(`⚠️ Could not read ${SPEC_PATH}, skipping auto-body detection`);
  }
}

const uuid = () =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === "x" ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });

function guessBodyFromSpec(path, method) {
  if (!spec) return null;
  const p = spec.paths?.[path];
  if (!p) return null;
  const op = p[method.toLowerCase()];
  if (!op) return null;
  const rb = op.requestBody?.content?.["application/json"];
  if (!rb) return null;
  
  if (rb.example) return rb.example;
  if (rb.examples) {
    const first = Object.values(rb.examples)[0];
    if (first && typeof first === "object" && "value" in first) {
      return first.value;
    }
  }
  return null;
}

function doReq({ method, path, body, expect, idempotent }) {
  return new Promise((resolve) => {
    const url = new URL(path, BASE);
    const payload = body ?? guessBodyFromSpec(path, method);
    const data = payload ? JSON.stringify(payload) : undefined;

    const headers = { "Accept": "application/json" };
    if (data) headers["Content-Type"] = "application/json";
    if (JWT) headers["Authorization"] = `Bearer ${JWT}`;
    if (idempotent) headers["Idempotency-Key"] = uuid();

    const lib = url.protocol === "https:" ? https : http;
    const opts = {
      method,
      headers,
      timeout: TIMEOUT_MS,
      hostname: url.hostname,
      port: url.port || (url.protocol === "https:" ? 443 : 80),
      path: url.pathname + url.search
    };

    const start = Date.now();
    const req = lib.request(opts, (res) => {
      let buf = "";
      res.on("data", (d) => (buf += d));
      res.on("end", () => {
        const ms = Date.now() - start;
        const okRange = res.statusCode >= 200 && res.statusCode < 300;
        const ok = expect ? res.statusCode === expect : okRange;
        const tag = ok ? "✅" : "❌";
        
        console.log(`${tag} ${method} ${path} -> ${res.statusCode} (${ms}ms)`);
        
        if (!ok) {
          console.log(`   Expected: ${expect || "2xx"}, Got: ${res.statusCode}`);
          try {
            const bodyPreview = buf.slice(0, 300);
            if (bodyPreview) {
              console.log(`   Response: ${bodyPreview}${buf.length > 300 ? "..." : ""}`);
            }
          } catch (e) {
            console.log(`   Response: [could not parse]`);
          }
          resolve(false);
        } else {
          if (payload) {
            console.log(`   ✓ Request body sent (${JSON.stringify(payload).length} bytes)`);
          }
          if (idempotent) {
            console.log(`   ✓ Idempotency-Key: ${headers["Idempotency-Key"]}`);
          }
          resolve(true);
        }
      });
    });

    req.on("error", (e) => {
      console.log(`❌ ${method} ${path} -> ERROR: ${String(e)}`);
      resolve(false);
    });

    req.on("timeout", () => {
      req.destroy();
      console.log(`❌ ${method} ${path} -> TIMEOUT (${TIMEOUT_MS}ms)`);
      resolve(false);
    });

    if (data) req.write(data);
    req.end();
  });
}

console.log(`🎯 Testing ${targets.length} UAT endpoints on ${BASE}`);
if (JWT) {
  console.log(`🔐 Using JWT authentication`);
} else {
  console.log(`⚠️ No JWT_TOKEN set, requests will be unauthenticated`);
}

(async () => {
  let fails = 0;
  const results = [];
  
  for (const target of targets) {
    const method = (target.method || "GET").toUpperCase();
    const path = target.path;
    
    console.log(`\n🔍 Testing: ${method} ${path}`);
    
    const success = await doReq({
      method,
      path,
      body: target.body,
      expect: target.expect,
      idempotent: !!target.idempotent
    });
    
    results.push({ method, path, success });
    if (!success) fails++;
  }
  
  console.log(`\n📊 UAT Smoke Test Results:`);
  console.log(`  Total endpoints: ${targets.length}`);
  console.log(`  Successful: ${results.filter(r => r.success).length}`);
  console.log(`  Failed: ${fails}`);
  
  if (fails > 0) {
    console.log(`\n❌ UAT smoke test FAILED (${fails} failures)`);
    console.log("\n🔧 Common fixes:");
    console.log("  - Set JWT_TOKEN env var for authenticated endpoints");
    console.log("  - Check endpoint expects correct status code");
    console.log("  - Verify request body format matches API spec");
    process.exit(1);
  }
  
  console.log(`✅ UAT smoke test PASSED (all endpoints responding correctly)`);
})();