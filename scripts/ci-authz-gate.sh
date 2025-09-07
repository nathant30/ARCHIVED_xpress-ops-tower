#!/bin/bash
# CI/CD AuthZ Regression Gate
# Blocks merges if any authorization tests fail
# Must achieve 100% pass rate on critical authorization flows

set -e  # Exit on any error

echo "🔒 Starting AuthZ Regression Gate"
echo "================================="

# Configuration
REQUIRED_PASS_RATE=100
CRITICAL_TEST_SUITES=(
  "sql-rls-ddm"
  "postman-api"
  "jest-rbac-matrix"
  "mfa-enforcement" 
  "cross-region-override"
)

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')] $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Track results
declare -A test_results
overall_status=0

# Function to run SQL RLS/DDM tests
run_sql_tests() {
    print_status "Running SQL RLS/DDM Critical Tests..."
    
    if node __tests__/authz-comprehensive/setup/sql-test-runner.js | grep -q "Success Rate: 100.0%"; then
        test_results["sql-rls-ddm"]="PASS"
        print_success "SQL RLS/DDM tests: 100% pass rate"
        return 0
    else
        test_results["sql-rls-ddm"]="FAIL"
        print_error "SQL RLS/DDM tests: Failed to achieve 100% pass rate"
        return 1
    fi
}

# Function to run Jest RBAC matrix tests
run_jest_tests() {
    print_status "Running Jest RBAC Permission Matrix Tests..."
    
    # Run specific critical tests
    if npm test -- __tests__/authz-comprehensive/unit/rbac-permission-matrix.test.ts --silent; then
        test_results["jest-rbac-matrix"]="PASS"
        print_success "Jest RBAC matrix tests: All critical paths passing"
        return 0
    else
        test_results["jest-rbac-matrix"]="FAIL" 
        print_error "Jest RBAC matrix tests: Critical permission validation failed"
        return 1
    fi
}

# Function to run MFA enforcement tests
run_mfa_tests() {
    print_status "Running MFA Enforcement Tests..."
    
    if npm test -- __tests__/authz-comprehensive/unit/mfa-enforcement.test.ts --silent; then
        test_results["mfa-enforcement"]="PASS"
        print_success "MFA enforcement tests: All validation passing"
        return 0
    else
        test_results["mfa-enforcement"]="FAIL"
        print_error "MFA enforcement tests: Critical MFA flows failing"
        return 1
    fi
}

# Function to run Postman API tests (critical subset)
run_postman_critical() {
    print_status "Running Critical Postman API Tests..."
    
    # Start API server for testing
    node __tests__/authz-comprehensive/setup/mock-api-server.js > /tmp/ci-api-server.log 2>&1 &
    local server_pid=$!
    sleep 3
    
    # Run only critical authorization tests
    if newman run __tests__/authz-comprehensive/postman/xpress-authz-api-tests.json \
        -e __tests__/authz-comprehensive/postman/environment.json \
        --folder "Setup & Authentication" \
        --folder "RBAC Permission Validation" \
        --folder "PII Masking & MFA Enforcement" \
        --reporters cli,json \
        --reporter-json-export /tmp/ci-newman.json \
        --bail \
        --silent 2>/dev/null; then
        
        test_results["postman-api"]="PASS"
        print_success "Postman API tests: Critical flows passing"
        kill $server_pid 2>/dev/null || true
        return 0
    else
        # Check if it's connection vs functional failure
        if grep -q "ECONNREFUSED" /tmp/ci-newman.json 2>/dev/null; then
            test_results["postman-api"]="RETRY"
            print_warning "Postman API tests: Connection issues (will retry)"
        else
            test_results["postman-api"]="FAIL"
            print_error "Postman API tests: Critical authorization failures detected"
        fi
        kill $server_pid 2>/dev/null || true
        return 1
    fi
}

# Function to run cross-region override tests
run_override_tests() {
    print_status "Running Cross-Region Override Tests..."
    
    if npm test -- __tests__/authz-comprehensive/unit/regional-access-control.test.ts --silent; then
        test_results["cross-region-override"]="PASS" 
        print_success "Cross-region override tests: All boundary checks passing"
        return 0
    else
        test_results["cross-region-override"]="FAIL"
        print_error "Cross-region override tests: Critical boundary violations"
        return 1
    fi
}

# Run all test suites
print_status "Executing Critical Authorization Test Suite..."
echo

# SQL Tests (must pass)
if ! run_sql_tests; then
    overall_status=1
fi

# Jest Tests (must pass)  
if ! run_jest_tests; then
    overall_status=1
fi

# MFA Tests (must pass)
if ! run_mfa_tests; then
    overall_status=1
fi

# Cross-region Tests (must pass)
if ! run_override_tests; then
    overall_status=1
fi

# Postman Tests (can retry once on connection issues)
if ! run_postman_critical; then
    if [[ "${test_results["postman-api"]}" == "RETRY" ]]; then
        print_status "Retrying Postman tests..."
        sleep 2
        if run_postman_critical; then
            test_results["postman-api"]="PASS"
        else
            overall_status=1
        fi
    else
        overall_status=1
    fi
fi

# Generate Results Summary
echo
print_status "Authorization Regression Gate Results"
print_status "===================================="

for suite in "${CRITICAL_TEST_SUITES[@]}"; do
    result="${test_results[$suite]}"
    case $result in
        "PASS")
            print_success "$suite: ✅ PASSED"
            ;;
        "FAIL")
            print_error "$suite: ❌ FAILED"
            ;;
        "RETRY")
            print_warning "$suite: ⚠️ CONNECTION ISSUES"
            ;;
        *)
            print_error "$suite: ❓ NOT RUN"
            overall_status=1
            ;;
    esac
done

echo
if [[ $overall_status -eq 0 ]]; then
    print_success "🎉 ALL CRITICAL AUTHORIZATION TESTS PASSED"
    print_success "Merge can proceed - no authorization regressions detected"
    
    # Log success for monitoring
    echo "$(date): AuthZ gate PASSED - all critical flows validated" >> /tmp/authz-gate.log
    
    exit 0
else
    print_error "🚫 AUTHORIZATION REGRESSION DETECTED"
    print_error "BLOCKING MERGE - fix authorization failures before proceeding"
    
    echo
    print_status "Failure Analysis:"
    echo "1. Review failed test outputs above"
    echo "2. Check for policy bundle hash mismatches" 
    echo "3. Validate MFA session requirements"
    echo "4. Verify cross-region override logic"
    echo "5. Ensure SQL RLS/DDM policies are intact"
    
    # Log failure for monitoring
    echo "$(date): AuthZ gate FAILED - authorization regressions detected" >> /tmp/authz-gate.log
    
    exit 1
fi