import { test, expect } from '@playwright/test';

test.describe('Aurora AI Studio - E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Flo AI Studio/);
  });

  test('Landing page loads correctly', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Stop building complex workflows')).toBeVisible({ timeout: 15000 });
    
    const modelSelector = page.locator('[data-radix-select-trigger]');
    await expect(modelSelector).toBeVisible({ timeout: 10000 });
    
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible({ timeout: 10000 });
  });

  test('Model selector works', async ({ page }) => {
    const modelSelector = page.locator('[data-radix-select-trigger]');
    await modelSelector.click();
    
    await page.waitForSelector('[data-radix-select-content]');
    
    const modelOptions = page.locator('[data-radix-select-item]');
    await expect(modelOptions.first()).toBeVisible();
    
    const firstModel = modelOptions.first();
    const modelText = await firstModel.textContent();
    await firstModel.click();
    
    await expect(modelSelector).toContainText(modelText || '');
  });

  test('Workflow generation navigates to studio', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const modelSelector = page.locator('[data-radix-select-trigger]');
    await expect(modelSelector).toBeVisible({ timeout: 10000 });
    
    const currentModelText = await modelSelector.textContent({ timeout: 5000 });
    
    if (currentModelText?.includes('Model AI') || !currentModelText?.trim()) {
      await modelSelector.click({ timeout: 5000 });
      await page.waitForSelector('[data-radix-select-content]', { timeout: 5000 });
      await page.locator('[data-radix-select-item]').first().click({ timeout: 5000 });
    }
    
    const promptInput = page.locator('input[type="text"]');
    await promptInput.fill('Create a simple agent');
    
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    await page.waitForTimeout(3000);
    await expect(page.locator('text=Aurora AI Studio')).toBeVisible({ timeout: 10000 });
  });

  test('Empty prompt does not submit', async ({ page }) => {
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeDisabled();
  });

  test('Responsive design', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('text=Stop building complex workflows')).toBeVisible();
    
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('text=Stop building complex workflows')).toBeVisible();
    
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('text=Stop building complex workflows')).toBeVisible();
  });
});
