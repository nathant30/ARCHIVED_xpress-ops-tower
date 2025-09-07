#!/usr/bin/env bash
set -euo pipefail

# If this is the very first build, do not skip
if [ -z "${VERCEL_GIT_COMMIT_SHA:-}" ] || [ -z "${VERCEL_GIT_PREVIOUS_SHA:-}" ]; then
  exit 1
fi

# If any changed file is NOT in these paths, we must build (exit 1)
if git diff --name-only "$VERCEL_GIT_PREVIOUS_SHA" "$VERCEL_GIT_COMMIT_SHA" | \
   grep -qEv '^(docs/|artifacts/|\.github/|\.spectral\.yaml|openapi/|rbac/|events/|scripts/gen-)'
then
  exit 1   # proceed with full build
fi

echo "Vercel: skipping build (docs/ci/spec-only changes)"
exit 0
