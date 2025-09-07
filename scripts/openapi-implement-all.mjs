#!/usr/bin/env node
import fs from "fs";

const specPath = "docs/api/openapi.json";
if (!fs.existsSync(specPath)) {
  console.error("Missing docs/api/openapi.json"); 
  process.exit(1);
}
const spec = JSON.parse(fs.readFileSync(specPath,"utf8"));

function expressPath(p){ return (p||"/").replace(/\{([A-Za-z0-9_]+)\}/g, ":$1"); }
function opId(method, path, op){ return op.operationId || `${method}_${path.replace(/[\/{}:]/g,"_")}`; }

const routes = [];
for (const [p,item] of Object.entries(spec.paths||{})) {
  for (const [m,op] of Object.entries(item||{})) {
    if (!["get","post","put","patch","delete","options","head"].includes(m)) continue;
    const status = op["x-status"];
    if (status === "baseline") {
      routes.push({ method: m.toUpperCase(), path: p, expressPath: expressPath(p), opId: opId(m,p,op) });
      // flip to baseline-implemented in the spec now
      op["x-status"] = "baseline";
      // ensure 200/201 response exists
      op.responses ||= {};
      const successCode = (m==="post") ? "201" : "200";
      op.responses[successCode] ||= { description: "OK", content: {"application/json": { schema: {"type": "object", "properties": {"ok": {"type": "boolean"}, "data": {"type": "object"}}}}}};
    }
  }
}

// write updated spec
fs.writeFileSync(specPath, JSON.stringify(spec, null, 2));

// generate a single registrar with all baseline routes for Next.js API routes
const nextRoutes = routes.map(r => {
  const method = r.method.toLowerCase();
  const success = (method==="post") ? 201 : 200;
  
  // Convert API paths to Next.js file paths properly
  let routePath = r.expressPath.replace(/^\/api\//, '');
  // Replace :param with [param]
  routePath = routePath.replace(/:([^\/]+)/g, '[$1]');
  
  return {
    ...r,
    nextPath: `src/app/api/${routePath}/route.ts`,
    routeContent: `import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function ${r.method}(request: NextRequest, { params }: { params?: Record<string, string> } = {}) {
  try {
    // Parse request data
    const query = Object.fromEntries(request.nextUrl.searchParams.entries());
    const body = request.method !== 'GET' ? await request.json().catch(() => ({})) : {};
    
    // Persist event log
    const event = await prisma.apiEvent.create({
      data: {
        method: "${r.method}",
        path: "${r.path}", 
        operation: "${r.opId}",
        params: params || {},
        query,
        body
      }
    });

    // Return baseline response
    return NextResponse.json({
      ok: true,
      data: {
        id: event.id,
        operation: "${r.opId}",
        timestamp: event.createdAt
      }
    }, { status: ${success} });
    
  } catch (error) {
    console.error('Baseline handler error:', error);
    return NextResponse.json({
      ok: false,
      error: "BaselineImplementationError",
      details: String(error?.message || error)
    }, { status: 500 });
  }
}`
  };
});

// Create directories and write route files
for (const route of nextRoutes) {
  const dir = route.nextPath.substring(0, route.nextPath.lastIndexOf('/'));
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(route.nextPath, route.routeContent);
}

console.log(`Generated baseline handlers for ${routes.length} operations:`);
routes.forEach(r => console.log(`  ${r.method} ${r.path} → ${nextRoutes.find(nr => nr.method === r.method && nr.path === r.path)?.nextPath}`));