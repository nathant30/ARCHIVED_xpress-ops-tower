-- Xpress Ops Tower AuthZ Performance & Stress Testing
-- Database: MS SQL Server 2019+ 
-- Focus: RLS/DDM Performance Under Load, Concurrent Access Testing
-- SLO Target: Policy evaluation <50ms, 99.9% consistency

-- =============================================================================
-- SETUP: Performance Test Infrastructure
-- =============================================================================

-- Create performance monitoring table
IF OBJECT_ID('dbo.authz_performance_metrics', 'U') IS NOT NULL
    DROP TABLE dbo.authz_performance_metrics;

CREATE TABLE dbo.authz_performance_metrics (
    test_id UNIQUEIDENTIFIER DEFAULT NEWID(),
    test_category VARCHAR(50),
    operation_type VARCHAR(100),
    start_time DATETIME2,
    end_time DATETIME2,
    duration_ms AS DATEDIFF(MILLISECOND, start_time, end_time),
    rows_processed INT,
    user_context VARCHAR(100),
    region_id VARCHAR(20),
    success_flag BIT DEFAULT 1,
    error_message VARCHAR(500)
);

-- Performance test helper procedure
IF OBJECT_ID('dbo.RunPerformanceTest', 'P') IS NOT NULL
    DROP PROCEDURE dbo.RunPerformanceTest;
GO

CREATE PROCEDURE dbo.RunPerformanceTest
    @TestCategory VARCHAR(50),
    @OperationType VARCHAR(100),
    @UserId VARCHAR(50),
    @RoleName VARCHAR(50),
    @RegionId VARCHAR(20),
    @TestQuery NVARCHAR(MAX),
    @IterationCount INT = 100
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @i INT = 1;
    DECLARE @StartTime DATETIME2;
    DECLARE @EndTime DATETIME2;
    DECLARE @RowsProcessed INT;
    DECLARE @TestId UNIQUEIDENTIFIER;
    
    WHILE @i <= @IterationCount
    BEGIN
        SET @TestId = NEWID();
        
        -- Set session context
        EXEC sp_set_session_context @key = N'user_id', @value = @UserId;
        EXEC sp_set_session_context @key = N'user_role', @value = @RoleName;
        EXEC sp_set_session_context @key = N'user_region', @value = @RegionId;
        
        BEGIN TRY
            SET @StartTime = SYSDATETIME();
            
            -- Execute test query
            EXEC sp_executesql @TestQuery, N'@RowCount INT OUTPUT', @RowCount = @RowsProcessed OUTPUT;
            
            SET @EndTime = SYSDATETIME();
            
            -- Log performance metrics
            INSERT INTO dbo.authz_performance_metrics 
            (test_id, test_category, operation_type, start_time, end_time, rows_processed, user_context, region_id, success_flag)
            VALUES 
            (@TestId, @TestCategory, @OperationType, @StartTime, @EndTime, @RowsProcessed, 
             @UserId + '(' + @RoleName + ')', @RegionId, 1);
             
        END TRY
        BEGIN CATCH
            SET @EndTime = SYSDATETIME();
            
            INSERT INTO dbo.authz_performance_metrics 
            (test_id, test_category, operation_type, start_time, end_time, rows_processed, user_context, region_id, success_flag, error_message)
            VALUES 
            (@TestId, @TestCategory, @OperationType, @StartTime, @EndTime, 0, 
             @UserId + '(' + @RoleName + ')', @RegionId, 0, ERROR_MESSAGE());
        END CATCH;
        
        SET @i = @i + 1;
    END;
END;
GO

-- =============================================================================
-- TEST CATEGORY 1: RLS Policy Evaluation Performance
-- =============================================================================

PRINT '=== PERFORMANCE TEST 1: RLS Policy Evaluation ===';

