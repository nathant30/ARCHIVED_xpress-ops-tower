#!/usr/bin/env node

import http from "node:http";
import https from "node:https";

const BASE = process.env.UAT_BASE || "http://localhost:4000";
const PATH = process.env.UAT_POST || "/api/rides";
const JWT = process.env.JWT_TOKEN || "";
const key = process.env.IDEMPOTENCY_KEY || cryptoRandom();

const body = JSON.stringify({
  customerId: "00000000-0000-0000-0000-000000000001",
  pickupLocation: { 
    latitude: 14.5538, 
    longitude: 121.0244,
    address: "Makati CBD"
  },
  dropoffLocation: { 
    latitude: 14.6091, 
    longitude: 121.0223,
    address: "Quezon City"
  },
  vehicleType: "sedan",
  serviceType: "standard"
});

function cryptoRandom() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === "x" ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function makeRequest() {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE + PATH);
    const lib = url.protocol === "https:" ? https : http;
    
    const options = {
      method: "POST",
      hostname: url.hostname,
      port: url.port || (url.protocol === "https:" ? 443 : 80),
      path: url.pathname + url.search,
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Idempotency-Key": key,
        ...(JWT ? { Authorization: `Bearer ${JWT}` } : {})
      },
      timeout: 10000
    };

    const req = lib.request(options, (res) => {
      let responseBody = "";
      res.on("data", (chunk) => responseBody += chunk);
      res.on("end", () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: responseBody,
          timestamp: Date.now()
        });
      });
    });

    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });

    req.write(body);
    req.end();
  });
}

console.log("🔄 UAT Idempotency Replay Test");
console.log(`   Endpoint: ${BASE}${PATH}`);
console.log(`   Idempotency-Key: ${key}`);

(async () => {
  try {
    console.log("\n📤 Making first request...");
    const response1 = await makeRequest();
    
    console.log("\n📤 Making second request (same key)...");
    const response2 = await makeRequest();

    const statusMatch = response1.statusCode === response2.statusCode;
    const bodyMatch = response1.body === response2.body;
    const identical = statusMatch && bodyMatch;

    console.log(`\n📊 Idempotency Test Results:`);
    console.log(`   First response:  ${response1.statusCode}`);
    console.log(`   Second response: ${response2.statusCode}`);
    console.log(`   Status codes match: ${statusMatch ? "✅" : "❌"}`);
    console.log(`   Response bodies match: ${bodyMatch ? "✅" : "❌"}`);
    
    if (identical) {
      console.log(`\n✅ IDEMPOTENCY VERIFIED - Identical responses for key: ${key}`);
      process.exit(0);
    } else {
      console.log(`\n❌ IDEMPOTENCY VIOLATION - Different responses for same key`);
      
      if (!statusMatch) {
        console.log(`   Expected both requests to return ${response1.statusCode}`);
      }
      
      if (!bodyMatch) {
        console.log(`   Response body differences detected`);
        console.log(`   First:  ${response1.body.slice(0, 200)}...`);
        console.log(`   Second: ${response2.body.slice(0, 200)}...`);
      }
      
      process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Idempotency test failed: ${error.message}`);
    process.exit(1);
  }
})();