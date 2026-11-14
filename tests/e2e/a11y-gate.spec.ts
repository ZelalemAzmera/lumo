import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Lumo Core Accessibility Gate (WCAG 2.2 AA)', () => {
  test('passes axe-core audit with zero violations on initial load', async ({ page }) => {
    await page.goto('/samples/test-harness.html');
    await page.waitForSelector('lumo-player');

    // Wait a brief moment for Shadow DOM and styles to settle
    await page.waitForTimeout(500);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('lumo-player')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    if (accessibilityScanResults.violations.length > 0) {
      console.error('Axe Violations Found:', JSON.stringify(accessibilityScanResults.violations, null, 2));
    }

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('passes axe-core audit when captions are active', async ({ page }) => {
    await page.goto('/samples/test-harness.html');
    await page.waitForSelector('lumo-player');

    // Click captions button to enable English, then Amharic
    const player = page.locator('lumo-player');
    const captionsBtn = player.locator('#btn-captions');
    await captionsBtn.click(); // EN
    await captionsBtn.click(); // AM

    await page.waitForTimeout(300);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('lumo-player')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('passes axe-core audit when Ethiopian Sign Language window is open', async ({ page }) => {
    await page.goto('/samples/test-harness.html');
    await page.waitForSelector('lumo-player');

    const player = page.locator('lumo-player');
    const eslBtn = player.locator('#btn-esl');
    await eslBtn.click(); // Open ESL window

    await page.waitForTimeout(300);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('lumo-player')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('verifies keyboard shortcuts operate without mouse', async ({ page }) => {
    await page.goto('/samples/test-harness.html');
    await page.waitForSelector('lumo-player');

    // Focus inside player
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Press 'c' to cycle captions
    await page.keyboard.press('KeyC');

    const captionsBtn = page.locator('lumo-player').locator('#btn-captions');
    await expect(captionsBtn).toHaveAttribute('aria-pressed', 'true');

    // Press 's' to toggle ESL window
    await page.keyboard.press('KeyS');
    const eslDialog = page.locator('lumo-player').locator('.lumo-esl-dialog');
    await expect(eslDialog).toBeVisible();

    // Press Escape to close ESL window
    await page.keyboard.press('Escape');
    await expect(eslDialog).toBeHidden();
  });
});