-- Test 1.1: Driver Query Performance Across Roles
EXEC dbo.RunPerformanceTest
    @TestCategory = 'RLS_Performance',
    @OperationType = 'GroundOps_DriverQuery',
    @UserId = 'usr-ground-ops-001',
    @RoleName = 'ground_ops',
    @RegionId = 'ph-ncr-manila',
    @TestQuery = N'SELECT @RowCount = COUNT(*) FROM drivers WHERE region_id = ''ph-ncr-manila'' AND status = ''active''',
    @IterationCount = 200;

-- Test 1.2: Regional Manager Cross-Region Query
EXEC dbo.RunPerformanceTest
    @TestCategory = 'RLS_Performance',
    @OperationType = 'RegionalManager_CrossRegionQuery',
    @UserId = 'usr-regional-manager-001',
    @RoleName = 'regional_manager',
    @RegionId = 'ph-ncr-manila',
    @TestQuery = N'SELECT @RowCount = COUNT(*) FROM trips WHERE created_at > DATEADD(DAY, -7, GETDATE())',
    @IterationCount = 150;

-- Test 1.3: Support Cross-Region Override Performance
EXEC dbo.RunPerformanceTest
    @TestCategory = 'RLS_Performance',
    @OperationType = 'Support_CrossRegionOverride',
    @UserId = 'usr-support-001',
    @RoleName = 'support',
    @RegionId = 'ph-ncr-manila',
    @TestQuery = N'
        EXEC sp_set_session_context @key = N''case_id'', @value = ''CASE-PERF-TEST-001'';
        SELECT @RowCount = COUNT(*) FROM drivers WHERE region_id != ''ph-ncr-manila''',
    @IterationCount = 100;

-- =============================================================================
-- TEST CATEGORY 2: DDM Performance Under Load
-- =============================================================================

PRINT '=== PERFORMANCE TEST 2: Dynamic Data Masking Performance ===';

-- Test 2.1: PII Masking Performance for High-Volume Queries
EXEC dbo.RunPerformanceTest
    @TestCategory = 'DDM_Performance',
    @OperationType = 'PIIMasking_HighVolume',
    @UserId = 'usr-analyst-001',
    @RoleName = 'analyst',
    @RegionId = 'ph-ncr-manila',
    @TestQuery = N'
        EXEC sp_set_session_context @key = N''pii_scope'', @value = ''masked'';
        SELECT @RowCount = COUNT(*) FROM 
        (SELECT TOP 5000 phone_number, email FROM drivers WHERE region_id = ''ph-ncr-manila'') masked_data',
    @IterationCount = 50;

-- Test 2.2: MFA-Dependent Unmasking Performance
EXEC dbo.RunPerformanceTest
    @TestCategory = 'DDM_Performance',
    @OperationType = 'MFA_PIIUnmasking',
    @UserId = 'usr-risk-investigator-001',
    @RoleName = 'risk_investigator',
    @RegionId = 'ph-vis-cebu',
    @TestQuery = N'
        EXEC sp_set_session_context @key = N''pii_scope'', @value = ''full'';
        EXEC sp_set_session_context @key = N''mfa_present'', @value = 1;
        SELECT @RowCount = COUNT(*) FROM 
        (SELECT TOP 1000 phone_number, license_number FROM drivers WHERE region_id = ''ph-vis-cebu'') unmasked_pii',
    @IterationCount = 75;

-- =============================================================================
-- TEST CATEGORY 3: Concurrent Access Stress Testing
-- =============================================================================

PRINT '=== PERFORMANCE TEST 3: Concurrent Access Patterns ===';

-- Test 3.1: Multiple Ground Ops Concurrent Access
-- Simulate concurrent operations during peak hours
DECLARE @ConcurrentTest1 DATETIME2 = SYSDATETIME();

-- Execute multiple queries simultaneously (simulated with rapid succession)
EXEC dbo.RunPerformanceTest
    @TestCategory = 'Concurrent_Access',
    @OperationType = 'MultipleGroundOps_Manila',
    @UserId = 'usr-ground-ops-001',
    @RoleName = 'ground_ops',
    @RegionId = 'ph-ncr-manila',
    @TestQuery = N'SELECT @RowCount = COUNT(*) FROM drivers WHERE status = ''available'' AND region_id = ''ph-ncr-manila''',
    @IterationCount = 300;

