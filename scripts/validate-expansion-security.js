#!/usr/bin/env node

/**
 * Expansion Manager Security Validation Script
 * Ensures expansion_manager role cannot breach security boundaries
 * 
 * Usage: node scripts/validate-expansion-security.js
 * Exit codes: 0 = pass, 1 = security violation detected
 */

const fs = require('fs');
const path = require('path');

class ExpansionSecurityValidator {
  constructor() {
    this.violations = [];
    this.warnings = [];
  }

  validate() {
    console.log('🔐 Validating Expansion Manager Security Boundaries\n');

    this.validatePolicyBundle();
    this.validateAuthorizationLogic();
    this.validateDatabaseMigration();
    this.validateTestCoverage();

    this.printResults();
    return this.violations.length === 0;
  }

  validatePolicyBundle() {
    console.log('📋 Validating Policy Bundle...');
    
    try {
      const policy = require('../config/allowed-actions.json');
      
      // Check expansion_manager exists
      if (!policy.expansion_manager) {
        this.violations.push('expansion_manager role not found in policy bundle');
        return;
      }

      const expansionPerms = policy.expansion_manager;

      // Validate expansion_manager has exactly 10 permissions
      if (expansionPerms.length !== 10) {
        this.violations.push(`expansion_manager should have 10 permissions, found ${expansionPerms.length}`);
      }

      // Check forbidden permissions
      const forbidden = [
        'unmask_pii_with_mfa', 'manage_users', 'assign_roles',
        'approve_payroll', 'process_payments', 'access_hr_records',
        'modify_active_pricing', 'suspend_region', 'delete_region'
      ];

      const violations = forbidden.filter(perm => expansionPerms.includes(perm));
      if (violations.length > 0) {
        this.violations.push(`expansion_manager has forbidden permissions: ${violations.join(', ')}`);
      }

      // Check required permissions
      const required = [
        'create_region_request', 'promote_region_stage',
        'configure_prelaunch_pricing_flagged', 'handover_to_regional_manager'
      ];

      const missing = required.filter(perm => !expansionPerms.includes(perm));
      if (missing.length > 0) {
        this.violations.push(`expansion_manager missing required permissions: ${missing.join(', ')}`);
      }

      // Validate metadata
      if (!policy.metadata || policy.metadata.total_roles !== 14) {
        this.violations.push('Policy metadata not updated for expansion_manager (should be 14 total roles)');
      }

      console.log('  ✅ Policy bundle validation complete');
    } catch (error) {
      this.violations.push(`Policy bundle validation failed: ${error.message}`);
    }
  }

  validateAuthorizationLogic() {
    console.log('🛡️ Validating Authorization Logic...');

    try {
      const checksPath = path.join(__dirname, '../src/lib/auth/checks.ts');
      const checksContent = fs.readFileSync(checksPath, 'utf8');

      // Check expansionScopeOK function exists
      if (!checksContent.includes('export function expansionScopeOK')) {
        this.violations.push('expansionScopeOK function not found in checks.ts');
        return;
      }

      // Check for proper region state validation
      const regionStateChecks = [
        'prospect', 'pilot', 'active', 'suspended'
      ];

      regionStateChecks.forEach(state => {
        if (!checksContent.includes(state)) {
          this.warnings.push(`Region state '${state}' not found in expansion scope logic`);
        }
      });

      // Check for hardening patterns
      const hardeningPatterns = [
        'expansion_scope_violation',
        'destructive.*active.*suspended',
        'EXPANSION SCOPE VIOLATION'
      ];

      hardeningPatterns.forEach(pattern => {
        if (!checksContent.match(new RegExp(pattern, 'i'))) {
          this.warnings.push(`Security hardening pattern '${pattern}' not found`);
        }
      });

      console.log('  ✅ Authorization logic validation complete');
    } catch (error) {
      this.violations.push(`Authorization logic validation failed: ${error.message}`);
    }
  }

  validateDatabaseMigration() {
    console.log('🗄️ Validating Database Migration...');

    try {
      const migrationPath = path.join(__dirname, '../database/migrations/008_add_expansion_manager.sql');
      const migrationContent = fs.readFileSync(migrationPath, 'utf8');

      // Check role creation
      if (!migrationContent.includes("'expansion_manager'")) {
        this.violations.push('expansion_manager role not created in migration');
      }

      if (!migrationContent.includes('level.*45')) {
        this.violations.push('expansion_manager level not set to 45');
      }

      // Check region_state column
      if (!migrationContent.includes('region_state')) {
        this.violations.push('region_state column not added');
      }

      // Check audit tables
      const auditTables = [
        'region_state_transitions',
        'dual_control_approvals'
      ];

      auditTables.forEach(table => {
        if (!migrationContent.includes(table)) {
          this.violations.push(`Audit table '${table}' not created`);
        }
      });

      console.log('  ✅ Database migration validation complete');
    } catch (error) {
      this.violations.push(`Database migration validation failed: ${error.message}`);
    }
  }

  validateTestCoverage() {
    console.log('🧪 Validating Test Coverage...');

    try {
      const testPath = path.join(__dirname, '../__tests__/authz-comprehensive/postman/xpress-authz-api-tests.json');
      const testContent = fs.readFileSync(testPath, 'utf8');
      const testData = JSON.parse(testContent);

      // Find expansion manager tests
      const expansionTests = this.findExpansionTests(testData);
      
      if (expansionTests.length < 5) {
        this.violations.push(`Expected 5 expansion tests (T-11 to T-15), found ${expansionTests.length}`);
      }

      // Check for required test scenarios
      const requiredScenarios = [
        'Create Region Request',
        'PII Unmask Denied', 
        'Configure Prelaunch Pricing',
        'Active Region Access Denied',
        'Promote Region Stage'
      ];

      requiredScenarios.forEach(scenario => {
        const found = expansionTests.some(test => 
          test.name.includes(scenario)
        );
        
        if (!found) {
          this.violations.push(`Test scenario '${scenario}' not found`);
        }
      });

      console.log('  ✅ Test coverage validation complete');
    } catch (error) {
      this.violations.push(`Test coverage validation failed: ${error.message}`);
    }
  }

  findExpansionTests(testData, tests = []) {
    if (testData.item) {
      // Collection item
      testData.item.forEach(item => {
        if (item.name && item.name.includes('Expansion Manager')) {
          tests.push(item);
        }
        if (item.item) {
          this.findExpansionTests(item, tests);
        }
      });
    }
    return tests;
  }

  printResults() {
    console.log('\n📊 Validation Results');
    console.log('====================');

    if (this.violations.length === 0) {
      console.log('✅ All security validations passed');
    } else {
      console.log('❌ Security violations detected:');
      this.violations.forEach(violation => {
        console.log(`  • ${violation}`);
      });
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      this.warnings.forEach(warning => {
        console.log(`  • ${warning}`);
      });
    }

    console.log(`\n📈 Summary: ${this.violations.length} violations, ${this.warnings.length} warnings`);
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new ExpansionSecurityValidator();
  const passed = validator.validate();
  process.exit(passed ? 0 : 1);
}

module.exports = ExpansionSecurityValidator;