import { test, expect } from '@playwright/test';

/**
 * Profile page content tests.
 * Assertions are tied to the default Docker seed data (database/seeds/default/).
 * Default user: John Doe, Full Stack Developer.
 */
test.describe('Profile Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the profile name heading to appear, confirming the API response
    // has been rendered. 15 s covers Docker cold-start latency.
    await expect(page.locator('.user-profile h1')).toBeVisible({ timeout: 15_000 });
  });

  // ---------------------------------------------------------------------------
  // User profile header
  // ---------------------------------------------------------------------------

  test.describe('User Profile section', () => {
    test('displays name and job title', async ({ page }) => {
      // Name is in <h1>, title is in <h2 class="title"> inside .user-profile.
      // Scope to .user-profile to avoid colliding with job position <h3>s that
      // may share the same text (e.g. "Full Stack Developer" is also a job position).
      await expect(page.locator('.user-profile h1')).toContainText('John Doe');
      await expect(page.locator('.user-profile h2.title')).toContainText('Full Stack Developer');
    });

    test('displays a profile image', async ({ page }) => {
      await expect(page.getByRole('img')).toBeVisible();
    });

    test('displays the About / bio section', async ({ page }) => {
      // .profile-bio contains the <h3> heading and the bio <p>
      await expect(page.locator('.profile-bio h3')).toBeVisible();
      await expect(page.locator('.profile-bio p')).toContainText('Passionate full-stack developer');
    });

    test('displays all contact info links', async ({ page }) => {
      // Links are rendered with aria-labels containing the contact value
      await expect(
        page.getByRole('link', { name: /john\.doe@example\.com/i }),
      ).toBeVisible();
      await expect(
        page.getByRole('link', { name: /\+44 7700 900001/i }),
      ).toBeVisible();
      await expect(
        page.getByRole('link', { name: /view github profile/i }),
      ).toBeVisible();
      await expect(
        page.getByRole('link', { name: /view linkedin profile/i }),
      ).toBeVisible();
      await expect(
        page.getByRole('link', { name: /visit website/i }),
      ).toBeVisible();
    });

    test('email link has correct href', async ({ page }) => {
      const emailLink = page.getByRole('link', { name: /john\.doe@example\.com/i });
      await expect(emailLink).toHaveAttribute('href', 'mailto:john.doe@example.com');
    });

    test('phone link has correct href', async ({ page }) => {
      const phoneLink = page.getByRole('link', { name: /\+44 7700 900001/i });
      await expect(phoneLink).toHaveAttribute('href', 'tel:+44 7700 900001');
    });
  });

  // ---------------------------------------------------------------------------
  // Job History
  // ---------------------------------------------------------------------------

  test.describe('Job History section', () => {
    test('section heading is visible', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Job History' })).toBeVisible();
    });

    test('displays current role with "Present" end date', async ({ page }) => {
      // The current role is the first .job-card; scope all assertions to it
      const currentRole = page.locator('.job-card').first();
      await expect(currentRole.locator('.company')).toContainText('Tech Corp');
      await expect(currentRole.locator('h3')).toContainText('Senior Software Engineer');
      await expect(currentRole.locator('.job-dates')).toContainText('Present');
    });

    test('displays past job entries', async ({ page }) => {
      // Company names are in <span class="company">, positions in <h3>.
      // Using structural selectors avoids the case-insensitive substring matching
      // of getByText, which caused false matches against description text.
      const jobHistory = page.locator('.job-history');
      await expect(jobHistory.locator('.company').filter({ hasText: 'StartUp Inc' })).toBeVisible();
      await expect(jobHistory.locator('h3').filter({ hasText: 'Full Stack Developer' })).toBeVisible();
      await expect(jobHistory.locator('.company').filter({ hasText: 'Web Solutions Ltd' })).toBeVisible();
      await expect(jobHistory.locator('h3').filter({ hasText: 'Junior Developer' })).toBeVisible();
    });
  });

  // ---------------------------------------------------------------------------
  // Education
  // ---------------------------------------------------------------------------

  test.describe('Education section', () => {
    test('section heading is visible', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Education' })).toBeVisible();
    });
  });

  // ---------------------------------------------------------------------------
  // Projects
  // ---------------------------------------------------------------------------

  test.describe('Projects section', () => {
    test('section heading is visible', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible();
    });
  });

  // ---------------------------------------------------------------------------
  // Skills
  // ---------------------------------------------------------------------------

  test.describe('Skills section', () => {
    test('section heading is visible', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Skills' })).toBeVisible();
    });
  });

  // ---------------------------------------------------------------------------
  // Achievements
  // ---------------------------------------------------------------------------

  test.describe('Achievements section', () => {
    test('section heading is visible', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Achievements' })).toBeVisible();
    });
  });
});
