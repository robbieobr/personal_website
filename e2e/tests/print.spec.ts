import { test, expect } from '@playwright/test';

/**
 * Print layout tests.
 * Validates that @media print CSS rules are applied correctly when the browser
 * is switched to print media via page.emulateMedia({ media: 'print' }).
 *
 * Covered rules (by source file):
 *   App.css            – .App-header hidden
 *   ProfilePage.css    – button/[role="button"] hidden; content grid layout
 *   UserProfile.css    – profile image resized to 68 × 68 px
 *   ContactInfo.css    – .contact-link-label hidden (URLs shown directly)
 *   Skills.css         – skill chips converted to disc bullet list
 *   JobHistory.css     – job cards get page-break-inside: avoid
 *   Projects.css       – project cards get page-break-inside: avoid
 *   Achievements.css   – achievement cards get page-break-inside: avoid
 *   EducationHistory.css – education cards get page-break-inside: avoid
 */
test.describe('Print layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for data to load before switching media
    await expect(page.locator('.user-profile h1')).toBeVisible({ timeout: 15_000 });
    await page.emulateMedia({ media: 'print' });
  });

  // ---------------------------------------------------------------------------
  // Chrome / navigation elements hidden
  // ---------------------------------------------------------------------------

  test.describe('Hidden chrome', () => {
    test('app header is hidden', async ({ page }) => {
      await expect(page.locator('.App-header')).toBeHidden();
    });

    test('download CV button is hidden', async ({ page }) => {
      // ProfilePage.css: button, [role="button"] { display: none }
      await expect(page.locator('.download-btn')).toBeHidden();
    });
  });

  // ---------------------------------------------------------------------------
  // Content visibility
  // ---------------------------------------------------------------------------

  test.describe('Content visibility', () => {
    test('profile page container is visible', async ({ page }) => {
      await expect(page.locator('.profile-page')).toBeVisible();
    });

    test('user profile section is visible', async ({ page }) => {
      await expect(page.locator('.user-profile')).toBeVisible();
    });

    test('all section headings are visible', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Job History' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Education' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Skills' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Achievements' })).toBeVisible();
    });
  });

  // ---------------------------------------------------------------------------
  // Contact info — labels hidden, URLs shown
  // ---------------------------------------------------------------------------

  test.describe('Contact info', () => {
    test('contact link labels are hidden', async ({ page }) => {
      // ContactInfo.css: .contact-link-label { display: none }
      // In print, descriptive labels (e.g. "View GitHub Profile") are suppressed;
      // the raw URL in .contact-link-url remains visible.
      const firstLabel = page.locator('.contact-link-label').first();
      await expect(firstLabel).toBeHidden();
    });
  });

  // ---------------------------------------------------------------------------
  // Profile image
  // ---------------------------------------------------------------------------

  test.describe('Profile image', () => {
    test('profile image is scaled to 68 × 68 px for print', async ({ page }) => {
      // UserProfile.css: .profile-image { width: 68px; height: 68px }
      const img = page.locator('.profile-image');
      const width = await img.evaluate((el) => getComputedStyle(el).width);
      const height = await img.evaluate((el) => getComputedStyle(el).height);
      expect(width).toBe('68px');
      expect(height).toBe('68px');
    });
  });

  // ---------------------------------------------------------------------------
  // Skills — chip tags → bullet list
  // ---------------------------------------------------------------------------

  test.describe('Skills list', () => {
    test('skills list renders as a block element', async ({ page }) => {
      // Skills.css: .skills-list { display: block; list-style: disc }
      const skillsList = page.locator('.skills-list');
      const display = await skillsList.evaluate((el) => getComputedStyle(el).display);
      expect(display).toBe('block');
    });

    test('skills list uses disc bullets', async ({ page }) => {
      const skillsList = page.locator('.skills-list');
      const listStyleType = await skillsList.evaluate(
        (el) => getComputedStyle(el).listStyleType,
      );
      expect(listStyleType).toBe('disc');
    });

    test('individual skill items render as list-item', async ({ page }) => {
      // Skills.css: .skill-item { display: list-item }
      const firstSkill = page.locator('.skill-item').first();
      const display = await firstSkill.evaluate((el) => getComputedStyle(el).display);
      expect(display).toBe('list-item');
    });
  });

  // ---------------------------------------------------------------------------
  // Page-break hints on cards
  // ---------------------------------------------------------------------------

  test.describe('Page-break hints', () => {
    test('job cards have break-inside: avoid', async ({ page }) => {
      const firstCard = page.locator('.job-card').first();
      const breakInside = await firstCard.evaluate((el) =>
        getComputedStyle(el).getPropertyValue('break-inside'),
      );
      expect(breakInside).toBe('avoid');
    });

    test('project cards have break-inside: avoid', async ({ page }) => {
      const firstCard = page.locator('.project-card').first();
      const breakInside = await firstCard.evaluate((el) =>
        getComputedStyle(el).getPropertyValue('break-inside'),
      );
      expect(breakInside).toBe('avoid');
    });

    test('achievement cards have break-inside: avoid', async ({ page }) => {
      const firstCard = page.locator('.achievement-card').first();
      const breakInside = await firstCard.evaluate((el) =>
        getComputedStyle(el).getPropertyValue('break-inside'),
      );
      expect(breakInside).toBe('avoid');
    });

    test('education cards have break-inside: avoid', async ({ page }) => {
      const firstCard = page.locator('.education-card').first();
      const breakInside = await firstCard.evaluate((el) =>
        getComputedStyle(el).getPropertyValue('break-inside'),
      );
      expect(breakInside).toBe('avoid');
    });
  });
});
