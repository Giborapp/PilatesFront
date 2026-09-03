import { describe, expect, it } from 'vitest';
import { formatCnpj, formatCpf, onlyDigits } from './br-documents';

describe('Brazilian document formatting', () => {
  it('keeps only digits for API payloads', () => {
    expect(onlyDigits('123.456.789-01')).toBe('12345678901');
    expect(onlyDigits('12.345.678/0001-99')).toBe('12345678000199');
  });

  it('formats CPF with 11 digits', () => {
    expect(formatCpf('12345678901')).toBe('123.456.789-01');
    expect(formatCpf('12345678901999')).toBe('123.456.789-01');
  });

  it('formats CNPJ with 14 digits', () => {
    expect(formatCnpj('12345678000199')).toBe('12.345.678/0001-99');
    expect(formatCnpj('12345678000199123')).toBe('12.345.678/0001-99');
  });
});
