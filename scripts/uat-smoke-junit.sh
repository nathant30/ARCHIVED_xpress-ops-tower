#!/usr/bin/env bash
set -euo pipefail

OUTPUT_FILE="${1:-uat-smoke.junit.xml}"
START_TIME=$(date +%s)

echo "🧪 UAT Smoke Test with JUnit XML output"
echo "   Output file: $OUTPUT_FILE"

# Run the smoke test and capture exit status
set +e
node ./scripts/uat-smoke.mjs
SMOKE_STATUS=$?
set -e

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

# Generate JUnit XML
FAILURES=0
FAILURE_BLOCK=""

if [ "$SMOKE_STATUS" -ne 0 ]; then
  FAILURES=1
  FAILURE_BLOCK='<failure message="UAT smoke test failed" type="EndpointValidationFailure">
      <![CDATA[
      UAT smoke test detected endpoint failures.
      Check the console output above for detailed error information.
      Common issues:
      - Endpoint returns unexpected status code
      - Authentication token missing or expired
      - Request body format does not match API spec
      - Network connectivity issues
      ]]>
    </failure>'
fi

cat > "$OUTPUT_FILE" <<XML
<?xml version="1.0" encoding="UTF-8"?>
<testsuite name="uat-smoke" 
           tests="1" 
           failures="$FAILURES" 
           errors="0" 
           time="$DURATION"
           timestamp="$(date -Iseconds)">
  <testcase classname="uat.smoke" 
            name="endpoint-validation" 
            time="$DURATION">
    $FAILURE_BLOCK
  </testcase>
  <system-out>
    <![CDATA[UAT smoke test executed with status: $SMOKE_STATUS]]>
  </system-out>
</testsuite>
XML

if [ "$SMOKE_STATUS" -eq 0 ]; then
  echo "✅ UAT smoke test passed - JUnit XML written to $OUTPUT_FILE"
else
  echo "❌ UAT smoke test failed - JUnit XML written to $OUTPUT_FILE"
fi

exit $SMOKE_STATUS