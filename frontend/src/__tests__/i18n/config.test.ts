import { describe, it, expect, afterEach } from 'vitest';
import i18n from '../../i18n/config';

describe('i18n config', () => {
  afterEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('is initialized after import', () => {
    expect(i18n.isInitialized).toBe(true);
  });

  it('defaults to English language', () => {
    expect(i18n.language).toBe('en');
  });

  it('translates English app title', () => {
    expect(i18n.t('app.title')).toBe('My Portfolio');
  });

  it('translates English profile page error', () => {
    expect(i18n.t('profilePage.error')).toContain('Failed to load profile');
  });

  it('translates English job history title', () => {
    expect(i18n.t('jobHistory.title')).toBe('Job History');
  });

  it('translates English education history title', () => {
    expect(i18n.t('educationHistory.title')).toBe('Education');
  });

  it('translates Gaeilge app title after language change', async () => {
    await i18n.changeLanguage('ga');
    expect(i18n.t('app.title')).toBe('Mo Phunann');
  });

  it('translates Gaeilge job history title', async () => {
    await i18n.changeLanguage('ga');
    expect(i18n.t('jobHistory.title')).toBe('Stair Poist');
  });

  it('falls back to English for unknown keys', () => {
    expect(i18n.t('nonExistent.key')).toBe('nonExistent.key');
  });

  it('has fallback language set to English', () => {
    const fallbackLng = i18n.options.fallbackLng;
    expect(fallbackLng).toContain('en');
  });
});
