import { test, expect } from '@playwright/test';

const mockProfile = {
  user: {
    id: 1,
    name: 'John Doe',
    title: 'Full Stack Developer',
    email: 'john@example.com',
    phone: '+1 (555) 123-4567',
    profileImage: null,
    bio: 'Passionate full-stack developer.',
  },
  jobHistory: [
    {
      id: 1,
      userId: 1,
      company: 'Tech Corp',
      position: 'Senior Software Engineer',
      startDate: '2021-03-15',
      endDate: null,
      description: 'Led development of microservices.',
    },
    {
      id: 2,
      userId: 1,
      company: 'StartUp Inc',
      position: 'Full Stack Developer',
      startDate: '2019-06-01',
      endDate: '2021-02-28',
      description: null,
    },
  ],
  education: [
    {
      id: 1,
      userId: 1,
      institution: 'State University',
      degree: 'Bachelor of Science',
      field: 'Computer Science',
      startDate: '2014-09-01',
      endDate: '2018-05-31',
      description: null,
    },
  ],
};

test.describe('Profile Page - success state', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/users/1/profile', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockProfile),
      });
    });
  });

  test('shows app header with title', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'My Portfolio' })).toBeVisible();
  });

  test('title is a link to the homepage', async ({ page }) => {
    await page.goto('/');
    const link = page.getByRole('link', { name: 'My Portfolio' });
    await expect(link).toHaveAttribute('href', '/');
  });

  test('shows language switcher with two options', async ({ page }) => {
    await page.goto('/');
    const select = page.getByRole('combobox', { name: 'Select language' });
    await expect(select).toBeVisible();
    await expect(page.getByRole('option', { name: 'English' })).toBeAttached();
    await expect(page.getByRole('option', { name: 'Gaeilge' })).toBeAttached();
  });

  test('shows user name and title after loading', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'John Doe', level: 1 })).toBeVisible();
    await expect(page.locator('h2.title')).toBeVisible();
  });

  test('shows user contact information', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'john@example.com' })).toBeVisible();
    await expect(page.getByRole('link', { name: '+1 (555) 123-4567' })).toBeVisible();
  });

  test('shows user bio', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Passionate full-stack developer.')).toBeVisible();
  });

  test('shows job history section', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Senior Software Engineer')).toBeVisible();
    await expect(page.getByText('Tech Corp')).toBeVisible();
  });

  test('shows "Present" for current job', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Present')).toBeVisible();
  });

  test('shows education history section', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Bachelor of Science')).toBeVisible();
    await expect(page.getByText('State University')).toBeVisible();
    await expect(page.getByText('Computer Science')).toBeVisible();
  });

  test('switching to Gaeilge updates the page title', async ({ page }) => {
    await page.goto('/');
    await page.selectOption('[aria-label="Select language"]', 'ga');
    await expect(page.getByRole('heading', { name: 'Mo Phunann' })).toBeVisible();
  });

  test('switching to Gaeilge updates job history section title', async ({ page }) => {
    await page.goto('/');
    await page.selectOption('[aria-label="Select language"]', 'ga');
    await expect(page.getByRole('heading', { name: 'Stair Poist' })).toBeVisible();
  });
});

test.describe('Profile Page - error state', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/users/1/profile', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });
  });

  test('shows error message when API returns 500', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/Failed to load profile/)).toBeVisible();
  });
});
