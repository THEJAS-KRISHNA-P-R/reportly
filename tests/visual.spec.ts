import { test, expect } from '@playwright/test';

test.describe('Visual Regression QA', () => {

  test('Marketing Homepage', async ({ page }) => {
    await page.goto('http://localhost:3000');
    // Wait for Framer Motion animations to settle
    await page.waitForTimeout(2000); 
    await expect(page).toHaveScreenshot('marketing-homepage.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05
    });
  });

  test('Sign In Page', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('auth-login-split.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05
    });
  });

  test('Register Page', async ({ page }) => {
    await page.goto('http://localhost:3000/register');
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('auth-register-split.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05
    });
  });

});
