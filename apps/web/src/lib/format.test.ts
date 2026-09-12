import { describe, expect, it } from 'vitest';
import { currencyInputToDecimal, formatCurrencyInput, formatDate, formatMoney } from './format';

describe('format helpers', () => {
  it('formats BRL values', () => {
    expect(formatMoney(250)).toContain('250,00');
  });

  it('normalizes currency input to decimal values', () => {
    expect(currencyInputToDecimal('abc12345')).toBe('123.45');
    expect(currencyInputToDecimal('9')).toBe('0.09');
    expect(currencyInputToDecimal('')).toBe('');
  });

  it('formats currency input from digits only', () => {
    expect(formatCurrencyInput('12345')).toContain('123,45');
  });

  it('handles invalid dates', () => {
    expect(formatDate(undefined)).toBe('-');
  });
});
