#!/usr/bin/env node

import crypto from "crypto";

const secret = process.env.JWT_SECRET || "dev-256-bit-secret-dev-256-bit-secret-";
const now = Math.floor(Date.now() / 1000);

const payload = {
  iss: "xpress-uat",
  sub: "tester-uat", 
  aud: "xpress-api",
  iat: now,
  nbf: now - 10,
  exp: now + 3600,
  scope: "user:read user:write rides:create analytics:read",
  role: "tester",
  environment: "uat"
};

function b64(obj) {
  return Buffer.from(JSON.stringify(obj)).toString("base64url");
}

const header = { alg: "HS256", typ: "JWT" };
const unsigned = `${b64(header)}.${b64(payload)}`;
const signature = crypto
  .createHmac("sha256", secret)
  .update(unsigned)
  .digest("base64url");

const jwt = `${unsigned}.${signature}`;

if (process.argv.includes("--verbose")) {
  console.error("🔐 UAT JWT Generated:");
  console.error(`  Subject: ${payload.sub}`);
  console.error(`  Expires: ${new Date(payload.exp * 1000).toISOString()}`);
  console.error(`  Scope: ${payload.scope}`);
}

console.log(jwt);