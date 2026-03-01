import { test, expect } from '@playwright/test';

/**
 * Smoke tests — verify the app starts and basic shell renders correctly
 * without depending on specific seed data.
 */
test.describe('Smoke', () => {
  test('header renders with title, download button, and language switcher', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('.App-header')).toBeVisible();
    await expect(page.locator('.App-header .site-title')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Download CV' })).toBeVisible();
    await expect(page.getByLabel('Select language')).toBeVisible();
  });

  test('profile data loads without showing an error state', async ({ page }) => {
    await page.goto('/');

    // Wait for the skeleton loader to resolve and real content to appear.
    // The profile page fetches user ID 1 on mount; 15 s covers Docker cold-start.
    await expect(page.locator('.profile-page .error')).toHaveCount(0);
    await expect(page.locator('.profile-page')).toBeVisible();

    // Confirm at least the user section rendered (not still in skeleton/loading state)
    await expect(page.locator('.profile-page img')).toBeVisible({ timeout: 15_000 });
  });
});
