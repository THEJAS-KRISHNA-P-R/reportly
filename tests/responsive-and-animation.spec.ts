import { test, expect } from '@playwright/test';

const pages = [
  { path: '/', keySelector: 'main' },
  { path: '/pricing', keySelector: 'main' },
  { path: '/about', keySelector: 'main' },
  { path: '/login', keySelector: 'form' },
  { path: '/register', keySelector: 'form' },
];

test.describe('Responsive and Animation Smoke', () => {
  for (const pageDef of pages) {
    test(`${pageDef.path} renders and does not overflow horizontally`, async ({ page }) => {
      await page.goto(pageDef.path);
      await page.waitForTimeout(1200);

      await expect(page.locator(pageDef.keySelector).first()).toBeVisible();

      const hasHorizontalOverflow = await page.evaluate(() => {
        const doc = document.documentElement;
        const body = document.body;
        const maxScrollWidth = Math.max(doc.scrollWidth, body.scrollWidth);
        return maxScrollWidth > window.innerWidth + 1;
      });

      expect(hasHorizontalOverflow).toBe(false);
    });

    test(`${pageDef.path} has interactive motion styles on primary controls`, async ({ page }) => {
      await page.goto(pageDef.path);
      await page.waitForTimeout(1200);

      const button = page.locator('button:visible').first();
      await expect(button).toBeVisible();

      const before = await button.evaluate((el) => {
        const s = getComputedStyle(el);
        return {
          transitionDuration: s.transitionDuration,
          animationName: s.animationName,
          transform: s.transform,
        };
      });

      await button.hover();
      await page.waitForTimeout(150);

      const after = await button.evaluate((el) => {
        const s = getComputedStyle(el);
        return {
          transitionDuration: s.transitionDuration,
          animationName: s.animationName,
          transform: s.transform,
        };
      });

      const hasTransition = before.transitionDuration !== '0s' || after.transitionDuration !== '0s';
      const hasAnimation = before.animationName !== 'none' || after.animationName !== 'none';
      const transformChanged = before.transform !== after.transform;

      expect(hasTransition || hasAnimation || transformChanged).toBe(true);
    });
  }
});
