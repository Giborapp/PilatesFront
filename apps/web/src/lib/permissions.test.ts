import { describe, expect, it } from 'vitest';
import { hasPermission } from './permissions';

describe('hasPermission', () => {
  it('allows a granted permission', () => {
    expect(hasPermission(['students.read'], 'students.read')).toBe(true);
  });

  it('denies missing permissions', () => {
    expect(hasPermission(['students.read'], 'payments.read')).toBe(false);
  });

  it('requires all listed permissions', () => {
    expect(hasPermission(['payments.read', 'payments.manage'], ['payments.read', 'payments.manage'])).toBe(true);
    expect(hasPermission(['payments.read'], ['payments.read', 'payments.manage'])).toBe(false);
  });
});
