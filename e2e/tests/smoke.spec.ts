import { test, expect } from '@playwright/test';

/**
 * Smoke tests — verify the app starts and key shell + core content render
 * correctly, without depending on specific seed data.
 *
 * These tests are kept deliberately broad so that any major regression
 * (broken build, missing landmark, language misconfiguration, critical a11y
 * omission) is surfaced here before the more focused suites run.
 *
 * Tests marked "sourced from" are intentional duplicates of higher-priority
 * assertions pulled from the focused suites below. Keeping them here means a
 * single smoke run is enough to catch the most impactful regressions.
 */
test.describe('Smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the profile image to be visible, which confirms the API responded
    // and React finished rendering. 15 s covers Docker cold-start latency.
    await expect(page.locator('.profile-page img')).toBeVisible({ timeout: 15_000 });
  });

  // ---------------------------------------------------------------------------
  // App shell
  // ---------------------------------------------------------------------------

  test('header renders with title, download button, and language switcher', async ({ page }) => {
    await expect(page.locator('.App-header')).toBeVisible();
    await expect(page.locator('.App-header .site-title')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Download CV' })).toBeVisible();
    await expect(page.getByLabel('Select language')).toBeVisible();
  });

  test('footer is visible and contains a copyright year', async ({ page }) => {
    // Sourced from a11y.spec.ts — footer / contentinfo landmark (A-016)
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    await expect(footer).toContainText(String(new Date().getFullYear()));
  });

  // ---------------------------------------------------------------------------
  // Profile data
  // ---------------------------------------------------------------------------

  test('profile data loads without showing an error state', async ({ page }) => {
    // beforeEach already confirms the image is visible; this test makes the
    // absence of an error message an explicit, documented assertion.
    await expect(page.locator('.profile-page .error')).toHaveCount(0);
    await expect(page.locator('.profile-page')).toBeVisible();
  });

  test('page has exactly one h1 element', async ({ page }) => {
    // Sourced from a11y.spec.ts (A-008) — a missing or duplicated h1 breaks
    // both heading hierarchy and SEO.
    await expect(page.locator('h1')).toHaveCount(1);
  });

  // ---------------------------------------------------------------------------
  // Language
  // ---------------------------------------------------------------------------

  test('language defaults to English', async ({ page }) => {
    // Sourced from language.spec.ts — baseline state before any switching.
    // Section heading text comes from i18n, not from seed data, so this
    // assertion is seed-independent.
    await expect(page.getByLabel('Select language')).toHaveValue('en');
    await expect(page.getByRole('heading', { name: 'Job History' })).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // Critical accessibility structure
  // ---------------------------------------------------------------------------

  test('skip link exists and targets the main content area', async ({ page }) => {
    // Sourced from a11y.spec.ts (A-001) — the skip link is the primary
    // keyboard-navigation aid; a missing or broken link fails WCAG 2.4.1.
    await expect(page.locator('.skip-link')).toHaveAttribute('href', '#main-content');
    await expect(page.locator('#main-content')).toBeAttached();
  });

  test('page has exactly one main landmark', async ({ page }) => {
    // Sourced from a11y.spec.ts (A-006) — duplicate or missing <main> elements
    // break screen-reader navigation and WCAG 1.3.6.
    await expect(page.locator('main')).toHaveCount(1);
  });
});
