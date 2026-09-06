import { test, expect } from '@playwright/test';
import { setLanguage } from './support/ui';

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
    await expect(page.getByRole('button', { name: 'English', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true'
    );

    await expect(page.getByRole('button', { name: 'Download CV' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Job History' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Education' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Skills' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Achievements' })).toBeVisible();
  });

  test('switches to Irish (Gaeilge) and updates all headings', async ({ page }) => {
    await setLanguage(page, 'ga');

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
    await setLanguage(page, 'ga');
    await expect(page.getByRole('heading', { name: 'Stair Poist' })).toBeVisible();

    await setLanguage(page, 'en');
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

    await setLanguage(page, 'ga');
    await expect(page.getByRole('heading', { name: 'Faoi', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'About', exact: true })).toHaveCount(0);
  });

  test('sets <html lang> to match the chosen language (A11Y-2)', async ({ page }) => {
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await setLanguage(page, 'ga');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ga');
  });

  test('marks the English CV content inside the Irish document (A11Y-2)', async ({ page }) => {
    await setLanguage(page, 'ga');
    // The database content stays English in both locales, so it must not be
    // handed to an Irish speech synthesiser.
    await expect(page.locator('.user-profile h1')).toHaveAttribute('lang', 'en');
    await expect(page.locator('.job-history .company').first()).toHaveAttribute('lang', 'en');
  });

  test('renders Irish month names, not English ones', async ({ page }) => {
    // Browsers ship no `ga` ICU data, so toLocaleDateString('ga') silently
    // returns English months; the dates used to read "August 2021 - Faoi
    // láthair".
    await setLanguage(page, 'ga');
    const dates = await page.locator('.job-dates').allInnerTexts();
    expect(dates.length).toBeGreaterThan(0);
    expect(dates.join(' ')).not.toMatch(
      /January|February|March|April|May|June|July|August|September|October|November|December/
    );
  });
});
