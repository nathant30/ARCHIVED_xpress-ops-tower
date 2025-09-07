#!/usr/bin/env node
import fs from "node:fs";
import { execSync } from "node:child_process";

console.log("🔍 Scanning frontend for API calls...");

// Enhanced patterns to catch various API call methods
const scanPatterns = [
  // Direct fetch calls
  'fetch\\s*\\(\\s*[\'"`]([^\'"`\\)]+)[\'"`]',
  
  // API path templates
  '\\/api\\/[\\w\\-\\/\\{\\}:]+',
  
  // axios usage
  'axios\\.(get|post|put|patch|delete)\\s*\\(\\s*[\'"`]([^\'"`\\)]+)[\'"`]',
  
  // Custom API wrappers
  'api\\.(get|post|put|patch|delete)',
  
  // useQuery/useMutation patterns (React Query)
  'useQuery\\s*\\(\\s*[\'"`]([^\'"`\\)]+)[\'"`]',
  'useMutation\\s*\\(\\s*[\'"`]([^\'"`\\)]+)[\'"`]',
  
  // SWR patterns  
  'useSWR\\s*\\(\\s*[\'"`]([^\'"`\\)]+)[\'"`]'
];

const results = {
  directFetchCalls: [],
  apiPaths: new Set(),
  wrapperCalls: [],
  queryKeys: []
};

// Scan all frontend files
const scanCommands = scanPatterns.map(pattern => 
  `rg -n --no-heading -e "${pattern}" src/ --type ts --type tsx 2>/dev/null || true`
);

scanCommands.forEach((cmd, i) => {
  try {
    const output = execSync(cmd, { encoding: 'utf8' });
    const lines = output.trim().split('\n').filter(Boolean);
    
    lines.forEach(line => {
      const [file, lineNum, ...content] = line.split(':');
      const fullLine = content.join(':');
      
      // Extract API paths
      const apiPathMatch = fullLine.match(/\/api\/[\w\-\/\{\}:]+/g);
      if (apiPathMatch) {
        apiPathMatch.forEach(path => results.apiPaths.add(path));
      }
      
      // Categorize findings
      if (fullLine.includes('fetch(')) {
        results.directFetchCalls.push({ file, line: lineNum, content: fullLine });
      } else if (fullLine.includes('api.') || fullLine.includes('axios.')) {
        results.wrapperCalls.push({ file, line: lineNum, content: fullLine });
      } else if (fullLine.includes('useQuery') || fullLine.includes('useMutation') || fullLine.includes('useSWR')) {
        results.queryKeys.push({ file, line: lineNum, content: fullLine });
      }
    });
  } catch (error) {
    // Ignore errors from empty results
  }
});

// Generate detailed report
const report = {
  summary: {
    totalApiPaths: results.apiPaths.size,
    directFetchCalls: results.directFetchCalls.length,
    wrapperCalls: results.wrapperCalls.length,
    queryKeys: results.queryKeys.length
  },
  apiPathsFound: Array.from(results.apiPaths).sort(),
  details: {
    directFetchCalls: results.directFetchCalls.slice(0, 20), // Limit output
    wrapperCalls: results.wrapperCalls.slice(0, 20),
    queryKeys: results.queryKeys.slice(0, 20)
  }
};

// Write results
fs.writeFileSync('audit/frontend-api-calls.json', JSON.stringify(report, null, 2));

// Write simple list for comparison with OpenAPI
const apiPathsList = Array.from(results.apiPaths).sort().join('\n');
fs.writeFileSync('audit/frontend-api-paths.txt', apiPathsList);

// Compare with OpenAPI routes
const openApiFile = 'docs/api/openapi.json';
let comparison = { frontendOnly: [], bothSystems: [], openapiOnly: [] };

if (fs.existsSync(openApiFile)) {
  const openapi = JSON.parse(fs.readFileSync(openApiFile, 'utf8'));
  const openApiPaths = new Set(Object.keys(openapi.paths || {}));
  
  const frontendPaths = results.apiPaths;
  
  // Normalize paths for comparison (remove {id} vs :id differences)
  const normalizePath = (path) => path.replace(/\{[^}]+\}/g, ':param').replace(/:[\w]+/g, ':param');
  
  const normalizedFE = new Set([...frontendPaths].map(normalizePath));
  const normalizedOA = new Set([...openApiPaths].map(normalizePath));
  
  comparison.frontendOnly = [...normalizedFE].filter(p => !normalizedOA.has(p));
  comparison.bothSystems = [...normalizedFE].filter(p => normalizedOA.has(p));
  comparison.openapiOnly = [...normalizedOA].filter(p => !normalizedFE.has(p));
}

// Generate markdown report
const markdownReport = `# Frontend API Usage Analysis

Generated: ${new Date().toISOString()}

## Summary
- **API paths found**: ${report.summary.totalApiPaths}
- **Direct fetch() calls**: ${report.summary.directFetchCalls}  
- **Wrapper/library calls**: ${report.summary.wrapperCalls}
- **Query hooks**: ${report.summary.queryKeys}

## API Paths Called by Frontend
\`\`\`
${report.apiPathsFound.join('\n')}
\`\`\`

## Alignment Check (Frontend ↔ OpenAPI)
- **✅ In both systems**: ${comparison.bothSystems.length} paths
- **⚠️ Frontend only**: ${comparison.frontendOnly.length} paths 
- **📚 OpenAPI only**: ${comparison.openapiOnly.length} paths

${comparison.frontendOnly.length > 0 ? `
### 🚨 Frontend calls undocumented APIs:
${comparison.frontendOnly.map(p => `- ${p}`).join('\n')}
` : ''}

${comparison.openapiOnly.length > 0 ? `
### 📚 OpenAPI documents unused APIs:
${comparison.openapiOnly.map(p => `- ${p}`).join('\n')}
` : ''}

## Sample API Call Patterns

### Direct fetch() calls:
${report.details.directFetchCalls.slice(0, 5).map(call => 
  `- \`${call.file}:${call.line}\` - ${call.content.substring(0, 80)}...`
).join('\n')}

### Library/wrapper calls:
${report.details.wrapperCalls.slice(0, 5).map(call => 
  `- \`${call.file}:${call.line}\` - ${call.content.substring(0, 80)}...`
).join('\n')}

### Query hooks:
${report.details.queryKeys.slice(0, 5).map(call => 
  `- \`${call.file}:${call.line}\` - ${call.content.substring(0, 80)}...`
).join('\n')}
`;

fs.writeFileSync('audit/frontend-api-analysis.md', markdownReport);

console.log(`✅ Frontend API analysis complete:`);
console.log(`   📁 audit/frontend-api-calls.json - Detailed results`);
console.log(`   📄 audit/frontend-api-analysis.md - Human-readable report`);
console.log(`   📝 audit/frontend-api-paths.txt - Simple path list`);
console.log(`\n🎯 Found ${report.summary.totalApiPaths} unique API paths in frontend code`);

if (comparison.frontendOnly.length > 0) {
  console.log(`⚠️  ${comparison.frontendOnly.length} frontend API calls are undocumented in OpenAPI`);
} else {
  console.log(`✅ All frontend API calls are documented in OpenAPI`);
}