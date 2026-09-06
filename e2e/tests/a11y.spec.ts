import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { LOCALES, THEMES, setLanguage, setTheme, summariseViolations } from './support/ui';

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
 *   Automated axe-core scan     (A11Y-5)
 *
 * Tab order inside the header (used by focus-indicator tests):
 *   1. .skip-link            (off-screen, revealed on focus)
 *   2. a.App-header-link     (site title)
 *   3. button.download-btn
 *   4. .lang-toggle button[data-lang="en"]
 *   5. .lang-toggle button[data-lang="ga"]
 *   6. button.theme-trigger
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

    test('app header contains no heading elements — title is a paragraph (A-008)', async ({
      page,
    }) => {
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
      const left = await page.locator('.skip-link').evaluate((el) => getComputedStyle(el).left);
      expect(left).toBe('-9999px');
    });

    test('skip link is the first focusable element on the page (A-001)', async ({ page }) => {
      await page.keyboard.press('Tab');
      const isFocused = await page
        .locator('.skip-link')
        .evaluate((el) => el === document.activeElement);
      expect(isFocused).toBe(true);
    });

    test('skip link moves on-screen when keyboard-focused (A-001)', async ({ page }) => {
      // CSS :focus rule changes position to fixed and left to 0
      await page.keyboard.press('Tab'); // focuses .skip-link
      const left = await page.locator('.skip-link').evaluate((el) => getComputedStyle(el).left);
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
    test('the language toggle is an accessibly named group (A-010)', async ({ page }) => {
      const group = page.getByRole('group', { name: 'Language' });
      await expect(group).toBeVisible();
      await expect(group.getByRole('button')).toHaveCount(2);
    });

    test('the active language is exposed with aria-pressed', async ({ page }) => {
      await expect(page.getByRole('button', { name: 'English', exact: true })).toHaveAttribute(
        'aria-pressed',
        'true'
      );
      await expect(page.getByRole('button', { name: 'Gaeilge', exact: true })).toHaveAttribute(
        'aria-pressed',
        'false'
      );
    });

    test('the visible language label is contained in its accessible name (2.5.3)', async ({
      page,
    }) => {
      const english = page.getByRole('button', { name: 'English', exact: true });
      await expect(english).toHaveText('EN');
      const name = (await english.getAttribute('aria-label'))!.toLowerCase();
      expect(name).toContain('en');
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
      const outlineWidth = await page
        .locator('.skip-link')
        .evaluate((el) => getComputedStyle(el).outlineWidth);
      expect(outlineWidth).toBe('2px');
    });

    test('site title link has a visible outline when keyboard-focused (A-007)', async ({
      page,
    }) => {
      await page.keyboard.press('Tab'); // .skip-link
      await page.keyboard.press('Tab'); // .App-header-link
      const outlineWidth = await page
        .locator('.App-header-link')
        .evaluate((el) => getComputedStyle(el).outlineWidth);
      expect(outlineWidth).toBe('2px');
    });

    test('download button is keyboard-focusable and :focus-visible is active (A-002)', async ({
      page,
    }) => {
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

    test('both halves of the language toggle are keyboard-focusable (A-010)', async ({ page }) => {
      await page.keyboard.press('Tab'); // .skip-link
      await page.keyboard.press('Tab'); // .App-header-link
      await page.keyboard.press('Tab'); // .download-btn
      for (const code of ['en', 'ga']) {
        await page.keyboard.press('Tab');
        const option = page.locator(`.lang-toggle button[data-lang="${code}"]`);
        await expect(option).toBeFocused();
        expect(await option.evaluate((el) => el.matches(':focus-visible'))).toBe(true);
      }
    });

    test('theme trigger is keyboard-focusable and :focus-visible is active', async ({ page }) => {
      await page.keyboard.press('Tab'); // .skip-link
      await page.keyboard.press('Tab'); // .App-header-link
      await page.keyboard.press('Tab'); // .download-btn
      await page.keyboard.press('Tab'); // language EN
      await page.keyboard.press('Tab'); // language GA
      await page.keyboard.press('Tab'); // .theme-trigger
      const trigger = page.locator('.theme-trigger');
      await expect(trigger).toBeFocused();
      expect(await trigger.evaluate((el) => el.matches(':focus-visible'))).toBe(true);
    });

    test('the skip link moves focus, not just the scroll position (A11Y-1)', async ({ page }) => {
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');
      const focused = await page.evaluate(() => document.activeElement?.id);
      // tabindex="-1" is what makes this work outside Chromium.
      expect(focused).toBe('main-content');
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
    test('--color-teal-accessible is set to the contrast-compliant value (A-003/A-005)', async ({
      page,
    }) => {
      const value = await page.evaluate(() =>
        getComputedStyle(document.documentElement)
          .getPropertyValue('--color-teal-accessible')
          .trim()
      );
      expect(value).toBe('#065f65');
    });

    test('--color-text-muted is set to the contrast-compliant value (A-004)', async ({ page }) => {
      const value = await page.evaluate(() =>
        getComputedStyle(document.documentElement).getPropertyValue('--color-text-muted').trim()
      );
      expect(value).toBe('#5a6470');
    });

    test('--color-focus-ring is set to the light-theme value', async ({ page }) => {
      const value = await page.evaluate(() =>
        getComputedStyle(document.documentElement).getPropertyValue('--color-focus-ring').trim()
      );
      expect(value).toBe('#12bdc8');
    });

    test('--color-profile-bg-start is set to the light-theme value', async ({ page }) => {
      const value = await page.evaluate(() =>
        getComputedStyle(document.documentElement)
          .getPropertyValue('--color-profile-bg-start')
          .trim()
      );
      expect(value).toBe('#0d1f36');
    });

    test('--color-profile-bg-end is set to the light-theme value', async ({ page }) => {
      const value = await page.evaluate(() =>
        getComputedStyle(document.documentElement).getPropertyValue('--color-profile-bg-end').trim()
      );
      expect(value).toBe('#0a2740');
    });
  });

  // ---------------------------------------------------------------------------
  // Theme switcher
  //
  // The five palettes live behind one appearance button in a radio panel.
  // Verifies the control is accessible, covers all 5 palettes, and that
  // choosing one rewrites the CSS custom properties on <html> so every
  // component immediately re-renders in the new palette.
  // ---------------------------------------------------------------------------

  const cssVar = (page, name: string) =>
    page.evaluate(
      (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(),
      name
    );

  test.describe('Theme switcher', () => {
    test('the appearance trigger is an accessibly named, collapsed disclosure', async ({
      page,
    }) => {
      const trigger = page.getByRole('button', { name: 'Theme', exact: true });
      await expect(trigger).toBeVisible();
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(page.getByRole('radiogroup')).toHaveCount(0);
    });

    test('the panel exposes all 5 palettes as a radio group', async ({ page }) => {
      await page.getByRole('button', { name: 'Theme', exact: true }).click();
      const group = page.getByRole('radiogroup', { name: 'Theme' });
      await expect(group.getByRole('radio')).toHaveCount(5);
    });

    test('the visible palette names carry no "HC" jargon', async ({ page }) => {
      await page.getByRole('button', { name: 'Theme', exact: true }).click();
      await expect(page.getByRole('radiogroup')).not.toContainText(/\bHC\b/);
    });

    test('the panel defaults to the light palette', async ({ page }) => {
      await page.getByRole('button', { name: 'Theme', exact: true }).click();
      await expect(page.getByRole('radio', { name: 'Light', exact: true })).toBeChecked();
    });

    test('Escape closes the panel and returns focus to the trigger', async ({ page }) => {
      const trigger = page.getByRole('button', { name: 'Theme', exact: true });
      await trigger.click();
      await page.keyboard.press('Escape');
      await expect(page.getByRole('radiogroup')).toHaveCount(0);
      await expect(trigger).toBeFocused();
    });

    test('switching to dark theme updates --color-background CSS variable', async ({ page }) => {
      await setTheme(page, 'dark');
      expect(await cssVar(page, '--color-background')).toBe('#0a1120');
    });

    test('the dark palette keeps an elevation ladder above its ground (UX-3)', async ({ page }) => {
      await setTheme(page, 'dark');
      // The hero used to be #0d1827 against a #0f172a page: an identical
      // luminance, contrast ratio 1.00, so the card was invisible.
      const [bg, surface, hero] = await Promise.all([
        cssVar(page, '--color-background'),
        cssVar(page, '--color-surface'),
        cssVar(page, '--color-profile-bg-start'),
      ]);
      expect(new Set([bg, surface, hero]).size).toBe(3);
      expect(hero).not.toBe(bg);
    });

    test('switching to dark theme updates --color-focus-ring CSS variable', async ({ page }) => {
      await setTheme(page, 'dark');
      expect(await cssVar(page, '--color-focus-ring')).toBe('#67e8f9');
    });

    test('the palette drives color-scheme so native controls follow it', async ({ page }) => {
      await setTheme(page, 'dark');
      expect(await page.evaluate(() => document.documentElement.style.colorScheme)).toBe('dark');
      await setTheme(page, 'light');
      expect(await page.evaluate(() => document.documentElement.style.colorScheme)).toBe('light');
    });

    test('switching to high-contrast theme sets --color-background to white', async ({ page }) => {
      await setTheme(page, 'high-contrast');
      expect(await cssVar(page, '--color-background')).toBe('#ffffff');
    });

    test('switching to high-contrast theme sets --color-focus-ring to yellow', async ({ page }) => {
      await setTheme(page, 'high-contrast');
      expect(await cssVar(page, '--color-focus-ring')).toBe('#ffff00');
    });

    test('switching to colour-blind theme sets --color-focus-ring to orange', async ({ page }) => {
      await setTheme(page, 'colour-blind');
      expect(await cssVar(page, '--color-focus-ring')).toBe('#ff9900');
    });

    test('switching to colour-blind-hc theme sets --color-focus-ring to orange', async ({
      page,
    }) => {
      await setTheme(page, 'colour-blind-hc');
      expect(await cssVar(page, '--color-focus-ring')).toBe('#ff8c00');
    });

    test('selected theme is persisted to localStorage', async ({ page }) => {
      await setTheme(page, 'dark');
      expect(await page.evaluate(() => localStorage.getItem('portfolio-theme'))).toBe('dark');
    });

    test('theme is restored from localStorage on page reload', async ({ page }) => {
      await setTheme(page, 'high-contrast');
      await page.reload();
      await expect(page.locator('.user-profile h1')).toBeVisible({ timeout: 15_000 });
      await page.getByRole('button', { name: 'Theme', exact: true }).click();
      await expect(page.getByRole('radio', { name: 'High contrast', exact: true })).toBeChecked();
    });

    test('switching back to light theme restores light --color-background', async ({ page }) => {
      await setTheme(page, 'dark');
      await setTheme(page, 'light');
      expect(await cssVar(page, '--color-background')).toBe('#f0ece7');
    });
  });

  // ---------------------------------------------------------------------------
  // Automated axe-core scan  (A11Y-5)
  //
  // This suite previously asserted only hand-written structural expectations,
  // which is why a `region` violation across 9 nodes and a 2.56:1 footer went
  // unnoticed in every one of the ten theme/locale configurations. axe now runs
  // over each of them.
  // ---------------------------------------------------------------------------

  test.describe('axe-core', () => {
    for (const theme of THEMES) {
      for (const locale of LOCALES) {
        test(`no region or colour-contrast violations — ${theme} / ${locale}`, async ({ page }) => {
          if (locale !== 'en') {
            await setLanguage(page, locale);
          }
          await setTheme(page, theme, locale);

          const results = await new AxeBuilder({ page })
            .withRules(['region', 'color-contrast'])
            .analyze();

          expect(summariseViolations(results)).toEqual([]);
        });
      }
    }

    test('no WCAG 2.1 A/AA violations in the default configuration', async ({ page }) => {
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      expect(summariseViolations(results)).toEqual([]);
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
