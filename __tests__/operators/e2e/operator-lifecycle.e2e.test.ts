// =====================================================
// OPERATOR LIFECYCLE END-TO-END TESTS
// Complete workflow tests for operator registration through tier advancement
// =====================================================

import { test, expect, Page } from '@playwright/test';
import { setupTestEnvironment, cleanupTestEnvironment } from '../helpers/e2eSetup';

// Test data
const testOperatorData = {
  operator_code: 'OPR-E2E-001',
  business_name: 'E2E Test Transport Corporation',
  legal_name: 'E2E Test Transport Corporation',
  trade_name: 'E2E Trans',
  operator_type: 'tnvs',
  primary_contact: {
    name: 'Juan E2E Test',
    phone: '+639123456789',
    email: 'juan@e2etesttrans.com',
    position: 'General Manager'
  },
  business_address: {
    street: '123 E2E Test Street',
    city: 'Makati',
    province: 'Metro Manila',
    region: 'NCR',
    postal_code: '1226',
    country: 'Philippines'
  },
  business_registration_number: 'DTI-E2E-123456',
  tin: '123-456-789-003',
  primary_region_id: 'ncr-001'
};

const testVehicleData = {
  plate_number: 'E2E-1234',
  make: 'Toyota',
  model: 'Vios',
  year: 2023,
  color: 'White',
  service_type: 'TNVS'
};

const testDriverData = {
  first_name: 'Driver',
  last_name: 'E2ETest',
  email: 'driver@e2etesttrans.com',
  phone: '+639987654321',
  license_number: 'E2E-LIC-001'
};

