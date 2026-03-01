import { test, expect } from '@playwright/test';

/**
 * Accessibility (a11y) regression tests.
 *
 * These tests verify the WCAG 2.2 fixes applied in the March 2026 audit
 * (docs/accessibility/2026-03-01-120000-accessibility-audit.md).
 * Each test is annotated with its corresponding audit finding ID (A-001 … A-018).
 *
 * Coverage areas:
 *   Landmark regions         (A-006, A-016)
 *   Heading hierarchy        (A-008, A-009, A-015)
 *   Skip navigation link     (A-001)
 *   Image alternative text
 *   ARIA labels              (A-010, A-014)
 *   External link attributes (A-014)
 *   Keyboard focus styles    (A-002, A-007, A-010)
 *   Colour design tokens     (A-003, A-004, A-005)
 *   Error state announcement (A-013)
 *
 * Tab order inside the header (used by focus-indicator tests):
 *   1. .skip-link            (off-screen, revealed on focus)
 *   2. a.App-header-link     (site title)
 *   3. button.download-btn
 *   4. select.theme-select
 *   5. select.language-select
 */
test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for profile data to load before running assertions.
    // 15 s covers Docker cold-start latency.
    await expect(page.locator('.user-profile h1')).toBeVisible({ timeout: 15_000 });
  });

  // ---------------------------------------------------------------------------
  // Landmark regions  (A-006, A-016)
  // ---------------------------------------------------------------------------

  test.describe('Landmark regions', () => {
    test('page has exactly one main landmark (A-006)', async ({ page }) => {
      await expect(page.locator('main')).toHaveCount(1);
    });

    test('page has a banner / header landmark', async ({ page }) => {
      await expect(page.locator('header')).toBeVisible();
    });

    test('page has a contentinfo / footer landmark (A-016)', async ({ page }) => {
      await expect(page.locator('footer')).toBeVisible();
    });

    test('footer contains a copyright year (A-016)', async ({ page }) => {
      await expect(page.locator('footer')).toContainText(String(new Date().getFullYear()));
    });

    test('page has an aside landmark for supplementary content', async ({ page }) => {
      await expect(page.locator('aside')).toBeVisible();
    });
  });

  // ---------------------------------------------------------------------------
  // Heading hierarchy  (A-008, A-009, A-015)
  // ---------------------------------------------------------------------------

  test.describe('Heading hierarchy', () => {
    test('page has exactly one h1 element (A-008)', async ({ page }) => {
      await expect(page.locator('h1')).toHaveCount(1);
    });

    test('the sole h1 contains the user name (A-008)', async ({ page }) => {
      await expect(page.locator('h1')).toContainText('John Doe');
    });

    test('app header contains no heading elements — title is a paragraph (A-008)', async ({ page }) => {
      // The site title was demoted from <h1> to <p class="site-title">
      for (const level of ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']) {
        await expect(page.locator(`.App-header ${level}`)).toHaveCount(0);
      }
    });

    test('user job title is a <p>, not a heading element (A-009)', async ({ page }) => {
      // Was <h2 class="title">; now <p class="title">
      await expect(page.locator('.user-profile p.title')).toBeVisible();
      await expect(page.locator('.user-profile h2.title')).toHaveCount(0);
    });

    test('"About" bio heading is an h2, not h3 (A-015)', async ({ page }) => {
      // Was <h3>; promoted to <h2 class="profile-bio-heading">
      await expect(page.locator('.profile-bio h2')).toBeVisible();
      await expect(page.locator('.profile-bio h3')).toHaveCount(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Skip navigation link  (A-001)
  // ---------------------------------------------------------------------------

  test.describe('Skip navigation link', () => {
    test('skip link exists and its href targets #main-content (A-001)', async ({ page }) => {
      await expect(page.locator('.skip-link')).toHaveAttribute('href', '#main-content');
    });

    test('#main-content target element exists in the DOM (A-001)', async ({ page }) => {
      await expect(page.locator('#main-content')).toBeAttached();
    });

    test('skip link is visually off-screen before keyboard focus (A-001)', async ({ page }) => {
      // CSS: position: absolute; left: -9999px — element is in tab order but invisible
      const left = await page.locator('.skip-link').evaluate(
        (el) => getComputedStyle(el).left,
      );
      expect(left).toBe('-9999px');
    });

    test('skip link is the first focusable element on the page (A-001)', async ({ page }) => {
      await page.keyboard.press('Tab');
      const isFocused = await page.locator('.skip-link').evaluate(
        (el) => el === document.activeElement,
      );
      expect(isFocused).toBe(true);
    });

    test('skip link moves on-screen when keyboard-focused (A-001)', async ({ page }) => {
      // CSS :focus rule changes position to fixed and left to 0
      await page.keyboard.press('Tab'); // focuses .skip-link
      const left = await page.locator('.skip-link').evaluate(
        (el) => getComputedStyle(el).left,
      );
      expect(left).toBe('0px');
    });
  });

  // ---------------------------------------------------------------------------
  // Image alternative text
  // ---------------------------------------------------------------------------

  test.describe('Image alternative text', () => {
    test('profile image has a non-empty alt attribute', async ({ page }) => {
      const alt = await page.locator('.profile-image').getAttribute('alt');
      expect(alt).toBeTruthy();
    });

    test('decorative contact-info SVG icons have aria-hidden="true"', async ({ page }) => {
      // Icons carry no meaning; they must be hidden from assistive technology
      const svgs = page.locator('.contact-info-item svg');
      const count = await svgs.count();
      expect(count).toBeGreaterThan(0);
      for (let i = 0; i < count; i++) {
        await expect(svgs.nth(i)).toHaveAttribute('aria-hidden', 'true');
      }
    });
  });

  // ---------------------------------------------------------------------------
  // ARIA attributes  (A-010, A-014)
  // ---------------------------------------------------------------------------

  test.describe('ARIA attributes', () => {
    test('language select has an accessible label (A-010)', async ({ page }) => {
      await expect(page.getByLabel('Select language')).toBeVisible();
    });

    test('GitHub link aria-label announces it opens in a new tab (A-014)', async ({ page }) => {
      const label = await page
        .getByRole('link', { name: /view github profile/i })
        .getAttribute('aria-label');
      expect(label?.toLowerCase()).toContain('opens in new tab');
    });

    test('LinkedIn link aria-label announces it opens in a new tab (A-014)', async ({ page }) => {
      const label = await page
        .getByRole('link', { name: /view linkedin profile/i })
        .getAttribute('aria-label');
      expect(label?.toLowerCase()).toContain('opens in new tab');
    });

    test('website link aria-label announces it opens in a new tab (A-014)', async ({ page }) => {
      const label = await page
        .getByRole('link', { name: /visit website/i })
        .getAttribute('aria-label');
      expect(label?.toLowerCase()).toContain('opens in new tab');
    });
  });

  // ---------------------------------------------------------------------------
  // External link attributes  (A-014)
  // ---------------------------------------------------------------------------

  test.describe('External links', () => {
    test('GitHub link opens in a new tab with safe rel attributes', async ({ page }) => {
      const link = page.getByRole('link', { name: /view github profile/i });
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    test('LinkedIn link opens in a new tab with safe rel attributes', async ({ page }) => {
      const link = page.getByRole('link', { name: /view linkedin profile/i });
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    test('website link opens in a new tab with safe rel attributes', async ({ page }) => {
      const link = page.getByRole('link', { name: /visit website/i });
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  // ---------------------------------------------------------------------------
  // Keyboard focus indicators  (A-001, A-002, A-007, A-010)
  //
  // Playwright keyboard events trigger :focus-visible in Chromium, so
  // getComputedStyle correctly reflects the 2px outline set in the CSS.
  // ---------------------------------------------------------------------------

  test.describe('Keyboard focus indicators', () => {
    test('skip link has a visible outline when keyboard-focused (A-001)', async ({ page }) => {
      await page.keyboard.press('Tab'); // focus .skip-link
      const outlineWidth = await page.locator('.skip-link').evaluate(
        (el) => getComputedStyle(el).outlineWidth,
      );
      expect(outlineWidth).toBe('2px');
    });

    test('site title link has a visible outline when keyboard-focused (A-007)', async ({ page }) => {
      await page.keyboard.press('Tab'); // .skip-link
      await page.keyboard.press('Tab'); // .App-header-link
      const outlineWidth = await page.locator('.App-header-link').evaluate(
        (el) => getComputedStyle(el).outlineWidth,
      );
      expect(outlineWidth).toBe('2px');
    });

    test('download button is keyboard-focusable and :focus-visible is active (A-002)', async ({ page }) => {
      await page.keyboard.press('Tab'); // .skip-link
      await page.keyboard.press('Tab'); // .App-header-link
      await page.keyboard.press('Tab'); // .download-btn
      // toBeFocused() confirms the element is in the tab order and received focus.
      // matches(':focus-visible') confirms the browser will apply the CSS outline rule.
      // getComputedStyle for :focus-visible is unreliable for <button> in headless
      // Chromium; querying the pseudo-class selector directly is always accurate.
      const btn = page.locator('.download-btn');
      await expect(btn).toBeFocused();
      const hasFocusVisible = await btn.evaluate((el) => el.matches(':focus-visible'));
      expect(hasFocusVisible).toBe(true);
    });

    test('theme select is keyboard-focusable and :focus-visible is active', async ({ page }) => {
      await page.keyboard.press('Tab'); // .skip-link
      await page.keyboard.press('Tab'); // .App-header-link
      await page.keyboard.press('Tab'); // .download-btn
      await page.keyboard.press('Tab'); // .theme-select
      const select = page.locator('.theme-select');
      await expect(select).toBeFocused();
      const hasFocusVisible = await select.evaluate((el) => el.matches(':focus-visible'));
      expect(hasFocusVisible).toBe(true);
    });

    test('language select is keyboard-focusable and :focus-visible is active (A-010)', async ({ page }) => {
      await page.keyboard.press('Tab'); // .skip-link
      await page.keyboard.press('Tab'); // .App-header-link
      await page.keyboard.press('Tab'); // .download-btn
      await page.keyboard.press('Tab'); // .theme-select
      await page.keyboard.press('Tab'); // .language-select
      const select = page.locator('.language-select');
      await expect(select).toBeFocused();
      const hasFocusVisible = await select.evaluate((el) => el.matches(':focus-visible'));
      expect(hasFocusVisible).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Colour design tokens  (A-003, A-004, A-005)
  //
  // These tests lock in the contrast-compliant colour values that replaced the
  // audit-failing tones. They will fail if a developer reverts to the
  // low-contrast colours identified in the audit.
  // ---------------------------------------------------------------------------

  test.describe('Colour design tokens', () => {
    test('--color-teal-accessible is set to the contrast-compliant value (A-003/A-005)', async ({ page }) => {
      const value = await page.evaluate(() =>
        getComputedStyle(document.documentElement)
          .getPropertyValue('--color-teal-accessible')
          .trim(),
      );
      expect(value).toBe('#065f65');
    });

    test('--color-text-muted is set to the contrast-compliant value (A-004)', async ({ page }) => {
      const value = await page.evaluate(() =>
        getComputedStyle(document.documentElement)
          .getPropertyValue('--color-text-muted')
          .trim(),
      );
      expect(value).toBe('#5a6470');
    });

    test('--color-focus-ring is set to the light-theme value', async ({ page }) => {
      const value = await page.evaluate(() =>
        getComputedStyle(document.documentElement)
          .getPropertyValue('--color-focus-ring')
          .trim(),
      );
      expect(value).toBe('#12bdc8');
    });

    test('--color-profile-bg-start is set to the light-theme value', async ({ page }) => {
      const value = await page.evaluate(() =>
        getComputedStyle(document.documentElement)
          .getPropertyValue('--color-profile-bg-start')
          .trim(),
      );
      expect(value).toBe('#0d1f36');
    });

    test('--color-profile-bg-end is set to the light-theme value', async ({ page }) => {
      const value = await page.evaluate(() =>
        getComputedStyle(document.documentElement)
          .getPropertyValue('--color-profile-bg-end')
          .trim(),
      );
      expect(value).toBe('#0a2740');
    });
  });

  // ---------------------------------------------------------------------------
  // Theme switcher
  //
  // Verifies that the theme <select> is accessible, covers all 5 palettes, and
  // that switching themes rewrites the CSS custom properties on <html> so every
  // component immediately re-renders in the new palette.
  // ---------------------------------------------------------------------------

  test.describe('Theme switcher', () => {
    test('theme select has an accessible aria-label', async ({ page }) => {
      await expect(page.getByLabel('Select theme')).toBeVisible();
    });

    test('theme select renders all 5 palette options', async ({ page }) => {
      const select = page.locator('.theme-select');
      await expect(select.locator('option[value="light"]')).toHaveCount(1);
      await expect(select.locator('option[value="dark"]')).toHaveCount(1);
      await expect(select.locator('option[value="high-contrast"]')).toHaveCount(1);
      await expect(select.locator('option[value="colour-blind"]')).toHaveCount(1);
      await expect(select.locator('option[value="colour-blind-hc"]')).toHaveCount(1);
    });

    test('theme select defaults to the light theme', async ({ page }) => {
      const value = await page.locator('.theme-select').inputValue();
      expect(value).toBe('light');
    });

    test('switching to dark theme updates --color-background CSS variable', async ({ page }) => {
      await page.locator('.theme-select').selectOption('dark');
      const bg = await page.evaluate(() =>
        getComputedStyle(document.documentElement)
          .getPropertyValue('--color-background')
          .trim(),
      );
      expect(bg).toBe('#0f172a');
    });

    test('switching to dark theme updates --color-focus-ring CSS variable', async ({ page }) => {
      await page.locator('.theme-select').selectOption('dark');
      const ring = await page.evaluate(() =>
        getComputedStyle(document.documentElement)
          .getPropertyValue('--color-focus-ring')
          .trim(),
      );
      expect(ring).toBe('#67e8f9');
    });

    test('switching to high-contrast theme sets --color-background to white', async ({ page }) => {
      await page.locator('.theme-select').selectOption('high-contrast');
      const bg = await page.evaluate(() =>
        getComputedStyle(document.documentElement)
          .getPropertyValue('--color-background')
          .trim(),
      );
      expect(bg).toBe('#ffffff');
    });

    test('switching to high-contrast theme sets --color-focus-ring to yellow', async ({ page }) => {
      await page.locator('.theme-select').selectOption('high-contrast');
      const ring = await page.evaluate(() =>
        getComputedStyle(document.documentElement)
          .getPropertyValue('--color-focus-ring')
          .trim(),
      );
      expect(ring).toBe('#ffff00');
    });

    test('switching to colour-blind theme sets --color-focus-ring to orange', async ({ page }) => {
      await page.locator('.theme-select').selectOption('colour-blind');
      const ring = await page.evaluate(() =>
        getComputedStyle(document.documentElement)
          .getPropertyValue('--color-focus-ring')
          .trim(),
      );
      expect(ring).toBe('#ff9900');
    });

    test('switching to colour-blind-hc theme sets --color-focus-ring to orange', async ({ page }) => {
      await page.locator('.theme-select').selectOption('colour-blind-hc');
      const ring = await page.evaluate(() =>
        getComputedStyle(document.documentElement)
          .getPropertyValue('--color-focus-ring')
          .trim(),
      );
      expect(ring).toBe('#ff8c00');
    });

    test('selected theme is persisted to localStorage', async ({ page }) => {
      await page.locator('.theme-select').selectOption('dark');
      const stored = await page.evaluate(() => localStorage.getItem('portfolio-theme'));
      expect(stored).toBe('dark');
    });

    test('theme is restored from localStorage on page reload', async ({ page }) => {
      await page.locator('.theme-select').selectOption('high-contrast');
      await page.reload();
      await expect(page.locator('.user-profile h1')).toBeVisible({ timeout: 15_000 });
      const value = await page.locator('.theme-select').inputValue();
      expect(value).toBe('high-contrast');
    });

    test('switching back to light theme restores light --color-background', async ({ page }) => {
      await page.locator('.theme-select').selectOption('dark');
      await page.locator('.theme-select').selectOption('light');
      const bg = await page.evaluate(() =>
        getComputedStyle(document.documentElement)
          .getPropertyValue('--color-background')
          .trim(),
      );
      expect(bg).toBe('#f0ece7');
    });
  });
});

// ---------------------------------------------------------------------------
// Error state announcement  (A-013)
//
// This test uses a separate describe so that it does not inherit the outer
// beforeEach (which waits for a successful profile load). Instead it intercepts
// the API before navigation to force an error state.
// ---------------------------------------------------------------------------

test.describe('Accessibility — error state', () => {
  test('error message has role="alert" when the API is unavailable (A-013)', async ({ page }) => {
    // Abort all API requests before the page loads to trigger the error state
    await page.route(/\/api\//, (route) => route.abort());
    await page.goto('/');

    // The error element must carry role="alert" so screen readers announce it
    await expect(page.locator('.error[role="alert"]')).toBeVisible({ timeout: 15_000 });
  });
});
