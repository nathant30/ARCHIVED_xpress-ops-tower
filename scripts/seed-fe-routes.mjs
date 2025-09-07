#!/usr/bin/env node
import fs from "node:fs";

const spec = JSON.parse(fs.readFileSync("docs/api/openapi.json", "utf8"));

// Read missing routes from FE analysis
const missingRoutes = fs.readFileSync("audit/fe_missing_in_spec.txt", "utf8")
  .split("\n")
  .filter(Boolean)
  .filter(line => line.trim() && !line.startsWith("#"));

console.log(`🌱 Seeding ${missingRoutes.length} missing frontend routes into OpenAPI...`);

missingRoutes.forEach(line => {
  const [method, path] = line.trim().split(" ");
  const methodLower = method.toLowerCase();
  
  // Initialize path if doesn't exist
  if (!spec.paths[path]) {
    spec.paths[path] = {};
  }
  
  // Add basic route definition if doesn't exist
  if (!spec.paths[path][methodLower]) {
    spec.paths[path][methodLower] = {
      summary: `(Frontend-called) ${method} ${path}`,
      description: `Route called by frontend - needs backend implementation`,
      tags: [getTagFromPath(path)],
      responses: {
        "200": {
          description: "OK",
          content: {
            "application/json": {
              schema: { "$ref": "#/components/schemas/GenericObject" }
            }
          }
        },
        "400": { description: "Bad Request" },
        "401": { description: "Unauthorized" },
        "403": { description: "Forbidden" },
        "404": { description: "Not Found" }
      }
    };
    
    // Add operationId
    spec.paths[path][methodLower].operationId = `${methodLower}_${pathToOperationId(path)}`;
    
    console.log(`✅ Added ${method} ${path}`);
  }
});

function getTagFromPath(path) {
  const segments = path.split('/').filter(Boolean);
  if (segments[1]) {
    const tag = segments[1].charAt(0).toUpperCase() + segments[1].slice(1);
    return tag.replace(/[-_]/g, '');
  }
  return 'API';
}

function pathToOperationId(path) {
  return path.split('/').filter(Boolean)
    .map(segment => segment.replace(/[^a-zA-Z0-9]/g, ''))
    .join('_');
}

// Write updated spec
fs.writeFileSync("docs/api/openapi.json", JSON.stringify(spec, null, 2));
console.log(`\n✅ Seeded ${missingRoutes.length} routes into OpenAPI`);
console.log("⚠️  These routes need backend implementation or frontend cleanup");