test.describe('Complete Operator Lifecycle', () => {
  
  let page: Page;
  let operatorId: string;

  test.beforeAll(async ({ browser }) => {
    await setupTestEnvironment();
    page = await browser.newPage();
    
    // Login as admin user
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'admin@xpressops.com');
    await page.fill('[data-testid="password"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    
    // Wait for successful login
    await expect(page).toHaveURL('/dashboard');
  });

  test.afterAll(async () => {
    await cleanupTestEnvironment();
  });

  // =====================================================
  // OPERATOR REGISTRATION WORKFLOW
  // =====================================================

  test('Complete operator registration workflow', async () => {
    
    // Step 1: Navigate to operators management
    await page.click('[data-testid="nav-operators"]');
    await expect(page).toHaveURL('/operators');
    
    // Verify operators list is loaded
    await expect(page.locator('[data-testid="operators-table"]')).toBeVisible();

    // Step 2: Start new operator registration
    await page.click('[data-testid="add-operator-button"]');
    
    // Verify registration form is displayed
    await expect(page.locator('[data-testid="operator-registration-form"]')).toBeVisible();

    // Step 3: Fill basic information
    await page.fill('[data-testid="operator-code"]', testOperatorData.operator_code);
    await page.fill('[data-testid="business-name"]', testOperatorData.business_name);
    await page.fill('[data-testid="legal-name"]', testOperatorData.legal_name);
    await page.fill('[data-testid="trade-name"]', testOperatorData.trade_name);
    
    // Select operator type
    await page.selectOption('[data-testid="operator-type"]', testOperatorData.operator_type);
    
    // Verify vehicle limit is set correctly for TNVS
    await expect(page.locator('[data-testid="max-vehicles"]')).toHaveValue('3');

    // Step 4: Fill contact information
    await page.fill('[data-testid="contact-name"]', testOperatorData.primary_contact.name);
    await page.fill('[data-testid="contact-phone"]', testOperatorData.primary_contact.phone);
    await page.fill('[data-testid="contact-email"]', testOperatorData.primary_contact.email);
    await page.fill('[data-testid="contact-position"]', testOperatorData.primary_contact.position);

    // Step 5: Fill business address
    await page.fill('[data-testid="address-street"]', testOperatorData.business_address.street);
    await page.fill('[data-testid="address-city"]', testOperatorData.business_address.city);
    await page.fill('[data-testid="address-province"]', testOperatorData.business_address.province);
    await page.selectOption('[data-testid="address-region"]', testOperatorData.primary_region_id);
    await page.fill('[data-testid="address-postal"]', testOperatorData.business_address.postal_code);

    // Step 6: Fill regulatory information
    await page.fill('[data-testid="business-registration"]', testOperatorData.business_registration_number);
    await page.fill('[data-testid="tin"]', testOperatorData.tin);

    // Step 7: Submit registration
    await page.click('[data-testid="submit-registration"]');
    
    // Verify success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Operator created successfully');
    
    // Get operator ID from success response
    const operatorIdElement = await page.locator('[data-testid="created-operator-id"]');
    operatorId = await operatorIdElement.textContent() || '';
    
    // Step 8: Verify operator appears in list
    await page.goto('/operators');
    await expect(page.locator(`[data-testid="operator-${operatorId}"]`)).toBeVisible();
    await expect(page.locator(`[data-testid="operator-${operatorId}-code"]`)).toContainText(testOperatorData.operator_code);
    await expect(page.locator(`[data-testid="operator-${operatorId}-status"]`)).toContainText('Active');
    await expect(page.locator(`[data-testid="operator-${operatorId}-tier"]`)).toContainText('Tier 1');

    // Step 9: View operator details
    await page.click(`[data-testid="operator-${operatorId}-view"]`);
    await expect(page).toHaveURL(`/operators/${operatorId}`);
    
    // Verify all information is displayed correctly
    await expect(page.locator('[data-testid="operator-business-name"]')).toContainText(testOperatorData.business_name);
    await expect(page.locator('[data-testid="operator-type"]')).toContainText('TNVS');
    await expect(page.locator('[data-testid="operator-status"]')).toContainText('Active');
    await expect(page.locator('[data-testid="vehicle-count"]')).toContainText('0 / 3');
  });

  // =====================================================
  // FLEET MANAGEMENT WORKFLOW
  // =====================================================

  test('Complete fleet management workflow', async () => {
    
    // Navigate to operator details
    await page.goto(`/operators/${operatorId}`);
    
    // Step 1: Add first vehicle
    await page.click('[data-testid="add-vehicle-button"]');
    
    await expect(page.locator('[data-testid="vehicle-form"]')).toBeVisible();
    
    // Fill vehicle information
    await page.fill('[data-testid="vehicle-plate"]', testVehicleData.plate_number);
    await page.fill('[data-testid="vehicle-make"]', testVehicleData.make);
    await page.fill('[data-testid="vehicle-model"]', testVehicleData.model);
    await page.fill('[data-testid="vehicle-year"]', testVehicleData.year.toString());
    await page.fill('[data-testid="vehicle-color"]', testVehicleData.color);
    await page.selectOption('[data-testid="vehicle-service-type"]', testVehicleData.service_type);
    
    // Submit vehicle registration
    await page.click('[data-testid="submit-vehicle"]');
    
    // Verify success
    await expect(page.locator('[data-testid="vehicle-success"]')).toBeVisible();
    
    // Step 2: Verify vehicle appears in fleet list
    await expect(page.locator(`[data-testid="vehicle-${testVehicleData.plate_number}"]`)).toBeVisible();
    await expect(page.locator(`[data-testid="vehicle-${testVehicleData.plate_number}-status"]`)).toContainText('Available');
    
    // Step 3: Update vehicle count display
    await expect(page.locator('[data-testid="vehicle-count"]')).toContainText('1 / 3');

    // Step 4: Add driver
    await page.click('[data-testid="add-driver-button"]');
    
    await expect(page.locator('[data-testid="driver-form"]')).toBeVisible();
    
    // Fill driver information
    await page.fill('[data-testid="driver-first-name"]', testDriverData.first_name);
    await page.fill('[data-testid="driver-last-name"]', testDriverData.last_name);
    await page.fill('[data-testid="driver-email"]', testDriverData.email);
    await page.fill('[data-testid="driver-phone"]', testDriverData.phone);
    await page.fill('[data-testid="driver-license"]', testDriverData.license_number);
    
    // Submit driver registration
    await page.click('[data-testid="submit-driver"]');
    
    // Verify success
    await expect(page.locator('[data-testid="driver-success"]')).toBeVisible();

    // Step 5: Assign driver to vehicle
    await page.click(`[data-testid="vehicle-${testVehicleData.plate_number}-assign"]`);
    
    // Select driver from dropdown
    await page.selectOption('[data-testid="assign-driver-select"]', testDriverData.license_number);
    await page.click('[data-testid="confirm-assignment"]');
    
    // Verify assignment
    await expect(page.locator(`[data-testid="vehicle-${testVehicleData.plate_number}-driver"]`))
      .toContainText(`${testDriverData.first_name} ${testDriverData.last_name}`);
    
    await expect(page.locator(`[data-testid="vehicle-${testVehicleData.plate_number}-status"]`))
      .toContainText('Assigned');

    // Step 6: Test TNVS vehicle limit enforcement
    for (let i = 2; i <= 3; i++) {
      await page.click('[data-testid="add-vehicle-button"]');
      
      await page.fill('[data-testid="vehicle-plate"]', `E2E-123${i}`);
      await page.fill('[data-testid="vehicle-make"]', 'Toyota');
      await page.fill('[data-testid="vehicle-model"]', 'Vios');
      await page.fill('[data-testid="vehicle-year"]', '2023');
      await page.fill('[data-testid="vehicle-color"]', 'White');
      await page.selectOption('[data-testid="vehicle-service-type"]', 'TNVS');
      
      await page.click('[data-testid="submit-vehicle"]');
      await expect(page.locator('[data-testid="vehicle-success"]')).toBeVisible();
    }
    
    // Verify vehicle count at limit
    await expect(page.locator('[data-testid="vehicle-count"]')).toContainText('3 / 3');
    
    // Try to add 4th vehicle (should fail)
    await page.click('[data-testid="add-vehicle-button"]');
    await expect(page.locator('[data-testid="vehicle-limit-error"]'))
      .toContainText('Vehicle limit reached for TNVS operator (3 vehicles maximum)');
  });

  // =====================================================
  // PERFORMANCE SCORING WORKFLOW
  // =====================================================

  test('Complete performance scoring workflow', async () => {
    
    // Navigate to operator performance tab
    await page.goto(`/operators/${operatorId}`);
    await page.click('[data-testid="performance-tab"]');
    
    // Step 1: Verify initial performance state
    await expect(page.locator('[data-testid="current-performance-score"]')).toContainText('0');
    await expect(page.locator('[data-testid="current-commission-tier"]')).toContainText('Tier 1');
    
    // Step 2: Simulate some operational data for performance calculation
    // This would typically involve API calls to create booking/trip data
    await page.evaluate(async () => {
      // Simulate API calls to create performance data
      await fetch('/api/test/simulate-performance-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operatorId: window.testOperatorId,
          performanceMetrics: {
            daily_vehicle_utilization: 0.80,
            peak_hour_availability: 0.85,
            fleet_efficiency_ratio: 0.75,
            driver_retention_rate: 0.90,
            driver_performance_avg: 0.82,
            training_completion_rate: 1.0,
            safety_incident_rate: 0.05,
            regulatory_compliance: 1.0,
            vehicle_maintenance_score: 0.88,
            customer_satisfaction: 4.2,
            service_area_coverage: 0.70,
            technology_adoption: 0.80
          }
        })
      });
    });
    
    // Step 3: Trigger performance calculation
    await page.click('[data-testid="recalculate-performance"]');
    
    // Wait for calculation to complete
    await expect(page.locator('[data-testid="calculation-in-progress"]')).toBeVisible();
    await expect(page.locator('[data-testid="calculation-in-progress"]')).toBeHidden({ timeout: 30000 });
    
    // Step 4: Verify updated performance score
    await expect(page.locator('[data-testid="current-performance-score"]')).not.toContainText('0');
    
    // Get the calculated score
    const performanceScore = await page.locator('[data-testid="current-performance-score"]').textContent();
    const score = parseFloat(performanceScore || '0');
    
    // Verify score is reasonable (should be around 80 based on test data)
    expect(score).toBeGreaterThan(75);
    expect(score).toBeLessThan(85);
    
    // Step 5: Check performance breakdown
    await expect(page.locator('[data-testid="vehicle-utilization-score"]')).toBeVisible();
    await expect(page.locator('[data-testid="driver-management-score"]')).toBeVisible();
    await expect(page.locator('[data-testid="compliance-safety-score"]')).toBeVisible();
    await expect(page.locator('[data-testid="platform-contribution-score"]')).toBeVisible();
    
    // Step 6: Verify tier should remain Tier 1 (score < 80)
    await expect(page.locator('[data-testid="current-commission-tier"]')).toContainText('Tier 1');
  });

  // =====================================================
  // COMMISSION EARNING WORKFLOW
  // =====================================================

  test('Complete commission earning workflow', async () => {
    
    // Navigate to operator financial tab
    await page.goto(`/operators/${operatorId}`);
    await page.click('[data-testid="financial-tab"]');
    
    // Step 1: Verify initial financial state
    await expect(page.locator('[data-testid="wallet-balance"]')).toContainText('₱0.00');
    await expect(page.locator('[data-testid="total-commissions"]')).toContainText('₱0.00');
    
    // Step 2: Simulate booking completions to generate commissions
    await page.evaluate(async () => {
      const bookings = [
        { bookingId: 'BK-E2E-001', baseFare: 250.00 },
        { bookingId: 'BK-E2E-002', baseFare: 450.00 },
        { bookingId: 'BK-E2E-003', baseFare: 180.00 },
        { bookingId: 'BK-E2E-004', baseFare: 320.00 },
        { bookingId: 'BK-E2E-005', baseFare: 500.00 }
      ];
      
      for (const booking of bookings) {
        await fetch('/api/test/simulate-commission', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            operatorId: window.testOperatorId,
            bookingId: booking.bookingId,
            baseFare: booking.baseFare
          })
        });
      }
    });
    
    // Step 3: Refresh financial data
    await page.click('[data-testid="refresh-financial-data"]');
    
    // Wait for data to load
    await page.waitForTimeout(2000);
    
    // Step 4: Verify commission earnings (Tier 1 = 1%)
    // Total fares: 250 + 450 + 180 + 320 + 500 = 1700
    // Commission at 1%: 17.00
    await expect(page.locator('[data-testid="total-commissions"]')).toContainText('₱17.00');
    await expect(page.locator('[data-testid="wallet-balance"]')).toContainText('₱17.00');
    
    // Step 5: Check individual transactions
    await expect(page.locator('[data-testid="transaction-BK-E2E-001"]')).toBeVisible();
    await expect(page.locator('[data-testid="transaction-BK-E2E-001-amount"]')).toContainText('₱2.50'); // 1% of 250
    
    // Step 6: Check earnings summary
    await expect(page.locator('[data-testid="earnings-today"]')).toContainText('₱17.00');
    await expect(page.locator('[data-testid="transaction-count"]')).toContainText('5');
  });

  // =====================================================
  // BOUNDARY FEE WORKFLOW
  // =====================================================

  test('Complete boundary fee workflow', async () => {
    
    // Navigate to operator drivers tab
    await page.goto(`/operators/${operatorId}`);
    await page.click('[data-testid="drivers-tab"]');
    
    // Step 1: Process daily boundary fee
    await page.click(`[data-testid="driver-${testDriverData.license_number}-boundary-fee"]`);
    
    await expect(page.locator('[data-testid="boundary-fee-form"]')).toBeVisible();
    
    // Fill boundary fee details
    await page.fill('[data-testid="base-boundary-fee"]', '1200.00');
    await page.fill('[data-testid="fuel-subsidy"]', '300.00');
    await page.fill('[data-testid="maintenance-allowance"]', '200.00');
    await page.fill('[data-testid="trips-completed"]', '18');
    await page.fill('[data-testid="hours-worked"]', '12');
    await page.fill('[data-testid="distance-covered"]', '180');
    await page.fill('[data-testid="gross-earnings"]', '4500.00');
    
    // Step 2: Calculate performance adjustment
    await page.click('[data-testid="calculate-adjustment"]');
    
    // Performance score around 80 should give small positive adjustment
    await expect(page.locator('[data-testid="performance-adjustment"]')).not.toContainText('0.00');
    
    // Step 3: Submit boundary fee
    await page.click('[data-testid="submit-boundary-fee"]');
    
    // Verify success
    await expect(page.locator('[data-testid="boundary-fee-success"]')).toBeVisible();
    
    // Step 4: Verify fee appears in driver's record
    await expect(page.locator(`[data-testid="driver-${testDriverData.license_number}-last-fee"]`))
      .toContainText('₱1,700.00'); // Base + subsidies + adjustment
    
    // Step 5: Check operator's boundary fee revenue
    await page.click('[data-testid="financial-tab"]');
    await expect(page.locator('[data-testid="boundary-fees-collected"]')).toContainText('₱1,700.00');
  });

  // =====================================================
  // TIER ADVANCEMENT WORKFLOW
  // =====================================================

  test('Complete tier advancement workflow', async () => {
    
    // Step 1: Improve performance metrics to trigger tier advancement
    await page.evaluate(async () => {
      // Simulate improved performance data
      await fetch('/api/test/simulate-performance-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operatorId: window.testOperatorId,
          performanceMetrics: {
            daily_vehicle_utilization: 0.90,
            peak_hour_availability: 0.95,
            fleet_efficiency_ratio: 0.85,
            driver_retention_rate: 0.95,
            driver_performance_avg: 0.90,
            training_completion_rate: 1.0,
            safety_incident_rate: 0.02,
            regulatory_compliance: 1.0,
            vehicle_maintenance_score: 0.95,
            customer_satisfaction: 4.7,
            service_area_coverage: 0.85,
            technology_adoption: 0.90
          }
        })
      });
    });
    
    // Step 2: Recalculate performance
    await page.goto(`/operators/${operatorId}`);
    await page.click('[data-testid="performance-tab"]');
    await page.click('[data-testid="recalculate-performance"]');
    
    await expect(page.locator('[data-testid="calculation-in-progress"]')).toBeHidden({ timeout: 30000 });
    
    // Step 3: Verify improved performance score (should be > 80 for Tier 2)
    const newScore = await page.locator('[data-testid="current-performance-score"]').textContent();
    const score = parseFloat(newScore || '0');
    
    expect(score).toBeGreaterThan(80);
    
    // Step 4: Check tier qualification
    await page.click('[data-testid="check-tier-qualification"]');
    
    await expect(page.locator('[data-testid="tier-qualification-status"]')).toContainText('Qualified for Tier 2');
    
    // Step 5: Approve tier advancement
    await page.click('[data-testid="approve-tier-advancement"]');
    
    // Fill approval notes
    await page.fill('[data-testid="advancement-notes"]', 'Excellent performance improvement');
    await page.click('[data-testid="confirm-advancement"]');
    
    // Step 6: Verify tier advancement
    await expect(page.locator('[data-testid="tier-advancement-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="current-commission-tier"]')).toContainText('Tier 2');
    
    // Step 7: Verify commission rate updated
    await page.click('[data-testid="financial-tab"]');
    await expect(page.locator('[data-testid="commission-rate"]')).toContainText('2.0%');
    
    // Step 8: Test new commission rate with additional booking
    await page.evaluate(async () => {
      await fetch('/api/test/simulate-commission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operatorId: window.testOperatorId,
          bookingId: 'BK-E2E-TIER2-001',
          baseFare: 500.00
        })
      });
    });
    
    await page.click('[data-testid="refresh-financial-data"]');
    
    // Verify new commission at 2% rate
    await expect(page.locator('[data-testid="transaction-BK-E2E-TIER2-001-amount"]'))
      .toContainText('₱10.00'); // 2% of 500
  });

  // =====================================================
  // PAYOUT REQUEST WORKFLOW
  // =====================================================

  test('Complete payout request workflow', async () => {
    
    // Navigate to financial tab
    await page.goto(`/operators/${operatorId}`);
    await page.click('[data-testid="financial-tab"]');
    
    // Step 1: Check current balance (should have commissions + boundary fees)
    const balanceText = await page.locator('[data-testid="wallet-balance"]').textContent();
    const currentBalance = parseFloat(balanceText?.replace(/[₱,]/g, '') || '0');
    
    expect(currentBalance).toBeGreaterThan(0);
    
    // Step 2: Request payout
    await page.click('[data-testid="request-payout"]');
    
    await expect(page.locator('[data-testid="payout-form"]')).toBeVisible();
    
    // Fill payout details
    await page.selectOption('[data-testid="payout-method"]', 'bank_transfer');
    await page.fill('[data-testid="bank-name"]', 'Bank of the Philippine Islands');
    await page.fill('[data-testid="account-number"]', '1234567890');
    await page.fill('[data-testid="account-name"]', testOperatorData.business_name);
    await page.fill('[data-testid="payout-notes"]', 'Monthly payout request');
    
    // Step 3: Submit payout request
    await page.click('[data-testid="submit-payout-request"]');
    
    // Verify success
    await expect(page.locator('[data-testid="payout-request-success"]')).toBeVisible();
    
    // Step 4: Check payout appears in pending status
    await expect(page.locator('[data-testid="payout-status"]')).toContainText('Pending');
    await expect(page.locator('[data-testid="payout-amount"]')).not.toContainText('₱0.00');
    
    // Step 5: Simulate admin approval (switch to admin context)
    await page.goto('/admin/payouts');
    
    // Find the payout request
    await expect(page.locator(`[data-testid="payout-${operatorId}-pending"]`)).toBeVisible();
    
    // Approve the payout
    await page.click(`[data-testid="payout-${operatorId}-approve"]`);
    await page.fill('[data-testid="approval-notes"]', 'Approved - good standing operator');
    await page.click('[data-testid="confirm-approval"]');
    
    // Step 6: Verify payout status updated
    await expect(page.locator(`[data-testid="payout-${operatorId}-status"]`)).toContainText('Approved');
    
    // Step 7: Check operator balance is reduced
    await page.goto(`/operators/${operatorId}`);
    await page.click('[data-testid="financial-tab"]');
    
    // Balance should be reduced or zero after payout
    const newBalanceText = await page.locator('[data-testid="wallet-balance"]').textContent();
    const newBalance = parseFloat(newBalanceText?.replace(/[₱,]/g, '') || '0');
    
    expect(newBalance).toBeLessThan(currentBalance);
  });

  // =====================================================
  // REAL-TIME UPDATES WORKFLOW
  // =====================================================

  test('Real-time updates and notifications', async () => {
    
    // Step 1: Open operator dashboard in two tabs
    const page2 = await page.context().newPage();
    
    await page.goto(`/operators/${operatorId}`);
    await page2.goto(`/operators/${operatorId}`);
    
    // Step 2: Trigger performance update in first tab
    await page.click('[data-testid="performance-tab"]');
    await page.click('[data-testid="recalculate-performance"]');
    
    // Step 3: Verify real-time update appears in second tab
    await expect(page2.locator('[data-testid="performance-update-notification"]')).toBeVisible();
    await expect(page2.locator('[data-testid="performance-update-notification"]'))
      .toContainText('Performance score updated');
    
    // Step 4: Test commission earning notification
    await page.evaluate(async () => {
      await fetch('/api/test/simulate-commission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operatorId: window.testOperatorId,
          bookingId: 'BK-E2E-REALTIME-001',
          baseFare: 400.00
        })
      });
    });
    
    // Step 5: Verify commission notification appears
    await expect(page2.locator('[data-testid="commission-earned-notification"]')).toBeVisible();
    await expect(page2.locator('[data-testid="commission-earned-notification"]'))
      .toContainText('Commission earned: ₱8.00');
    
    // Step 6: Verify live balance update
    await page2.click('[data-testid="financial-tab"]');
    await expect(page2.locator('[data-testid="wallet-balance"]')).toContainText('₱8.00', { timeout: 5000 });
    
    await page2.close();
  });

  // =====================================================
  // ERROR SCENARIOS WORKFLOW
  // =====================================================

  test('Error handling and recovery scenarios', async () => {
    
    // Step 1: Test duplicate vehicle registration
    await page.goto(`/operators/${operatorId}`);
    await page.click('[data-testid="add-vehicle-button"]');
    
    // Try to add vehicle with existing plate number
    await page.fill('[data-testid="vehicle-plate"]', testVehicleData.plate_number);
    await page.fill('[data-testid="vehicle-make"]', 'Honda');
    await page.fill('[data-testid="vehicle-model"]', 'City');
    await page.fill('[data-testid="vehicle-year"]', '2024');
    await page.fill('[data-testid="vehicle-color"]', 'Black');
    
    await page.click('[data-testid="submit-vehicle"]');
    
    // Verify error message
    await expect(page.locator('[data-testid="vehicle-error"]'))
      .toContainText('Vehicle with this plate number already exists');
    
    // Step 2: Test invalid performance data
    await page.click('[data-testid="performance-tab"]');
    
    await page.evaluate(async () => {
      // Simulate invalid performance metrics
      await fetch('/api/test/simulate-performance-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operatorId: window.testOperatorId,
          performanceMetrics: {
            daily_vehicle_utilization: 1.5, // Invalid - over 100%
            safety_incident_rate: -0.1, // Invalid - negative
            customer_satisfaction: 6.0 // Invalid - over 5
          }
        })
      });
    });
    
    await page.click('[data-testid="recalculate-performance"]');
    
    // Verify error handling
    await expect(page.locator('[data-testid="performance-calculation-error"]'))
      .toContainText('Invalid performance data detected');
    
    // Step 3: Test insufficient balance payout
    await page.click('[data-testid="financial-tab"]');
    
    // Request payout for more than available balance
    await page.click('[data-testid="request-payout"]');
    
    // Manually set payout amount higher than balance
    await page.fill('[data-testid="custom-payout-amount"]', '999999.00');
    await page.selectOption('[data-testid="payout-method"]', 'bank_transfer');
    await page.fill('[data-testid="bank-name"]', 'BPI');
    await page.fill('[data-testid="account-number"]', '1234567890');
    
    await page.click('[data-testid="submit-payout-request"]');
    
    // Verify error message
    await expect(page.locator('[data-testid="payout-error"]'))
      .toContainText('Insufficient balance for requested payout amount');
  });

});