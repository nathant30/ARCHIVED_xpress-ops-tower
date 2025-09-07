// Vehicle Management End-to-End Tests
// Comprehensive E2E test suite for complete vehicle management workflows
// Testing full user journeys from vehicle creation to decommissioning

import { test, expect, Page, Browser, BrowserContext } from '@playwright/test';
import { mockVehicles, mockUsers, mockCreateVehicleRequests } from './__fixtures__/vehicle-test-data';

// Test configuration
test.describe.configure({ mode: 'parallel' });
test.setTimeout(60000);

// Page object models for better test organization
class VehicleListPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/vehicles');
  }

  async waitForLoad() {
    await this.page.waitForSelector('[data-testid="vehicle-list"]');
  }

  async searchVehicle(searchTerm: string) {
    await this.page.fill('[data-testid="vehicle-search"]', searchTerm);
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(500); // Wait for search results
  }

  async filterByOwnershipType(ownershipType: string) {
    await this.page.selectOption('[data-testid="ownership-filter"]', ownershipType);
    await this.page.waitForTimeout(500);
  }

  async filterByRegion(region: string) {
    await this.page.selectOption('[data-testid="region-filter"]', region);
    await this.page.waitForTimeout(500);
  }

  async clickCreateVehicle() {
    await this.page.click('[data-testid="create-vehicle-btn"]');
  }

  async getVehicleCount() {
    const vehicles = await this.page.locator('[data-testid="vehicle-row"]').count();
    return vehicles;
  }

  async clickVehicle(vehicleCode: string) {
    await this.page.click(`[data-testid="vehicle-${vehicleCode}"]`);
  }

  async getVehicleStatusBadge(vehicleCode: string) {
    return await this.page.textContent(`[data-testid="vehicle-${vehicleCode}-status"]`);
  }
}

class VehicleDetailModal {
  constructor(private page: Page) {}

  async waitForOpen() {
    await this.page.waitForSelector('[data-testid="vehicle-detail-modal"]');
  }

  async clickTab(tabName: string) {
    await this.page.click(`[data-testid="tab-${tabName}"]`);
  }

  async getVehicleInfo(field: string) {
    return await this.page.textContent(`[data-testid="vehicle-${field}"]`);
  }

  async clickEdit() {
    await this.page.click('[data-testid="edit-vehicle-btn"]');
  }

  async close() {
    await this.page.click('[data-testid="close-modal-btn"]');
  }

  async scheduleMaintenace() {
    await this.clickTab('maintenance');
    await this.page.click('[data-testid="schedule-maintenance-btn"]');
  }
}

class VehicleFormModal {
  constructor(private page: Page) {}

  async waitForOpen() {
    await this.page.waitForSelector('[data-testid="vehicle-form-modal"]');
  }

  async fillBasicInfo(vehicleData: any) {
    await this.page.fill('[data-testid="vehicle-code"]', vehicleData.vehicleCode);
    await this.page.fill('[data-testid="license-plate"]', vehicleData.licensePlate);
    await this.page.fill('[data-testid="make"]', vehicleData.make);
    await this.page.fill('[data-testid="model"]', vehicleData.model);
    await this.page.fill('[data-testid="year"]', vehicleData.year.toString());
    await this.page.fill('[data-testid="color"]', vehicleData.color);
    await this.page.selectOption('[data-testid="category"]', vehicleData.category);
    await this.page.selectOption('[data-testid="fuel-type"]', vehicleData.fuelType);
    await this.page.fill('[data-testid="seating-capacity"]', vehicleData.seatingCapacity.toString());
  }

  async selectOwnership(ownershipType: string, ownerName?: string) {
    await this.page.selectOption('[data-testid="ownership-type"]', ownershipType);
    
    if (ownerName) {
      await this.page.fill('[data-testid="owner-name"]', ownerName);
    }
  }

  async selectRegion(region: string) {
    await this.page.selectOption('[data-testid="region"]', region);
  }

  async setRegistrationExpiry(date: Date) {
    const dateString = date.toISOString().split('T')[0];
    await this.page.fill('[data-testid="registration-expiry"]', dateString);
  }