EXEC dbo.RunPerformanceTest
    @TestCategory = 'Concurrent_Access',
    @OperationType = 'MultipleGroundOps_Cebu',
    @UserId = 'usr-ground-ops-002',
    @RoleName = 'ground_ops',
    @RegionId = 'ph-vis-cebu',
    @TestQuery = N'SELECT @RowCount = COUNT(*) FROM drivers WHERE status = ''available'' AND region_id = ''ph-vis-cebu''',
    @IterationCount = 300;

EXEC dbo.RunPerformanceTest
    @TestCategory = 'Concurrent_Access',
    @OperationType = 'MultipleGroundOps_Davao',
    @UserId = 'usr-ground-ops-003',
    @RoleName = 'ground_ops',
    @RegionId = 'ph-min-davao',
    @TestQuery = N'SELECT @RowCount = COUNT(*) FROM drivers WHERE status = ''available'' AND region_id = ''ph-min-davao''',
    @IterationCount = 300;

DECLARE @ConcurrentTest1End DATETIME2 = SYSDATETIME();
PRINT 'Concurrent ground ops test completed in ' + CAST(DATEDIFF(MILLISECOND, @ConcurrentTest1, @ConcurrentTest1End) AS VARCHAR) + 'ms';

-- Test 3.2: Mixed Role Concurrent Access
-- Different roles accessing same resources simultaneously
EXEC dbo.RunPerformanceTest
    @TestCategory = 'Mixed_Role_Concurrent',
    @OperationType = 'Analyst_TripAnalysis',
    @UserId = 'usr-analyst-001',
    @RoleName = 'analyst',
    @RegionId = 'ph-ncr-manila',
    @TestQuery = N'
        EXEC sp_set_session_context @key = N''pii_scope'', @value = ''masked'';
        SELECT @RowCount = COUNT(*) FROM trips WHERE pickup_timestamp > DATEADD(HOUR, -24, GETDATE())',
    @IterationCount = 100;

EXEC dbo.RunPerformanceTest
    @TestCategory = 'Mixed_Role_Concurrent',
    @OperationType = 'OpsManager_FleetOverview',
    @UserId = 'usr-ops-manager-001',
    @RoleName = 'ops_manager',
    @RegionId = 'ph-ncr-manila',
    @TestQuery = N'SELECT @RowCount = COUNT(*) FROM drivers d INNER JOIN trips t ON d.driver_id = t.driver_id WHERE t.status = ''active''',
    @IterationCount = 100;

-- =============================================================================
-- TEST CATEGORY 4: Complex Query Performance
-- =============================================================================

PRINT '=== PERFORMANCE TEST 4: Complex Query Patterns ===';

-- Test 4.1: Multi-Table Join with RLS
EXEC dbo.RunPerformanceTest
    @TestCategory = 'Complex_Query_Performance',
    @OperationType = 'MultiTable_Join_RLS',
    @UserId = 'usr-ops-manager-001',
    @RoleName = 'ops_manager',
    @RegionId = 'ph-ncr-manila',
    @TestQuery = N'
        SELECT @RowCount = COUNT(*) 
        FROM trips t 
        INNER JOIN drivers d ON t.driver_id = d.driver_id 
        INNER JOIN passengers p ON t.passenger_id = p.passenger_id 
        WHERE t.created_at > DATEADD(DAY, -1, GETDATE())
          AND t.status IN (''active'', ''completed'')',
    @IterationCount = 50;

