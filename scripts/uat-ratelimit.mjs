#!/usr/bin/env node

import http from "node:http";
import https from "node:https";

const BASE = process.env.UAT_BASE || "http://localhost:4000";
const PATH = process.env.UAT_GET || "/api/analytics";
const BURST_SIZE = Number(process.env.BURST_SIZE || 50);
const JWT = process.env.JWT_TOKEN || "";

console.log("⚡ UAT Rate Limit Test");
console.log(`   Endpoint: ${BASE}${PATH}`);
console.log(`   Burst size: ${BURST_SIZE} concurrent requests`);

function makeRequest() {
  return new Promise((resolve) => {
    const url = new URL(BASE + PATH);
    const lib = url.protocol === "https:" ? https : http;
    
    const options = {
      method: "GET",
      hostname: url.hostname,
      port: url.port || (url.protocol === "https:" ? 443 : 80),
      path: url.pathname + url.search,
      headers: {
        "Accept": "application/json",
        ...(JWT ? { Authorization: `Bearer ${JWT}` } : {})
      },
      timeout: 10000
    };

    const startTime = Date.now();
    const req = lib.request(options, (res) => {
      const duration = Date.now() - startTime;
      resolve({
        statusCode: res.statusCode,
        duration,
        timestamp: startTime
      });
    });

    req.on("error", (error) => {
      resolve({
        statusCode: 0,
        error: error.message,
        duration: Date.now() - startTime,
        timestamp: startTime
      });
    });

    req.on("timeout", () => {
      req.destroy();
      resolve({
        statusCode: 0,
        error: "timeout",
        duration: Date.now() - startTime,
        timestamp: startTime
      });
    });

    req.end();
  });
}

(async () => {
  console.log(`\n🚀 Firing ${BURST_SIZE} concurrent requests...`);
  const startTime = Date.now();
  
  const responses = await Promise.all(
    Array.from({ length: BURST_SIZE }, () => makeRequest())
  );
  
  const totalDuration = Date.now() - startTime;
  
  // Analyze responses
  const statusCounts = {};
  let successCount = 0;
  let rateLimitedCount = 0;
  let errorCount = 0;
  let totalResponseTime = 0;
  
  responses.forEach(response => {
    const status = response.statusCode;
    statusCounts[status] = (statusCounts[status] || 0) + 1;
    
    if (status >= 200 && status < 300) {
      successCount++;
    } else if (status === 429) {
      rateLimitedCount++;
    } else {
      errorCount++;
    }
    
    if (response.duration) {
      totalResponseTime += response.duration;
    }
  });

  console.log(`\n📊 Rate Limit Test Results (${totalDuration}ms total):`);
  console.log(`   Total requests: ${responses.length}`);
  console.log(`   Successful (2xx): ${successCount}`);
  console.log(`   Rate limited (429): ${rateLimitedCount}`);
  console.log(`   Errors: ${errorCount}`);
  console.log(`   Average response time: ${Math.round(totalResponseTime / responses.length)}ms`);
  
  console.log(`\n📈 Status Code Distribution:`);
  Object.entries(statusCounts)
    .sort(([a], [b]) => Number(a) - Number(b))
    .forEach(([status, count]) => {
      const percentage = ((count / responses.length) * 100).toFixed(1);
      const emoji = status === "429" ? "🚫" : 
                   status >= "200" && status < "300" ? "✅" : 
                   status === "0" ? "💥" : "⚠️";
      console.log(`   ${emoji} ${status}: ${count} (${percentage}%)`);
    });

  // Validation
  if (rateLimitedCount === 0) {
    console.log(`\n⚠️  WARNING: No rate limiting detected`);
    console.log(`   Expected at least one 429 response in burst of ${BURST_SIZE}`);
    console.log(`   Rate limiting may not be configured or limit is too high`);
    process.exit(1);
  } else {
    console.log(`\n✅ RATE LIMITING VERIFIED`);
    console.log(`   ${rateLimitedCount} requests properly rate limited`);
    console.log(`   Rate limiting is working as expected`);
    process.exit(0);
  }
})();