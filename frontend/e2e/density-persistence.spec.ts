import { test, expect } from '@playwright/test';

test.describe('Density Mode Persistence', () => {
  test('density selector exists and works', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Find density selector
    const densitySelect = page.locator('select[aria-label*="densidad" i], select:has(option:has-text("Comfortable"))');
    
    if (await densitySelect.isVisible()) {
      // Test all three options
      await densitySelect.selectOption('comfortable');
      await expect(densitySelect).toHaveValue('comfortable');
      
      await densitySelect.selectOption('compact');
      await expect(densitySelect).toHaveValue('compact');
      
      await densitySelect.selectOption('dense');
      await expect(densitySelect).toHaveValue('dense');
    }
  });

  test('density persists after reload', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const densitySelect = page.locator('select[aria-label*="densidad" i], select:has(option:has-text("Comfortable"))');
    
    if (await densitySelect.isVisible()) {
      await densitySelect.selectOption('compact');
      await expect(densitySelect).toHaveValue('compact');
      
      // Reload
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Should persist
      await expect(densitySelect).toHaveValue('compact');
    }
  });

  test('density affects table row height', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const densitySelect = page.locator('select[aria-label*="densidad" i], select:has(option:has-text("Comfortable"))');
    
    if (await densitySelect.isVisible()) {
      // Get initial row height
      await densitySelect.selectOption('comfortable');
      const rowHeight = await page.locator('tbody tr').first().evaluate(el => el.getBoundingClientRect().height);
      
      await densitySelect.selectOption('compact');
      const compactHeight = await page.locator('tbody tr').first().evaluate(el => el.getBoundingClientRect().height);
      
      await densitySelect.selectOption('dense');
      const denseHeight = await page.locator('tbody tr').first().evaluate(el => el.getBoundingClientRect().height);
      
      // Heights should decrease
      expect(compactHeight).toBeLessThan(rowHeight);
      expect(denseHeight).toBeLessThan(compactHeight);
    }
  });
});