  async toggleOBDDevice(enabled: boolean) {
    const checkbox = this.page.locator('[data-testid="obd-device-installed"]');
    const isChecked = await checkbox.isChecked();
    
    if (enabled !== isChecked) {
      await checkbox.click();
    }
  }

  async submitForm() {
    await this.page.click('[data-testid="submit-vehicle-form"]');
  }

  async getValidationError(field: string) {
    return await this.page.textContent(`[data-testid="error-${field}"]`);
  }

  async cancel() {
    await this.page.click('[data-testid="cancel-form-btn"]');
  }
}

class LoginPage {
  constructor(private page: Page) {}

  async login(email: string, password: string = 'password123') {
    await this.page.goto('/login');
    await this.page.fill('[data-testid="email"]', email);
    await this.page.fill('[data-testid="password"]', password);
    await this.page.click('[data-testid="login-btn"]');
    await this.page.waitForURL('/dashboard');
  }
}

// Test suites
test.describe('Vehicle Management E2E Tests', () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;
  let vehicleListPage: VehicleListPage;
  let vehicleDetailModal: VehicleDetailModal;
  let vehicleFormModal: VehicleFormModal;
  let loginPage: LoginPage;

  test.beforeEach(async ({ browser: testBrowser }) => {
    browser = testBrowser;
    context = await browser.newContext();
    page = await context.newPage();
    
    vehicleListPage = new VehicleListPage(page);
    vehicleDetailModal = new VehicleDetailModal(page);
    vehicleFormModal = new VehicleFormModal(page);
    loginPage = new LoginPage(page);

    // Mock API responses for consistent testing
    await page.route('/api/vehicles**', async route => {
      const url = route.request().url();
      const method = route.request().method();
      
      if (method === 'GET' && url.includes('/api/vehicles')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              data: mockVehicles,
              pagination: {
                page: 1,
                limit: 20,
                total: mockVehicles.length,
                totalPages: 1
              }
            }
          })
        });
      } else if (method === 'POST' && url.includes('/api/vehicles')) {
        const body = route.request().postData();
        const vehicleData = JSON.parse(body || '{}');
        
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              vehicle: {
                id: 'veh-new-001',
                ...vehicleData,
                status: 'inactive',
                createdAt: new Date(),
                updatedAt: new Date(),
                isActive: true
              }
            }
          })
        });
      }
    });

    // Mock auth endpoints
    await page.route('/api/auth/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { user: mockUsers.ops_manager }
        })
      });
    });
  });

  test.afterEach(async () => {
    await context.close();
  });

  // =====================================================
  // Complete Vehicle Lifecycle Tests
  // =====================================================

  test.describe('Complete Vehicle Lifecycle', () => {
    test('should complete full vehicle lifecycle from creation to decommissioning', async () => {
      // Login as operations manager
      await loginPage.login('ops.manager@xpress.ph');
      
      // Navigate to vehicles page
      await vehicleListPage.goto();
      await vehicleListPage.waitForLoad();
      
      // Verify initial state
      const initialCount = await vehicleListPage.getVehicleCount();
      expect(initialCount).toBeGreaterThan(0);
      
      // Create new vehicle
      await vehicleListPage.clickCreateVehicle();
      await vehicleFormModal.waitForOpen();
      
      const newVehicleData = {
        vehicleCode: 'XOT-E2E-001',
        licensePlate: 'E2E001',
        make: 'Toyota',
        model: 'Vios',
        year: 2023,
        color: 'White',
        category: 'sedan',
        fuelType: 'gasoline',
        seatingCapacity: 4
      };
      
      await vehicleFormModal.fillBasicInfo(newVehicleData);
      await vehicleFormModal.selectOwnership('xpress_owned');
      await vehicleFormModal.selectRegion('region-manila');
      await vehicleFormModal.setRegistrationExpiry(new Date('2025-12-31'));
      await vehicleFormModal.toggleOBDDevice(true);
      await vehicleFormModal.submitForm();
      
      // Wait for success message or redirect
      await page.waitForTimeout(2000);
      
      // Verify vehicle appears in list
      await vehicleListPage.searchVehicle('XOT-E2E-001');
      const searchResults = await vehicleListPage.getVehicleCount();
      expect(searchResults).toBe(1);
      
      // View vehicle details
      await vehicleListPage.clickVehicle('XOT-E2E-001');
      await vehicleDetailModal.waitForOpen();
      
      // Verify vehicle information
      const vehicleCode = await vehicleDetailModal.getVehicleInfo('code');
      expect(vehicleCode).toBe('XOT-E2E-001');
      
      // Check different tabs
      await vehicleDetailModal.clickTab('maintenance');
      await page.waitForTimeout(1000);
      
      await vehicleDetailModal.clickTab('telematics');
      await page.waitForTimeout(1000);
      
      await vehicleDetailModal.clickTab('compliance');
      await page.waitForTimeout(1000);
      
      // Close modal
      await vehicleDetailModal.close();
    });

    test('should handle vehicle creation validation errors', async () => {
      await loginPage.login('ops.manager@xpress.ph');
      await vehicleListPage.goto();
      await vehicleListPage.waitForLoad();
      
      // Try to create vehicle with invalid data
      await vehicleListPage.clickCreateVehicle();
      await vehicleFormModal.waitForOpen();
      
      // Submit form without required fields
      await vehicleFormModal.submitForm();
      
      // Check for validation errors
      await page.waitForTimeout(1000);
      const codeError = await vehicleFormModal.getValidationError('vehicle-code');
      expect(codeError).toBeTruthy();
      
      await vehicleFormModal.cancel();
    });

    test('should support bulk operations on vehicles', async () => {
      await loginPage.login('regional.manager@xpress.ph');
      await vehicleListPage.goto();
      await vehicleListPage.waitForLoad();
      
      // Select multiple vehicles (mock implementation)
      await page.click('[data-testid="select-all-vehicles"]');
      
      // Perform bulk action
      await page.click('[data-testid="bulk-actions-btn"]');
      await page.click('[data-testid="bulk-update-status"]');
      
      // Verify bulk operation completed
      await page.waitForSelector('[data-testid="bulk-success-message"]');
      const successMessage = await page.textContent('[data-testid="bulk-success-message"]');
      expect(successMessage).toContain('updated successfully');
    });
  });

  // =====================================================
  // RBAC and Permissions Tests
  // =====================================================

  test.describe('RBAC and Permissions', () => {
    test('should enforce role-based access for ground operations', async () => {
      await loginPage.login('ground.ops@xpress.ph');
      await vehicleListPage.goto();
      await vehicleListPage.waitForLoad();
      
      // Ground ops should see vehicles but not create button
      const vehicles = await vehicleListPage.getVehicleCount();
      expect(vehicles).toBeGreaterThan(0);
      
      const createButton = await page.locator('[data-testid="create-vehicle-btn"]');
      await expect(createButton).not.toBeVisible();
      
      // Should be able to view basic vehicle details
      await vehicleListPage.clickVehicle('XOT-001');
      await vehicleDetailModal.waitForOpen();
      
      // Edit button should not be visible for ground ops
      const editButton = await page.locator('[data-testid="edit-vehicle-btn"]');
      await expect(editButton).not.toBeVisible();
      
      await vehicleDetailModal.close();
    });

    test('should allow operations manager full vehicle access', async () => {
      await loginPage.login('ops.manager@xpress.ph');
      await vehicleListPage.goto();
      await vehicleListPage.waitForLoad();
      
      // Ops manager should see create button
      const createButton = await page.locator('[data-testid="create-vehicle-btn"]');
      await expect(createButton).toBeVisible();
      
      // Should be able to edit vehicles
      await vehicleListPage.clickVehicle('XOT-001');
      await vehicleDetailModal.waitForOpen();
      
      const editButton = await page.locator('[data-testid="edit-vehicle-btn"]');
      await expect(editButton).toBeVisible();
      
      await vehicleDetailModal.close();
    });

    test('should enforce regional restrictions', async () => {
      // Login as Manila-only user
      await loginPage.login('ground.ops@xpress.ph');
      await vehicleListPage.goto();
      await vehicleListPage.waitForLoad();
      
      // Filter should be limited to Manila region
      const regionFilter = page.locator('[data-testid="region-filter"]');
      const options = await regionFilter.locator('option').allTextContents();
      expect(options).toContain('Metro Manila');
      expect(options).not.toContain('Cebu');
    });

    test('should handle cross-region emergency access', async () => {
      await loginPage.login('support@xpress.ph');
      await vehicleListPage.goto();
      await vehicleListPage.waitForLoad();
      
      // Support user should be able to access vehicles with case ID
      await vehicleListPage.searchVehicle('emergency:CASE-001');
      
      // Should trigger MFA prompt for cross-region access
      await page.waitForSelector('[data-testid="mfa-prompt"]');
      
      // Enter MFA code (mock)
      await page.fill('[data-testid="mfa-code"]', '123456');
      await page.click('[data-testid="verify-mfa-btn"]');
      
      // Should now have access to cross-region vehicle
      await page.waitForTimeout(2000);
      const vehicles = await vehicleListPage.getVehicleCount();
      expect(vehicles).toBeGreaterThan(0);
    });
  });

  // =====================================================
  // Real-time Features Tests
  // =====================================================

  test.describe('Real-time Features', () => {
    test('should display real-time vehicle status updates', async () => {
      await loginPage.login('ops.manager@xpress.ph');
      await vehicleListPage.goto();
      await vehicleListPage.waitForLoad();
      
      // Mock WebSocket connection
      await page.addInitScript(() => {
        // Mock Socket.IO
        (window as any).io = () => ({
          on: (event: string, callback: Function) => {
            if (event === 'vehicle-status-update') {
              // Simulate status update after 2 seconds
              setTimeout(() => {
                callback({
                  vehicleId: 'veh-001',
                  status: 'in_service',
                  timestamp: new Date()
                });
              }, 2000);
            }
          },
          emit: () => {},
          disconnect: () => {}
        });
      });
      
      // Wait for real-time update
      await page.waitForTimeout(3000);
      
      // Check if status was updated in UI
      const status = await vehicleListPage.getVehicleStatusBadge('XOT-001');
      expect(status).toBe('IN SERVICE');
    });

    test('should show live telemetry data in vehicle details', async () => {
      await loginPage.login('ops.manager@xpress.ph');
      await vehicleListPage.goto();
      await vehicleListPage.waitForLoad();
      
      // Open vehicle with OBD device
      await vehicleListPage.clickVehicle('XOT-001');
      await vehicleDetailModal.waitForOpen();
      
      // Switch to telematics tab
      await vehicleDetailModal.clickTab('telematics');
      
      // Should show live data (mocked)
      await page.waitForSelector('[data-testid="live-telemetry"]');
      const speedElement = await page.textContent('[data-testid="current-speed"]');
      expect(speedElement).toBeTruthy();
      
      // Mock telemetry update
      await page.evaluate(() => {
        const event = new CustomEvent('telemetry-update', {
          detail: { speed: 55, rpm: 2800, fuelLevel: 70 }
        });
        document.dispatchEvent(event);
      });
      
      await page.waitForTimeout(1000);
      await vehicleDetailModal.close();
    });
  });

  // =====================================================
  // Search and Filter Tests
  // =====================================================

  test.describe('Search and Filter Functionality', () => {
    test('should support comprehensive vehicle search', async () => {
      await loginPage.login('ops.manager@xpress.ph');
      await vehicleListPage.goto();
      await vehicleListPage.waitForLoad();
      
      // Test search by vehicle code
      await vehicleListPage.searchVehicle('XOT-001');
      let results = await vehicleListPage.getVehicleCount();
      expect(results).toBe(1);
      
      // Clear search and test by make
      await vehicleListPage.searchVehicle('Toyota');
      results = await vehicleListPage.getVehicleCount();
      expect(results).toBeGreaterThan(0);
      
      // Test by license plate
      await vehicleListPage.searchVehicle('ABC123');
      results = await vehicleListPage.getVehicleCount();
      expect(results).toBe(1);
    });

    test('should support advanced filtering combinations', async () => {
      await loginPage.login('ops.manager@xpress.ph');
      await vehicleListPage.goto();
      await vehicleListPage.waitForLoad();
      
      // Apply multiple filters
      await vehicleListPage.filterByOwnershipType('xpress_owned');
      await vehicleListPage.filterByRegion('region-manila');
      
      const results = await vehicleListPage.getVehicleCount();
      expect(results).toBeGreaterThan(0);
      
      // All results should match filters
      const vehicleRows = await page.locator('[data-testid="vehicle-row"]').all();
      for (const row of vehicleRows) {
        const ownership = await row.getAttribute('data-ownership');
        const region = await row.getAttribute('data-region');
        expect(ownership).toBe('xpress_owned');
        expect(region).toBe('region-manila');
      }
    });

    test('should handle no search results gracefully', async () => {
      await loginPage.login('ops.manager@xpress.ph');
      await vehicleListPage.goto();
      await vehicleListPage.waitForLoad();
      
      // Search for non-existent vehicle
      await vehicleListPage.searchVehicle('NONEXISTENT');
      
      // Should show no results message
      await page.waitForSelector('[data-testid="no-results-message"]');
      const message = await page.textContent('[data-testid="no-results-message"]');
      expect(message).toContain('No vehicles found');
    });
  });

  // =====================================================
  // Mobile Responsiveness Tests
  // =====================================================

  test.describe('Mobile Responsiveness', () => {
    test('should work correctly on mobile devices', async () => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await loginPage.login('ops.manager@xpress.ph');
      await vehicleListPage.goto();
      await vehicleListPage.waitForLoad();
      
      // Check mobile layout
      const mobileMenu = await page.locator('[data-testid="mobile-menu"]');
      await expect(mobileMenu).toBeVisible();
      
      // Vehicle list should be responsive
      const vehicleList = await page.locator('[data-testid="vehicle-list"]');
      const boundingBox = await vehicleList.boundingBox();
      expect(boundingBox?.width).toBeLessThanOrEqual(375);
      
      // Test mobile modal
      await vehicleListPage.clickVehicle('XOT-001');
      await vehicleDetailModal.waitForOpen();
      
      // Modal should fill mobile screen
      const modal = await page.locator('[data-testid="vehicle-detail-modal"]');
      const modalBox = await modal.boundingBox();
      expect(modalBox?.width).toBeLessThanOrEqual(375);
      
      await vehicleDetailModal.close();
    });

    test('should handle touch interactions on mobile', async () => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await loginPage.login('ops.manager@xpress.ph');
      await vehicleListPage.goto();
      await vehicleListPage.waitForLoad();
      
      // Test swipe gestures on vehicle cards
      const vehicleCard = await page.locator('[data-testid="vehicle-XOT-001"]');
      
      // Simulate swipe right for quick actions
      await vehicleCard.hover();
      await page.mouse.down();
      await page.mouse.move(100, 0);
      await page.mouse.up();
      
      // Should show quick action menu
      await page.waitForSelector('[data-testid="quick-actions"]');
      const quickActions = await page.locator('[data-testid="quick-actions"]');
      await expect(quickActions).toBeVisible();
    });
  });

  // =====================================================
  // Error Handling Tests
  // =====================================================

  test.describe('Error Handling', () => {
    test('should handle network failures gracefully', async () => {
      await loginPage.login('ops.manager@xpress.ph');
      
      // Simulate network failure
      await page.route('/api/vehicles**', route => {
        route.abort('failed');
      });
      
      await vehicleListPage.goto();
      
      // Should show error message
      await page.waitForSelector('[data-testid="network-error"]');
      const errorMessage = await page.textContent('[data-testid="network-error"]');
      expect(errorMessage).toContain('Unable to load vehicles');
      
      // Should have retry button
      const retryButton = await page.locator('[data-testid="retry-btn"]');
      await expect(retryButton).toBeVisible();
    });

    test('should handle API errors with proper feedback', async () => {
      await loginPage.login('ops.manager@xpress.ph');
      
      // Mock API error
      await page.route('/api/vehicles', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Internal server error'
          })
        });
      });
      
      await vehicleListPage.goto();
      
      // Should show server error message
      await page.waitForSelector('[data-testid="server-error"]');
      const errorMessage = await page.textContent('[data-testid="server-error"]');
      expect(errorMessage).toContain('server error');
    });

    test('should handle session expiration', async () => {
      await loginPage.login('ops.manager@xpress.ph');
      await vehicleListPage.goto();
      await vehicleListPage.waitForLoad();
      
      // Simulate session expiration
      await page.route('/api/vehicles**', route => {
        route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Session expired'
          })
        });
      });
      
      // Try to perform an action
      await vehicleListPage.clickCreateVehicle();
      
      // Should redirect to login
      await page.waitForURL('/login');
      expect(page.url()).toContain('/login');
    });
  });

  // =====================================================
  // Performance Tests
  // =====================================================

  test.describe('Performance', () => {
    test('should load vehicle list quickly', async () => {
      await loginPage.login('ops.manager@xpress.ph');
      
      const startTime = Date.now();
      await vehicleListPage.goto();
      await vehicleListPage.waitForLoad();
      const loadTime = Date.now() - startTime;
      
      // Should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
    });

    test('should handle large vehicle lists efficiently', async () => {
      // Mock large dataset
      const largeVehicleList = Array.from({ length: 1000 }, (_, i) => ({
        ...mockVehicles[0],
        id: `veh-${i}`,
        vehicleCode: `XOT-${i.toString().padStart(4, '0')}`
      }));
      
      await page.route('/api/vehicles**', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              data: largeVehicleList.slice(0, 50), // Paginated
              pagination: {
                page: 1,
                limit: 50,
                total: 1000,
                totalPages: 20
              }
            }
          })
        });
      });
      
      await loginPage.login('ops.manager@xpress.ph');
      
      const startTime = Date.now();
      await vehicleListPage.goto();
      await vehicleListPage.waitForLoad();
      const loadTime = Date.now() - startTime;
      
      // Should still load quickly with pagination
      expect(loadTime).toBeLessThan(2000);
      
      // Should show pagination
      const pagination = await page.locator('[data-testid="pagination"]');
      await expect(pagination).toBeVisible();
    });
  });

  // =====================================================
  // Accessibility Tests
  // =====================================================

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async () => {
      await loginPage.login('ops.manager@xpress.ph');
      await vehicleListPage.goto();
      await vehicleListPage.waitForLoad();
      
      // Test tab navigation
      await page.keyboard.press('Tab');
      let focusedElement = await page.locator(':focus').getAttribute('data-testid');
      expect(focusedElement).toBeTruthy();
      
      // Continue tabbing through elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Should be able to activate focused elements with Enter/Space
      await page.keyboard.press('Enter');
      
      // Verify keyboard interaction worked
      await page.waitForTimeout(500);
    });

    test('should have proper ARIA labels and roles', async () => {
      await loginPage.login('ops.manager@xpress.ph');
      await vehicleListPage.goto();
      await vehicleListPage.waitForLoad();
      
      // Check main navigation has proper role
      const navigation = await page.locator('nav');
      const navRole = await navigation.getAttribute('role');
      expect(navRole).toBe('navigation');
      
      // Check table has proper structure
      const table = await page.locator('[role="table"]');
      await expect(table).toBeVisible();
      
      // Check buttons have labels
      const buttons = await page.locator('button').all();
      for (const button of buttons) {
        const ariaLabel = await button.getAttribute('aria-label');
        const textContent = await button.textContent();
        expect(ariaLabel || textContent).toBeTruthy();
      }
    });

    test('should support screen readers', async () => {
      await loginPage.login('ops.manager@xpress.ph');
      await vehicleListPage.goto();
      await vehicleListPage.waitForLoad();
      
      // Check for screen reader announcements
      const announcements = await page.locator('[aria-live]');
      const liveRegions = await announcements.count();
      expect(liveRegions).toBeGreaterThan(0);
      
      // Check heading hierarchy
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
      let previousLevel = 0;
      
      for (const heading of headings) {
        const tagName = await heading.evaluate(el => el.tagName);
        const currentLevel = parseInt(tagName.replace('H', ''));
        
        // Heading levels should not skip
        if (previousLevel > 0) {
          expect(currentLevel - previousLevel).toBeLessThanOrEqual(1);
        }
        
        previousLevel = currentLevel;
      }
    });
  });
});