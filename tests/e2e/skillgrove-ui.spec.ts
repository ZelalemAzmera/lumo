import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Skillgrove Framer UI Design System & Accessibility', () => {

  test('renders landing page with Skillgrove design system and Geist font', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // 1. Verify body class and theme styling
    const body = page.locator('body');
    await expect(body).toHaveClass(/skillgrove-ui/);

    // 2. Verify floating glassmorphic nav
    const nav = page.locator('.sg-floating-nav');
    await expect(nav).toBeVisible();
    const navPill = page.locator('.sg-nav-pill');
    await expect(navPill).toBeVisible();

    // 3. Verify Hero section and headline
    const heroTitle = page.locator('.sg-hero-title');
    await expect(heroTitle).toBeVisible();
    await expect(heroTitle).toContainText('The future of');
    await expect(heroTitle).toContainText('accessible learning');

    // 4. Verify Hero Action Buttons
    const primaryBtn = page.locator('.sg-hero-cta a.sg-btn-primary');
    await expect(primaryBtn).toBeVisible();
    await expect(primaryBtn).toContainText('Test Live Player Studio');

    // 5. Verify Hero Showcase Frame with embedded <db-player>
    const showcaseFrame = page.locator('.sg-showcase-frame').first();
    await expect(showcaseFrame).toBeVisible();
    const player = showcaseFrame.locator('db-player');
    await expect(player).toBeVisible();

    // 6. Verify Bento Grid layout and 6 feature cards
    const bentoCards = page.locator('.sg-bento-card');
    await expect(bentoCards).toHaveCount(9); // 6 feature cards + 3 developer cards
  });

  test('passes axe-core accessibility gate on the redesigned landing page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      // Exclude sample third-party video element cross-origin frame checks if any
      .analyze();

    // Filter out color contrast on third-party cross-origin elements if any
    const criticalViolations = accessibilityScanResults.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );

    if (criticalViolations.length > 0) {
      console.error('Critical Axe Violations Found:', JSON.stringify(criticalViolations, null, 2));
    }

    expect(criticalViolations).toEqual([]);
  });

  test('preserves responsive reflow without horizontal overflow down to 320px', async ({ page }) => {
    const viewports = [
      { width: 1440, height: 900 },
      { width: 768, height: 1024 },
      { width: 375, height: 667 },
      { width: 320, height: 568 }
    ];

    for (const vp of viewports) {
      await page.setViewportSize(vp);
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

      // Scroll width must match client width (no horizontal overflow)
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
    }
  });

  test('interactive studios function properly with <db-player>', async ({ page }) => {
    await page.goto('/#studio', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('db-player');

    // Theme selector changes theme attribute
    const themeSelect = page.locator('#select-theme');
    await themeSelect.selectOption('yellow-black');
    const studioPlayer = page.locator('#studio-player');
    await expect(studioPlayer).toHaveAttribute('theme', 'yellow-black');

    // ESL Snap buttons trigger click
    const snapBtn = page.locator('[data-snap-esl="top-left"]');
    await expect(snapBtn).toBeVisible();
    await snapBtn.click();
  });
});
