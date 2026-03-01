import { test, expect } from '@playwright/test';

/**
 * Language switching tests.
 * Verifies that switching between English and Irish (Gaeilge) correctly
 * updates all translated section headings and UI labels.
 */
test.describe('Language switching', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the profile name heading to confirm data has loaded
    await expect(page.locator('.user-profile h1')).toBeVisible({ timeout: 15_000 });
  });

  test('defaults to English', async ({ page }) => {
    const langSelect = page.getByLabel('Select language');
    await expect(langSelect).toHaveValue('en');

    await expect(page.getByRole('button', { name: 'Download CV' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Job History' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Education' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Skills' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Achievements' })).toBeVisible();
  });

  test('switches to Irish (Gaeilge) and updates all headings', async ({ page }) => {
    await page.getByLabel('Select language').selectOption('ga');

    // Section headings should change to Irish translations
    await expect(page.getByRole('heading', { name: 'Stair Poist' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Oideachas' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Tionscadail' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Scileanna' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Éachtaí' })).toBeVisible();

    // Download CV button label should also change
    await expect(page.getByRole('button', { name: 'CV a Íoslódáil' })).toBeVisible();

    // English headings should no longer be present
    await expect(page.getByRole('heading', { name: 'Job History' })).toHaveCount(0);
  });

  test('switches back to English after Irish', async ({ page }) => {
    const langSelect = page.getByLabel('Select language');

    await langSelect.selectOption('ga');
    await expect(page.getByRole('heading', { name: 'Stair Poist' })).toBeVisible();

    await langSelect.selectOption('en');
    await expect(page.getByRole('heading', { name: 'Job History' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Download CV' })).toBeVisible();

    // Irish headings should no longer be present
    await expect(page.getByRole('heading', { name: 'Stair Poist' })).toHaveCount(0);
  });

  test('About section label changes with language', async ({ page }) => {
    // Use getByRole('heading') to avoid matching substrings in other text nodes.
    // "Faoi" is a substring of "Faoi láthair" (Present) rendered inside .job-dates
    // divs, so getByText('Faoi') would hit multiple elements and fail strict mode.
    await expect(page.getByRole('heading', { name: 'About', exact: true })).toBeVisible();

    await page.getByLabel('Select language').selectOption('ga');
    await expect(page.getByRole('heading', { name: 'Faoi', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'About', exact: true })).toHaveCount(0);
  });
});
