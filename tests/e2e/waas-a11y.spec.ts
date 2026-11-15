import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Lumo WaaS Plugin Accessibility Gate (WCAG 2.2 AA)', () => {
  test('passes axe-core audit on <db-waas> applicant mode', async ({ page }) => {
    await page.goto('/samples/waas-demo.html');
    await page.waitForSelector('db-waas');
    await page.waitForTimeout(500);

    const scanResults = await new AxeBuilder({ page })
      .include('db-waas')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    if (scanResults.violations.length > 0) {
      console.error('WaaS Axe Violations Found:', JSON.stringify(scanResults.violations, null, 2));
    }

    expect(scanResults.violations).toEqual([]);
  });

  test('switches to guarantor mode and verifies accessible structure', async ({ page }) => {
    await page.goto('/samples/waas-demo.html');
    await page.waitForSelector('db-waas');

    const guarantorTab = page.locator('#tab-guarantor');
    await guarantorTab.click();
    await page.waitForTimeout(400);

    const waasComp = page.locator('db-waas');
    await expect(waasComp).toHaveAttribute('mode', 'guarantor');

    const scanResults = await new AxeBuilder({ page })
      .include('db-waas')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(scanResults.violations).toEqual([]);
  });

  test('switches to employer verification mode and checks input labels', async ({ page }) => {
    await page.goto('/samples/waas-demo.html');
    await page.waitForSelector('db-waas');

    const employerTab = page.locator('#tab-employer');
    await employerTab.click();
    await page.waitForTimeout(400);

    const waasComp = page.locator('db-waas');
    await expect(waasComp).toHaveAttribute('mode', 'employer');

    const scanResults = await new AxeBuilder({ page })
      .include('db-waas')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(scanResults.violations).toEqual([]);
  });
});
