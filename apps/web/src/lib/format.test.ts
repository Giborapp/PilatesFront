import { describe, expect, it } from 'vitest';
import { formatDate, formatMoney } from './format';

describe('format helpers', () => {
  it('formats BRL values', () => {
    expect(formatMoney(250)).toContain('250,00');
  });

  it('handles invalid dates', () => {
    expect(formatDate(undefined)).toBe('-');
  });
});
