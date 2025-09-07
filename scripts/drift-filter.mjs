#!/usr/bin/env node
import fs from "fs";
const missPath = "audit/missing_in_docs.txt";
const ignPath  = "audit/drift-ignore.txt";
if (!fs.existsSync(missPath)) process.exit(0);
const miss = fs.readFileSync(missPath,"utf8").split("\n").filter(Boolean);
const regs = (fs.existsSync(ignPath)?fs.readFileSync(ignPath,"utf8"):"")
  .split("\n").map(s=>s.trim()).filter(s=>s && !s.startsWith("#")).map(p=>new RegExp(p));
const keep = miss.filter(line => !regs.some(r => r.test(line)));
fs.writeFileSync(missPath, keep.join("\n") + (keep.length?"\n":""));
console.log(`Drift filter applied. Remaining: ${keep.length}`);