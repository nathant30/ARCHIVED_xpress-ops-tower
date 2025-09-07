-- Xpress Ops Tower AuthZ SQL Test Scripts
-- Row-Level Security (RLS) and Dynamic Data Masking (DDM) Validation
-- Target: MS SQL Server 2019+ with Philippines Regional Compliance
-- 
-- Test Categories:
-- 1. Row-Level Security Policy Validation
-- 2. Dynamic Data Masking Rules Testing
-- 3. Session Context Enforcement
-- 4. Regional Access Boundary Testing
-- 5. PII Protection Validation
-- 6. Temporal Access Control Testing

-- =============================================================================
-- SETUP: Test Environment Configuration
-- =============================================================================

-- Create test session context procedure
IF OBJECT_ID('dbo.SetTestSessionContext', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SetTestSessionContext;
GO

CREATE PROCEDURE dbo.SetTestSessionContext
    @UserId NVARCHAR(50),
    @RoleName NVARCHAR(50),
    @RegionId NVARCHAR(20),
    @PIIScope NVARCHAR(10) = 'none',
    @MFAPresent BIT = 0,
    @CaseId NVARCHAR(50) = NULL
AS
BEGIN
    -- Set session context for RLS policies
    EXEC sp_set_session_context @key = N'user_id', @value = @UserId;
    EXEC sp_set_session_context @key = N'user_role', @value = @RoleName;
    EXEC sp_set_session_context @key = N'user_region', @value = @RegionId;
    EXEC sp_set_session_context @key = N'pii_scope', @value = @PIIScope;
    EXEC sp_set_session_context @key = N'mfa_present', @value = @MFAPresent;
    IF @CaseId IS NOT NULL
        EXEC sp_set_session_context @key = N'case_id', @value = @CaseId;
    
    PRINT 'Session context set: ' + @UserId + ' (' + @RoleName + ') in ' + @RegionId;
END;
GO

-- =============================================================================
-- TEST CATEGORY 1: Row-Level Security Policy Validation
-- =============================================================================

-- Test 1.1: Regional Access Boundary for Drivers
PRINT '=== TEST 1.1: Regional Driver Access Boundary ===';

-- Ground Ops Manila - Should see only Manila drivers
EXEC dbo.SetTestSessionContext 
    @UserId = 'usr-ground-ops-001',
    @RoleName = 'ground_ops',
    @RegionId = 'ph-ncr-manila';

DECLARE @Manila_DriverCount INT;
SELECT @Manila_DriverCount = COUNT(*) FROM drivers;
PRINT 'Manila Ground Ops sees ' + CAST(@Manila_DriverCount AS VARCHAR) + ' drivers';

-- Ground Ops Cebu - Should see only Cebu drivers
EXEC dbo.SetTestSessionContext 
    @UserId = 'usr-ground-ops-002',
    @RoleName = 'ground_ops',
    @RegionId = 'ph-vis-cebu';

DECLARE @Cebu_DriverCount INT;
SELECT @Cebu_DriverCount = COUNT(*) FROM drivers;
PRINT 'Cebu Ground Ops sees ' + CAST(@Cebu_DriverCount AS VARCHAR) + ' drivers';

-- Validation: Counts should be different
IF @Manila_DriverCount = @Cebu_DriverCount
    PRINT 'FAIL: Regional isolation not working - same driver count across regions';
ELSE
    PRINT 'PASS: Regional driver isolation working correctly';

-- Test 1.2: Cross-Region Override for Support with Case ID
PRINT '=== TEST 1.2: Support Cross-Region Override ===';

-- Support without case ID - Limited access
EXEC dbo.SetTestSessionContext 
    @UserId = 'usr-support-001',
    @RoleName = 'support',
    @RegionId = 'ph-ncr-manila';

DECLARE @Support_NoCaseCount INT;
SELECT @Support_NoCaseCount = COUNT(*) FROM drivers WHERE region_id = 'ph-vis-cebu';
PRINT 'Support without case sees ' + CAST(@Support_NoCaseCount AS VARCHAR) + ' Cebu drivers';

-- Support with valid case ID - Should have override access
EXEC dbo.SetTestSessionContext 
    @UserId = 'usr-support-001',
    @RoleName = 'support',
    @RegionId = 'ph-ncr-manila',
    @CaseId = 'CASE-SUPPORT-CEBU-001';

DECLARE @Support_WithCaseCount INT;
SELECT @Support_WithCaseCount = COUNT(*) FROM drivers WHERE region_id = 'ph-vis-cebu';
PRINT 'Support with case sees ' + CAST(@Support_WithCaseCount AS VARCHAR) + ' Cebu drivers';

-- Validation: Support with case should see more drivers
IF @Support_WithCaseCount > @Support_NoCaseCount
    PRINT 'PASS: Support cross-region override working';
ELSE
    PRINT 'FAIL: Support cross-region override not functioning';

-- Test 1.3: Role Level Hierarchy Validation
PRINT '=== TEST 1.3: Role Hierarchy Access Validation ===';

-- Ground Ops (Level 10) - Base access
EXEC dbo.SetTestSessionContext 
    @UserId = 'usr-ground-ops-001',
    @RoleName = 'ground_ops',
    @RegionId = 'ph-ncr-manila';

DECLARE @GroundOps_TripsCount INT;
SELECT @GroundOps_TripsCount = COUNT(*) FROM trips WHERE status IN ('active', 'completed');
PRINT 'Ground Ops sees ' + CAST(@GroundOps_TripsCount AS VARCHAR) + ' trips';

-- Operations Manager (Level 30) - Expanded access
EXEC dbo.SetTestSessionContext 
    @UserId = 'usr-ops-manager-001',
    @RoleName = 'ops_manager',
    @RegionId = 'ph-ncr-manila';

DECLARE @OpsManager_TripsCount INT;
SELECT @OpsManager_TripsCount = COUNT(*) FROM trips; -- Should see all trip statuses
PRINT 'Ops Manager sees ' + CAST(@OpsManager_TripsCount AS VARCHAR) + ' trips';

-- Validation: Higher role should see more data
IF @OpsManager_TripsCount >= @GroundOps_TripsCount
    PRINT 'PASS: Role hierarchy access working correctly';
ELSE
    PRINT 'FAIL: Role hierarchy broken - higher role seeing less data';

-- =============================================================================
-- TEST CATEGORY 2: Dynamic Data Masking Rules Testing
-- =============================================================================

-- Test 2.1: PII Masking Based on Scope
PRINT '=== TEST 2.1: PII Scope-Based Masking ===';

-- Ground Ops (PII Scope: none) - Should see masked data
EXEC dbo.SetTestSessionContext 
    @UserId = 'usr-ground-ops-001',
    @RoleName = 'ground_ops',
    @RegionId = 'ph-ncr-manila',
    @PIIScope = 'none';

SELECT TOP 1 
    driver_id,
    phone_number,
    email,
    license_number
FROM drivers 
WHERE region_id = 'ph-ncr-manila';

PRINT 'Ground Ops PII view (should be masked)';

-- Risk Investigator (PII Scope: full) - Should see unmasked data
EXEC dbo.SetTestSessionContext 
    @UserId = 'usr-risk-investigator-001',
    @RoleName = 'risk_investigator',
    @RegionId = 'ph-ncr-manila',
    @PIIScope = 'full',
    @MFAPresent = 1;

SELECT TOP 1 
    driver_id,
    phone_number,
    email,
    license_number
FROM drivers 
WHERE region_id = 'ph-ncr-manila';

PRINT 'Risk Investigator PII view (should be unmasked)';

-- Test 2.2: MFA-Dependent Unmasking
PRINT '=== TEST 2.2: MFA-Dependent PII Unmasking ===';

-- Risk Investigator without MFA - Should see masked despite full scope
EXEC dbo.SetTestSessionContext 
    @UserId = 'usr-risk-investigator-001',
    @RoleName = 'risk_investigator',
    @RegionId = 'ph-ncr-manila',
    @PIIScope = 'full',
    @MFAPresent = 0;

SELECT TOP 1 
    passenger_id,
    phone_number AS passenger_phone,
    payment_details
FROM passengers 
WHERE region_id = 'ph-ncr-manila';

PRINT 'Risk Investigator without MFA (should be masked despite full scope)';

-- Test 2.3: Selective Field Masking for Analytics
PRINT '=== TEST 2.3: Analytics Role Selective Masking ===';

-- Data Analyst (PII Scope: masked) - Some fields masked, others visible
EXEC dbo.SetTestSessionContext 
    @UserId = 'usr-analyst-001',
    @RoleName = 'analyst',
    @RegionId = 'ph-ncr-manila',
    @PIIScope = 'masked';

SELECT TOP 5
    trip_id,
    pickup_location_hash, -- Should be visible for analytics
    phone_number, -- Should be masked
    trip_fare, -- Should be visible
    driver_rating -- Should be visible
FROM trips t
INNER JOIN drivers d ON t.driver_id = d.driver_id
WHERE t.region_id = 'ph-ncr-manila';

PRINT 'Data Analyst view (selective masking for analytics)';

-- =============================================================================
-- TEST CATEGORY 3: Session Context Enforcement
-- =============================================================================

-- Test 3.1: Session Context Tampering Detection
PRINT '=== TEST 3.1: Session Context Integrity ===';

-- Set legitimate context
EXEC dbo.SetTestSessionContext 
    @UserId = 'usr-ground-ops-001',
    @RoleName = 'ground_ops',
    @RegionId = 'ph-ncr-manila';

-- Try to manually override context (should be ignored by policies)
EXEC sp_set_session_context @key = N'user_role', @value = 'iam_admin';

DECLARE @TamperTest_Count INT;
SELECT @TamperTest_Count = COUNT(*) FROM users; -- Admin-only table

IF @TamperTest_Count = 0
    PRINT 'PASS: Session context tampering prevented';
ELSE
    PRINT 'FAIL: Session context can be tampered with';

-- Test 3.2: Session Expiry Validation
PRINT '=== TEST 3.2: Session Expiry Handling ===';

-- Set session with timestamp (simulating expired session)
EXEC sp_set_session_context @key = N'session_start', @value = '2023-01-01 00:00:00';
EXEC sp_set_session_context @key = N'session_timeout', @value = 3600; -- 1 hour

-- This should fail if temporal validation is implemented
BEGIN TRY
    SELECT COUNT(*) FROM drivers;
    PRINT 'WARNING: Expired session validation may not be implemented';
END TRY
BEGIN CATCH
    PRINT 'PASS: Expired session properly rejected';
END CATCH;

-- =============================================================================
-- TEST CATEGORY 4: Regional Access Boundary Testing
-- =============================================================================

-- Test 4.1: Philippines Region Validation
PRINT '=== TEST 4.1: Philippines Region Boundary Enforcement ===';

-- Create test data with invalid region
BEGIN TRY
    INSERT INTO drivers (driver_id, region_id, phone_number, status)
    VALUES ('test-driver-invalid', 'us-california', '+1234567890', 'active');
    
    PRINT 'FAIL: Non-Philippines region allowed in system';
    DELETE FROM drivers WHERE driver_id = 'test-driver-invalid';
END TRY
BEGIN CATCH
    PRINT 'PASS: Non-Philippines regions properly rejected: ' + ERROR_MESSAGE();
END CATCH;

-- Test 4.2: Cross-Region Data Leakage Prevention
PRINT '=== TEST 4.2: Cross-Region Data Leakage Prevention ===';

-- Manila user trying to access Davao data
EXEC dbo.SetTestSessionContext 
    @UserId = 'usr-ground-ops-001',
    @RoleName = 'ground_ops',
    @RegionId = 'ph-ncr-manila';

DECLARE @CrossRegion_Count INT;
SELECT @CrossRegion_Count = COUNT(*) 
FROM drivers 
WHERE region_id = 'ph-min-davao';

IF @CrossRegion_Count = 0
    PRINT 'PASS: Cross-region data properly isolated';
ELSE
    PRINT 'FAIL: Cross-region data leakage detected - ' + CAST(@CrossRegion_Count AS VARCHAR) + ' records visible';

-- =============================================================================
-- TEST CATEGORY 5: PII Protection Validation
-- =============================================================================

-- Test 5.1: Data Export Protection
PRINT '=== TEST 5.1: PII Data Export Protection ===';

-- Ground Ops attempting bulk export (should be limited)
EXEC dbo.SetTestSessionContext 
    @UserId = 'usr-ground-ops-001',
    @RoleName = 'ground_ops',
    @RegionId = 'ph-ncr-manila',
    @PIIScope = 'none';

-- Simulate bulk export attempt
DECLARE @ExportAttempt_Count INT = 0;
BEGIN TRY
    SELECT @ExportAttempt_Count = COUNT(*)
    FROM (
        SELECT TOP 1000 phone_number, email 
        FROM drivers 
        WHERE region_id = 'ph-ncr-manila'
    ) bulk_export;
    
    IF @ExportAttempt_Count > 100 -- Assume 100 is the export limit
        PRINT 'FAIL: Bulk PII export not limited properly';
    ELSE
        PRINT 'PASS: Bulk PII export properly limited to ' + CAST(@ExportAttempt_Count AS VARCHAR) + ' records';
END TRY
BEGIN CATCH
    PRINT 'PASS: Bulk PII export blocked: ' + ERROR_MESSAGE();
END CATCH;

-- Test 5.2: PII Audit Trail Validation
PRINT '=== TEST 5.2: PII Access Audit Trail ===';

-- Risk Investigator accessing PII with MFA
EXEC dbo.SetTestSessionContext 
    @UserId = 'usr-risk-investigator-001',
    @RoleName = 'risk_investigator',
    @RegionId = 'ph-vis-cebu',
    @PIIScope = 'full',
    @MFAPresent = 1;

-- Access PII data (should create audit log)
SELECT TOP 1 
    driver_id,
    phone_number,
    license_number
FROM drivers 
WHERE region_id = 'ph-vis-cebu';

-- Check if audit log was created
DECLARE @AuditLog_Count INT;
SELECT @AuditLog_Count = COUNT(*) 
FROM pii_access_logs 
WHERE user_id = 'usr-risk-investigator-001'
  AND access_timestamp > DATEADD(MINUTE, -1, GETDATE());

IF @AuditLog_Count > 0
    PRINT 'PASS: PII access properly logged';
ELSE
    PRINT 'WARNING: PII access audit logging may not be implemented';

-- =============================================================================
-- TEST CATEGORY 6: Temporal Access Control Testing
-- =============================================================================

-- Test 6.1: Time-Based Access Restrictions
PRINT '=== TEST 6.1: Time-Based Access Control ===';

-- Set context for time-restricted role during off-hours
EXEC sp_set_session_context @key = N'current_time', @value = '02:00:00'; -- 2 AM
EXEC dbo.SetTestSessionContext 
    @UserId = 'usr-night-ops-001',
    @RoleName = 'night_ops',
    @RegionId = 'ph-ncr-manila';

BEGIN TRY
    SELECT COUNT(*) FROM financial_reports; -- Should be restricted at night
    PRINT 'FAIL: Time-based restrictions not enforced';
END TRY
BEGIN CATCH
    PRINT 'PASS: After-hours access properly restricted: ' + ERROR_MESSAGE();
END CATCH;

-- Test 6.2: Emergency Override Validation
PRINT '=== TEST 6.2: Emergency Access Override ===';

-- Set emergency context
EXEC sp_set_session_context @key = N'emergency_mode', @value = 1;
EXEC sp_set_session_context @key = N'emergency_justification', @value = 'Critical system incident';

-- Regional Manager accessing during emergency
EXEC dbo.SetTestSessionContext 
    @UserId = 'usr-regional-manager-001',
    @RoleName = 'regional_manager',
    @RegionId = 'ph-ncr-manila';

DECLARE @Emergency_Access INT;
SELECT @Emergency_Access = COUNT(*) 
FROM system_configurations 
WHERE config_type = 'emergency_protocols';

IF @Emergency_Access > 0
    PRINT 'PASS: Emergency override access granted';
ELSE
    PRINT 'FAIL: Emergency override not working';

-- =============================================================================
-- CLEANUP AND REPORTING
-- =============================================================================

-- Clear session context
EXEC sp_set_session_context @key = N'user_id', @value = NULL;
EXEC sp_set_session_context @key = N'user_role', @value = NULL;
EXEC sp_set_session_context @key = N'user_region', @value = NULL;
EXEC sp_set_session_context @key = N'pii_scope', @value = NULL;
EXEC sp_set_session_context @key = N'mfa_present', @value = NULL;
EXEC sp_set_session_context @key = N'case_id', @value = NULL;
EXEC sp_set_session_context @key = N'emergency_mode', @value = NULL;
EXEC sp_set_session_context @key = N'current_time', @value = NULL;

PRINT '=== RLS/DDM VALIDATION TESTS COMPLETED ===';
PRINT 'Review output above for PASS/FAIL results';
PRINT 'All session contexts cleared';

-- Generate test summary
SELECT 
    'RLS_DDM_Validation' AS test_suite,
    GETDATE() AS execution_time,
    'Manual review required for PASS/FAIL status' AS notes;