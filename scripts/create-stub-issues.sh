#!/bin/bash

# Check if GitHub CLI is available and authenticated
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed"
    echo "Install: https://cli.github.com/"
    exit 1
fi

if ! gh auth status &> /dev/null; then
    echo "❌ GitHub CLI is not authenticated"
    echo "Run: gh auth login"
    exit 1
fi

echo "🎯 Creating GitHub issues for API stubs..."

# Read stub list and create issues
while IFS= read -r line; do
  [ -z "$line" ] && continue
  
  title="API Stub: ${line}"
  
  # Determine domain and assignees based on path
  domain="backend"
  if [[ $line == *"/api/pricing/"* ]]; then
    domain="pricing"
  elif [[ $line == *"/api/auth/"* ]]; then
    domain="auth"
  elif [[ $line == *"/api/analytics"* ]] || [[ $line == *"/api/metrics"* ]] || [[ $line == *"/api/alerts"* ]]; then
    domain="analytics"
  fi
  
  body=$(cat <<TXT
This endpoint exists as a 501 stub in OpenAPI (x-status: "stub").

**Route:** \`${line}\`

**Domain:** ${domain}

**File:** \`src/app/api/${line#GET /api/}/route.ts\`

**Done when:**
- [ ] Business logic implemented in Next.js route handler
- [ ] Contract tests (Prism) pass with 200 responses  
- [ ] OpenAPI updated (x-status → "implemented", real examples added)
- [ ] Unit/integration tests added
- [ ] Frontend updated to use typed SDK
- [ ] Stub count decremented in budget

**Current status:** Returns 501 Not Implemented

**Priority:** Medium (affects user experience)
TXT
)

  echo "Creating issue: $title"
  gh issue create \
    --title "$title" \
    --body "$body" \
    --label "api" \
    --label "stub" \
    --label "$domain" \
    --label "backend" || echo "⚠️  Issue creation failed for: $line"
    
done < <(npm run -s stubs:list)

echo "✅ Finished creating stub issues"