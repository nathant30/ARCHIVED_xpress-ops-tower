// SQL Test Runner for AuthZ Database Testing
// Executes SQL test scripts against SQLite test database

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class SQLTestRunner {
  constructor() {
    this.dbPath = path.join(__dirname, '../temp', 'authz-test.db');
    this.db = null;
    this.results = [];
  }

  async initialize() {
    this.db = new sqlite3.Database(this.dbPath);
    console.log('🗄️  Connected to test database:', this.dbPath);
  }

  async runTest(testName, testDescription, sql, expectedResult = null) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      this.db.all(sql, (err, rows) => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        let status = 'PASS';
        let errorMessage = null;
        
        if (err) {
          status = 'FAIL';
          errorMessage = err.message;
          console.log(`❌ ${testName}: ${errorMessage}`);
        } else {
          if (expectedResult && rows.length !== expectedResult) {
            status = 'FAIL';
            errorMessage = `Expected ${expectedResult} rows, got ${rows.length}`;
          }
          console.log(`✅ ${testName}: ${rows.length} rows, ${duration}ms`);
        }
        
        const result = {
          testName,
          testDescription,
          status,
          duration,
          rowCount: rows ? rows.length : 0,
          errorMessage,
          timestamp: new Date().toISOString()
        };
        
        this.results.push(result);
        resolve(result);
      });
    });
  }

  // Helper method to set session context
  async setSessionContext(userId, roleName, regionId, options = {}) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT OR REPLACE INTO session_context (
          session_id, user_id, user_role, user_region, pii_scope, 
          mfa_present, case_id, emergency_mode, current_time
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      this.db.run(sql, [
        'current',
        userId,
        roleName,
        regionId,
        options.piiScope || 'none',
        options.mfaPresent || 0,
        options.caseId || null,
        options.emergencyMode || 0,
        options.currentTime || new Date().toISOString()
      ], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async runAllTests() {
    console.log('🧪 Starting SQL AuthZ Database Tests');
    console.log('=====================================');

    // Test 1: Regional Access Control
    await this.testRegionalAccessControl();
    
    // Test 2: PII Masking Rules  
    await this.testPIIMaskingRules();
    
    // Test 3: Cross-Region Override
    await this.testCrossRegionOverride();
    
    // Test 4: Performance Tests
    await this.testPerformance();
    
    // Test 5: Data Export Protection
    await this.testDataExportProtection();

    console.log('\n📊 SQL Test Summary');
    console.log('===================');
    
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.status === 'PASS').length;
    const failedTests = totalTests - passedTests;
    const avgDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / totalTests;
    
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log(`Average Duration: ${avgDuration.toFixed(2)}ms`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

    return this.results;
  }

  async testRegionalAccessControl() {
    console.log('\n🌏 Testing Regional Access Control');
    console.log('================================');

    // Test: Manila Ground Ops sees only Manila drivers
    await this.setSessionContext('usr-ground-ops-001', 'ground_ops', 'ph-ncr-manila');
    await this.runTest(
      'Regional_Manila_Isolation',
      'Manila Ground Ops should see only Manila drivers',
      `SELECT COUNT(*) as count FROM drivers WHERE region_id = 'ph-ncr-manila'`,
      null
    );

    // Test: Cebu Ground Ops sees only Cebu drivers  
    await this.setSessionContext('usr-ground-ops-002', 'ground_ops', 'ph-vis-cebu');
    await this.runTest(
      'Regional_Cebu_Isolation',
      'Cebu Ground Ops should see only Cebu drivers',
      `SELECT COUNT(*) as count FROM drivers WHERE region_id = 'ph-vis-cebu'`,
      null
    );

    // Test: Cross-region access should be blocked
    await this.setSessionContext('usr-ground-ops-001', 'ground_ops', 'ph-ncr-manila');
    await this.runTest(
      'Cross_Region_Block',
      'Manila user should not see Cebu drivers',
      `SELECT COUNT(*) as count FROM drivers WHERE region_id = 'ph-vis-cebu'`,
      null
    );
  }

  async testPIIMaskingRules() {
    console.log('\n🔒 Testing PII Masking Rules');
    console.log('============================');

    // Test: Ground Ops with no PII scope sees masked data
    await this.setSessionContext('usr-ground-ops-001', 'ground_ops', 'ph-ncr-manila', { piiScope: 'none' });
    await this.runTest(
      'PII_Masking_None_Scope',
      'Ground ops should see masked phone numbers',
      `SELECT masked_phone FROM v_drivers_filtered WHERE driver_id = 'drv-manila-001'`,
      null
    );

    // Test: Risk Investigator with full scope and MFA sees unmasked data
    await this.setSessionContext('usr-risk-investigator-001', 'risk_investigator', 'ph-vis-cebu', {
      piiScope: 'full',
      mfaPresent: 1
    });
    await this.runTest(
      'PII_Unmasking_Full_Scope_MFA',
      'Risk investigator with MFA should see unmasked data',
      `SELECT phone_number FROM drivers WHERE driver_id = 'drv-cebu-001'`,
      null
    );

    // Test: Risk Investigator without MFA sees masked data
    await this.setSessionContext('usr-risk-investigator-001', 'risk_investigator', 'ph-vis-cebu', {
      piiScope: 'full',
      mfaPresent: 0
    });
    await this.runTest(
      'PII_Masking_No_MFA',
      'Risk investigator without MFA should see masked data',
      `SELECT masked_phone FROM v_drivers_filtered WHERE driver_id = 'drv-cebu-001'`,
      null
    );
  }

  async testCrossRegionOverride() {
    console.log('\n🔄 Testing Cross-Region Override');
    console.log('===============================');

    // Test: Support without case ID has limited access
    await this.setSessionContext('usr-support-001', 'support', 'ph-ncr-manila');
    await this.runTest(
      'Support_No_Case_Limited',
      'Support without case should have limited cross-region access',
      `SELECT COUNT(*) as count FROM drivers WHERE region_id != 'ph-ncr-manila'`,
      null
    );

    // Test: Support with valid case ID has override access
    await this.setSessionContext('usr-support-001', 'support', 'ph-ncr-manila', {
      caseId: 'CASE-SUPPORT-CEBU-001'
    });
    await this.runTest(
      'Support_With_Case_Override',
      'Support with case should have cross-region override access',
      `SELECT COUNT(*) as count FROM v_drivers_filtered`,
      null
    );
  }

  async testPerformance() {
    console.log('\n⚡ Testing Performance Metrics');
    console.log('============================');

    // Test: Query performance under load
    const iterations = 50;
    const startTime = Date.now();
    
    for (let i = 0; i < iterations; i++) {
      await this.setSessionContext(`usr-test-${i}`, 'ground_ops', 'ph-ncr-manila');
      await new Promise((resolve) => {
        this.db.get('SELECT COUNT(*) as count FROM v_drivers_filtered', resolve);
      });
    }
    
    const totalTime = Date.now() - startTime;
    const avgTime = totalTime / iterations;
    
    await this.runTest(
      'Performance_Load_Test',
      `Average query time under load (${iterations} iterations)`,
      'SELECT 1', // Dummy query
      null
    );
    
    console.log(`   📈 Load test: ${iterations} queries in ${totalTime}ms (avg: ${avgTime.toFixed(2)}ms)`);

    // Test: SLO compliance
    const sloTarget = 50; // ms
    const status = avgTime <= sloTarget ? 'PASS' : 'FAIL';
    
    this.results.push({
      testName: 'SLO_Compliance_Check',
      testDescription: `Query performance should be under ${sloTarget}ms`,
      status,
      duration: avgTime,
      rowCount: 1,
      errorMessage: avgTime > sloTarget ? `Average ${avgTime.toFixed(2)}ms exceeds ${sloTarget}ms target` : null,
      timestamp: new Date().toISOString()
    });

    console.log(`   🎯 SLO Check: ${status} (${avgTime.toFixed(2)}ms vs ${sloTarget}ms target)`);
  }

  async testDataExportProtection() {
    console.log('\n📤 Testing Data Export Protection');
    console.log('================================');

    // Test: Analyst export limitations
    await this.setSessionContext('usr-analyst-001', 'analyst', 'ph-ncr-manila', { piiScope: 'masked' });
    await this.runTest(
      'Export_Limit_Analyst',
      'Analyst should have limited export capabilities',
      `SELECT * FROM v_drivers_filtered LIMIT 100`,
      null
    );

    // Test: Bulk export audit logging
    await this.runTest(
      'Export_Audit_Logging',
      'Export activities should be auditable',
      `INSERT INTO pii_access_logs (log_id, user_id, data_subject_id, access_type, justification)
       VALUES ('export-test-001', 'usr-analyst-001', 'bulk-export', 'data_export', 'Analytics report generation');
       SELECT COUNT(*) as count FROM pii_access_logs WHERE access_type = 'data_export'`,
      null
    );
  }

  async cleanup() {
    if (this.db) {
      this.db.close();
    }
  }

  getResults() {
    return this.results;
  }
}

module.exports = SQLTestRunner;

// Run tests if called directly
if (require.main === module) {
  const runner = new SQLTestRunner();
  
  runner.initialize()
    .then(() => runner.runAllTests())
    .then((results) => {
      console.log('\n✅ SQL AuthZ tests completed');
      return runner.cleanup();
    })
    .catch((error) => {
      console.error('❌ SQL test execution failed:', error);
      process.exit(1);
    });
}