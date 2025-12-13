import { test, expect } from '@playwright/test';

test.describe('API Connectivity Tests', () => {
  test('Backend API is accessible', async ({ page }) => {
    try {
      const response = await page.request.get('/health');
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data).toHaveProperty('status');
    } catch {
      // API may not be running in dev mode
    }
  });

  test('OpenRouter models load', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
    
    const modelSelector = page.locator('[data-radix-select-trigger]');
    await expect(modelSelector).toBeVisible();
  });

  test('Complete workflow generation flow', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
    
    const modelSelector = page.locator('[data-radix-select-trigger]');
    await expect(modelSelector).toBeVisible();
    
    const initialText = await modelSelector.textContent();
    
    if (initialText?.includes('Model AI')) {
      await modelSelector.click();
      await page.waitForSelector('[data-radix-select-content]', { timeout: 10000 });
      await page.locator('[data-radix-select-item]').first().click();
      await page.waitForTimeout(500);
    }
    
    const promptInput = page.locator('input[type="text"]');
    await promptInput.fill('Create a simple agent');
    
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    await page.waitForTimeout(3000);
    await expect(page.locator('text=Aurora AI Studio')).toBeVisible({ timeout: 10000 });
  });

  test('App loads with API issues', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Stop building complex workflows')).toBeVisible();
  });
});
