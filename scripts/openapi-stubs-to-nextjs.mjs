#!/usr/bin/env node
import fs from "fs";
import path from "path";

const miss = fs.existsSync("audit/fe_missing_in_code.txt")
  ? fs.readFileSync("audit/fe_missing_in_code.txt","utf8").split("\n").map(s=>s.trim()).filter(Boolean)
  : [];

const routes = miss.map(l => {
  const [method, ...rest] = l.split(" ");
  return { method: method.toLowerCase(), path: rest.join(" ") };
});

console.log(`🔧 Generating ${routes.length} Next.js API stub routes...`);

routes.forEach(r => {
  // Convert /api/pricing/profiles/{param} -> src/app/api/pricing/profiles/[param]/route.ts
  let filePath = r.path.replace(/^\/api/, "src/app/api");
  
  // Handle path parameters: {param} -> [param]
  filePath = filePath.replace(/\{([^}]+)\}/g, "[$1]");
  
  // Add route.ts
  filePath = path.join(filePath, "route.ts");
  
  // Ensure directory exists
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  
  // Generate stub content
  const stubContent = `// AUTO-GENERATED STUB — DO NOT EDIT BY HAND
// Route: ${r.method.toUpperCase()} ${r.path}
// Status: STUB (needs implementation)

import { NextRequest, NextResponse } from 'next/server';

export async function ${r.method.toUpperCase()}(request: NextRequest) {
  return NextResponse.json(
    {
      error: "Not implemented",
      route: "${r.method.toUpperCase()} ${r.path}",
      message: "This endpoint is a stub and needs backend implementation"
    },
    { status: 501 }
  );
}
`;

  fs.writeFileSync(filePath, stubContent);
  console.log(`✅ Created ${filePath}`);
});

console.log(`\n🎯 Generated ${routes.length} stub routes`);
console.log("⚠️  Routes return 501 Not Implemented until you replace with real logic");
console.log("📝 Edit files in src/app/api/* to implement functionality");