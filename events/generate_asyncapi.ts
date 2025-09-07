import { mkdirSync, writeFileSync, readFileSync } from "fs";
import fg from "fast-glob";

const names = new Set<string>();
const files = fg.sync(["src/**/*.{ts,tsx,js}"], { ignore:["node_modules/**"] });

const add = (s:string)=>{ if (s) names.add(s); };

for (const f of files) {
  const t = readFileSync(f,"utf8");
  for (const m of t.matchAll(/\b(?:io|socket)\.emit\(['"]([^'"]+)['"]/g)) add(m[1]);
  for (const m of t.matchAll(/\bon\(['"]([^'"]+)['"]/g)) add(m[1]);
  for (const m of t.matchAll(/\bpublish\(['"]([^'"]+)['"]/g)) add(m[1]);
  for (const m of t.matchAll(/\bsubscribe\(['"]([^'"]+)['"]/g)) add(m[1]);
  for (const m of t.matchAll(/\b(?:redis|pub)\.publish\(['"]([^'"]+)['"]/g)) add(m[1]);
  for (const m of t.matchAll(/\bproducer\.send\(\s*{[^}]*topic:\s*['"]([^'"]+)['"]/g)) add(m[1]);
}

const channels:any = {};
[...names].sort().forEach(n => channels[`events.${n}`] = { subscribe:{ message:{ name:n, payload:{} }}});

const toYAML=(o:any,i=0)=>{const p="  ".repeat(i); if(o===null)return"null"; if(typeof o!=="object")return String(o);
if(Array.isArray(o))return o.map(v=>`${p}- ${toYAML(v,i+1).trimStart()}`).join("\n");
return Object.entries(o).map(([k,v])=>`${p}${k}: ${typeof v==="object"&&v!==null?`\n${toYAML(v,i+1)}`:toYAML(v,0)}`).join("\n");};

mkdirSync("artifacts",{recursive:true});
const doc={ asyncapi:"2.6.0", info:{ title:"Xpress Event Bus", version:"1.0.0" }, defaultContentType:"application/json", channels };
writeFileSync("artifacts/asyncapi.yaml", toYAML(doc));
console.log(`✓ EVENTS: ${names.size} name(s) → artifacts/asyncapi.yaml`);
