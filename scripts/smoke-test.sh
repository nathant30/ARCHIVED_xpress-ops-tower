#!/usr/bin/env bash
set -euo pipefail
U="${1:-http://127.0.0.1:4000}"

echo "Connectivity (expect 200|401|404 ≠ 000):"
curl -s -o /dev/null -w "%{http_code}\n" "$U/api/analytics"

echo -e "\nBurst (100 calls, expect mix ~5x200 + many 429s):"
seq 100 | xargs -n1 -P10 -I{} curl -s -o /dev/null -w "%{http_code}\n" "$U/api/analytics" | sort | uniq -c

echo -e "\nHeaders (rate + retry + correlation):"
curl -sI "$U/api/analytics" | grep -Ei 'x-rate|retry-after|x-correlation-id'