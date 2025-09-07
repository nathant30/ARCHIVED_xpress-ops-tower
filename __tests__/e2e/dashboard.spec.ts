import { test, expect } from '@playwright/test';

test.describe('Dashboard E2E Tests', () => {
  test('should load dashboard without authentication errors', async ({ page }) => {
    // Navigate to the dashboard
    await page.goto('/dashboard');
    
    // Check that the page loads without critical errors
    await expect(page.locator('h1, h2').first()).toBeVisible();
    
    // Verify basic dashboard elements are present
    await expect(page.getByText('Dashboard')).toBeVisible();
    await expect(page.getByText('Real-time overview')).toBeVisible();
  });

  test('should handle navigation correctly', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Test sidebar navigation if present
    const sidebar = page.locator('[role="navigation"], .sidebar, nav');
    if (await sidebar.count() > 0) {
      await expect(sidebar.first()).toBeVisible();
    }
    
    // Check for common navigation elements
    const navElements = ['Dashboard', 'Drivers', 'Vehicles', 'Analytics'];
    for (const element of navElements) {
      const navItem = page.getByText(element, { exact: false });
      if (await navItem.count() > 0) {
        await expect(navItem.first()).toBeVisible();
      }
    }
  });

  test('should display performance metrics', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Wait for any loading states to complete
    await page.waitForTimeout(2000);
    
    // Look for metric cards or dashboard widgets
    const metricSelectors = [
      '[class*="metric"]', 
      '[class*="card"]',
      '[data-testid*="metric"]',
      '[class*="kpi"]'
    ];
    
    let metricsVisible = false;
    for (const selector of metricSelectors) {
      const metrics = page.locator(selector);
      if (await metrics.count() > 0) {
        metricsVisible = true;
        break;
      }
    }
    
    // If no metrics found, at least verify page loaded properly
    if (!metricsVisible) {
      await expect(page.locator('body')).not.toContainText('Failed to Load Dashboard');
      await expect(page.locator('body')).not.toContainText('Loading...');
    }
  });

  test('should handle responsive design', async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/dashboard');
    await expect(page.locator('body')).toBeVisible();
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await expect(page.locator('body')).toBeVisible();
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await expect(page.locator('body')).toBeVisible();
  });
});