-- Test 4.2: Aggregation Query with DDM
EXEC dbo.RunPerformanceTest
    @TestCategory = 'Complex_Query_Performance',
    @OperationType = 'Aggregation_with_DDM',
    @UserId = 'usr-analyst-001',
    @RoleName = 'analyst',
    @RegionId = 'ph-vis-cebu',
    @TestQuery = N'
        EXEC sp_set_session_context @key = N''pii_scope'', @value = ''masked'';
        SELECT @RowCount = COUNT(*) FROM (
            SELECT 
                region_id,
                COUNT(*) as trip_count,
                AVG(fare_amount) as avg_fare
            FROM trips 
            WHERE created_at > DATEADD(DAY, -7, GETDATE())
            GROUP BY region_id
        ) aggregated',
    @IterationCount = 75;

-- =============================================================================
-- TEST CATEGORY 5: Resource Contention Testing
-- =============================================================================

PRINT '=== PERFORMANCE TEST 5: Resource Contention ===';

-- Test 5.1: High-Frequency PII Access
-- Simulate investigation workload with frequent PII unmasking
DECLARE @PIIContentionStart DATETIME2 = SYSDATETIME();

EXEC dbo.RunPerformanceTest
    @TestCategory = 'Resource_Contention',
    @OperationType = 'HighFrequency_PIIAccess',
    @UserId = 'usr-risk-investigator-001',
    @RoleName = 'risk_investigator',
    @RegionId = 'ph-ncr-manila',
    @TestQuery = N'
        EXEC sp_set_session_context @key = N''pii_scope'', @value = ''full'';
        EXEC sp_set_session_context @key = N''mfa_present'', @value = 1;
        SELECT @RowCount = COUNT(*) FROM (
            SELECT TOP 100 phone_number, email, license_number 
            FROM drivers 
            WHERE region_id = ''ph-ncr-manila''
              AND last_active > DATEADD(DAY, -30, GETDATE())
        ) pii_access',
    @IterationCount = 200;

-- Test 5.2: Bulk Export Simulation
-- Test performance of large data exports with masking
EXEC dbo.RunPerformanceTest
    @TestCategory = 'Resource_Contention',
    @OperationType = 'BulkExport_Masked',
    @UserId = 'usr-analyst-001',
    @RoleName = 'analyst',
    @RegionId = 'ph-ncr-manila',
    @TestQuery = N'
        EXEC sp_set_session_context @key = N''pii_scope'', @value = ''masked'';
        SELECT @RowCount = COUNT(*) FROM (
            SELECT TOP 10000 
                trip_id, pickup_location_hash, dropoff_location_hash,
                fare_amount, trip_duration_minutes
            FROM trips 
            WHERE region_id = ''ph-ncr-manila''
              AND created_at > DATEADD(DAY, -30, GETDATE())
        ) bulk_export',
    @IterationCount = 20;

-- =============================================================================
-- PERFORMANCE ANALYSIS AND REPORTING
-- =============================================================================

PRINT '=== PERFORMANCE TEST ANALYSIS ===';

-- Overall Performance Summary
SELECT 
    'OVERALL_PERFORMANCE_SUMMARY' AS report_type,
    COUNT(*) as total_operations,
    AVG(duration_ms) as avg_duration_ms,
    MIN(duration_ms) as min_duration_ms,
    MAX(duration_ms) as max_duration_ms,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY duration_ms) as median_duration_ms,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) as p95_duration_ms,
    PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY duration_ms) as p99_duration_ms,
    SUM(CASE WHEN success_flag = 1 THEN 1 ELSE 0 END) as successful_operations,
    SUM(CASE WHEN success_flag = 0 THEN 1 ELSE 0 END) as failed_operations,
    CASE 
        WHEN AVG(duration_ms) <= 50 THEN 'PASS - Within SLO'
        WHEN AVG(duration_ms) <= 100 THEN 'WARNING - Approaching SLO limit'
        ELSE 'FAIL - Exceeds SLO'
    END as slo_status
FROM dbo.authz_performance_metrics
WHERE test_id IS NOT NULL;

