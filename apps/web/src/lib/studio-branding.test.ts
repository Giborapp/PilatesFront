import { describe, expect, it } from 'vitest';
import { STUDIO_BRAND_COLORS, normalizeStudio, studioInitials } from './studio-branding';

describe('studio branding helpers', () => {
  it('offers exactly 15 predefined brand colors', () => {
    expect(STUDIO_BRAND_COLORS).toHaveLength(15);
    expect(new Set(STUDIO_BRAND_COLORS).size).toBe(15);
  });

  it('normalizes default onboarding and operation settings', () => {
    const studio = normalizeStudio({
      id: 'studio-1',
      name: 'Studio Teste',
      email: 'studio@example.com',
      brandColor: STUDIO_BRAND_COLORS[0],
      timezone: 'America/Sao_Paulo',
      settings: {},
    });

    expect(studio).toMatchObject({
      name: 'Studio Teste',
      onboardingStep: 0,
      onboardingCompletedAt: null,
      settings: {
        defaultClassDurationMinutes: 50,
        defaultClassCapacity: 6,
        replacementCreditValidityDays: 30,
      },
    });
  });

  it('creates compact initials when the studio has no logo', () => {
    expect(studioInitials('Studio Bella Pilates')).toBe('SB');
    expect(studioInitials('')).toBe('PM');
  });
});
