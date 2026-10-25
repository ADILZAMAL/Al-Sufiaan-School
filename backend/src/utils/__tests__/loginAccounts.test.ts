jest.mock('../../config/database', () => ({ __esModule: true, default: {} }));
jest.mock('../../models/User', () => ({ __esModule: true, default: {} }));
jest.mock('../../models/Staff', () => ({ __esModule: true, default: {} }));

import { assertCanManage, normalizeEmail } from '../loginAccounts';
import { HttpError } from '../httpError';

describe('normalizeEmail', () => {
  it('stores blanks as null so they never clash on the unique index', () => {
    expect(normalizeEmail('')).toBeNull();
    expect(normalizeEmail('   ')).toBeNull();
    expect(normalizeEmail(null)).toBeNull();
    expect(normalizeEmail(undefined)).toBeNull();
  });

  it('trims and lowercases', () => {
    expect(normalizeEmail('  Office@School.IN ')).toBe('office@school.in');
  });
});

describe('assertCanManage', () => {
  const superAdmin = { id: 1, role: 'SUPER_ADMIN' as const };
  const admin = { id: 2, role: 'ADMIN' as const };
  const cashier = { id: 3, role: 'CASHIER' as const };

  it('lets a Super Admin manage every role', () => {
    for (const role of ['SUPER_ADMIN', 'ADMIN', 'CASHIER', 'TEACHER'] as const) {
      expect(() => assertCanManage(superAdmin, role)).not.toThrow();
    }
  });

  it('lets an Admin manage only mobile-app (Teacher) logins', () => {
    expect(() => assertCanManage(admin, 'TEACHER')).not.toThrow();
    for (const role of ['SUPER_ADMIN', 'ADMIN', 'CASHIER'] as const) {
      expect(() => assertCanManage(admin, role)).toThrow(HttpError);
    }
  });

  it('refuses everyone else with a 403', () => {
    expect.assertions(2);
    try {
      assertCanManage(cashier, 'TEACHER');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpError);
      expect((error as HttpError).status).toBe(403);
    }
  });
});