-- Performance by Test Category
SELECT 
    'CATEGORY_PERFORMANCE' AS report_type,
    test_category,
    COUNT(*) as operation_count,
    AVG(duration_ms) as avg_duration_ms,
    MAX(duration_ms) as max_duration_ms,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) as p95_duration_ms,
    SUM(CASE WHEN duration_ms <= 50 THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as pct_within_slo,
    CASE 
        WHEN AVG(duration_ms) <= 50 THEN 'PASS'
        WHEN AVG(duration_ms) <= 100 THEN 'WARNING' 
        ELSE 'FAIL'
    END as category_status
FROM dbo.authz_performance_metrics
GROUP BY test_category
ORDER BY avg_duration_ms DESC;

-- Performance by Operation Type
SELECT 
    'OPERATION_PERFORMANCE' AS report_type,
    operation_type,
    user_context,
    region_id,
    COUNT(*) as iteration_count,
    AVG(duration_ms) as avg_duration_ms,
    AVG(rows_processed) as avg_rows_processed,
    CASE 
        WHEN AVG(duration_ms) <= 50 THEN 'PASS'
        WHEN AVG(duration_ms) <= 100 THEN 'WARNING'
        ELSE 'FAIL' 
    END as operation_status
FROM dbo.authz_performance_metrics
GROUP BY operation_type, user_context, region_id
ORDER BY avg_duration_ms DESC;

-- Error Analysis
SELECT 
    'ERROR_ANALYSIS' AS report_type,
    operation_type,
    error_message,
    COUNT(*) as error_count,
    COUNT(*) * 100.0 / (
        SELECT COUNT(*) 
        FROM dbo.authz_performance_metrics m2 
        WHERE m2.operation_type = m1.operation_type
    ) as error_rate_pct
FROM dbo.authz_performance_metrics m1
WHERE success_flag = 0
GROUP BY operation_type, error_message
ORDER BY error_count DESC;

-- SLO Compliance Summary
SELECT 
    'SLO_COMPLIANCE' AS report_type,
    COUNT(*) as total_operations,
    SUM(CASE WHEN duration_ms <= 50 THEN 1 ELSE 0 END) as operations_within_slo,
    SUM(CASE WHEN duration_ms <= 50 THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as slo_compliance_pct,
    CASE 
        WHEN SUM(CASE WHEN duration_ms <= 50 THEN 1 ELSE 0 END) * 100.0 / COUNT(*) >= 99.9 THEN 'EXCELLENT'
        WHEN SUM(CASE WHEN duration_ms <= 50 THEN 1 ELSE 0 END) * 100.0 / COUNT(*) >= 99.0 THEN 'GOOD'
        WHEN SUM(CASE WHEN duration_ms <= 50 THEN 1 ELSE 0 END) * 100.0 / COUNT(*) >= 95.0 THEN 'ACCEPTABLE'
        ELSE 'NEEDS_IMPROVEMENT'
    END as overall_grade
FROM dbo.authz_performance_metrics;

-- Resource Utilization Patterns
SELECT 
    'RESOURCE_UTILIZATION' AS report_type,
    DATEPART(HOUR, start_time) as hour_of_day,
    COUNT(*) as operations_count,
    AVG(duration_ms) as avg_duration_ms,
    SUM(rows_processed) as total_rows_processed
FROM dbo.authz_performance_metrics
GROUP BY DATEPART(HOUR, start_time)
ORDER BY hour_of_day;

PRINT '=== PERFORMANCE TESTING COMPLETED ===';
PRINT 'Check query results above for detailed performance analysis';
PRINT 'SLO Target: <50ms average, 99.9% consistency';

-- Cleanup session contexts
EXEC sp_set_session_context @key = N'user_id', @value = NULL;
EXEC sp_set_session_context @key = N'user_role', @value = NULL;
EXEC sp_set_session_context @key = N'user_region', @value = NULL;
EXEC sp_set_session_context @key = N'pii_scope', @value = NULL;
EXEC sp_set_session_context @key = N'mfa_present', @value = NULL;
EXEC sp_set_session_context @key = N'case_id', @value = NULL;