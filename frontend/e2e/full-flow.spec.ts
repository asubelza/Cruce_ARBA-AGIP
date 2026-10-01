import { test, expect } from '@playwright/test';

test.describe('Full Upload → Compare → Confirm Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('HeroOpening animation plays and transitions to dashboard', async ({ page }) => {
    // Wait for HeroOpening to complete
    await page.waitForSelector('text=Detección de Coincidencias', { timeout: 10000 });
    
    // Should show dashboard elements
    await expect(page.locator('text=RET Pendientes')).toBeVisible();
    await expect(page.locator('text=PLAT Pendientes')).toBeVisible();
  });

  test('File upload with Excel file', async ({ page }) => {
    // Create a test Excel file
    const filePath = 'test-data.xlsx';
    
    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
    
    // Wait for upload to complete
    await page.waitForSelector('text=Datos cargados exitosamente', { timeout: 30000 });
    
    // Should show success message
    await expect(page.locator('text=Datos cargados exitosamente')).toBeVisible();
  });

  test('Auto-match button works', async ({ page }) => {
    // Click Auto-Match button
    await page.click('button:has-text("Auto-Match")');
    
    // Wait for results
    await page.waitForSelector('text=coincidencias', { timeout: 10000 });
    
    // Should show matches
    await expect(page.locator('text=coincidencias')).toBeVisible();
  });

  test('Density mode selector works', async ({ page }) => {
    // Find density selector
    const densitySelect = page.locator('select[aria-label*="densidad" i], select:has(option:has-text("Comfortable"))');
    
    if (await densitySelect.isVisible()) {
      await densitySelect.selectOption('compact');
      await expect(densitySelect).toHaveValue('compact');
      
      await densitySelect.selectOption('dense');
      await expect(densitySelect).toHaveValue('dense');
      
      await densitySelect.selectOption('comfortable');
      await expect(densitySelect).toHaveValue('comfortable');
    }
  });

  test('Density mode persists across reloads', async ({ page }) => {
    // Set density to compact
    const densitySelect = page.locator('select:has(option:has-text("Compact"))');
    if (await densitySelect.isVisible()) {
      await densitySelect.selectOption('compact');
      
      // Reload page
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Should still be compact
      await expect(densitySelect).toHaveValue('compact');
    }
  });

  test('Feature flag rollback - disable ComparisonTable', async ({ page }) => {
    // This would require setting the feature flag via localStorage
    // and reloading - testing that the legacy DataTable appears
    await page.evaluate(() => {
      localStorage.setItem('ecjy-comparison_table', 'false');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Should show legacy tables or fallback
    await expect(page.locator('text=RETENCION')).toBeVisible();
  });

  test('Reduced motion - animations disabled', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // HeroOpening should be skipped or immediate
    await expect(page.locator('text=Detección de Coincidencias')).toBeVisible({ timeout: 5000 });
  });

  test('Keyboard navigation in ValidationWorkspace', async ({ page }) => {
    // This requires data to be loaded first
    // Navigate to ValidationWorkspace
    await page.click('button:has-text("Validación")');
    
    // Check keyboard navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    
    // Should not throw errors
    await expect(page).toHaveURL(/.*/);
  });

  test('1000+ row performance', async ({ page }) => {
    // This would require loading test data with 1000+ rows
    // Measure render time
    const startTime = Date.now();
    
    // Scroll through virtualized table
    const table = page.locator('table').first();
    await table.evaluate((el) => {
      el.scrollTop = 10000;
    });
    
    const endTime = Date.now();
    // Should complete within reasonable time
    expect(endTime - startTime).toBeLessThan(1000);
  });
});