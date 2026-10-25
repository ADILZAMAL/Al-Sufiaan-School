const findByPk = jest.fn();
jest.mock('../../models/User', () => ({ __esModule: true, default: { findByPk } }));
jest.mock('../../utils/logger', () => ({ __esModule: true, default: { warn: jest.fn(), error: jest.fn() } }));

import jwt from 'jsonwebtoken';
import type { Request, Response } from 'express';
import verifyToken from '../auth';
import { AUTH_COOKIE_NAME } from '../../utils/cookieOptions';

process.env.JWT_SECRET_KEY = 'test-secret';

const sign = (payload: object) => jwt.sign(payload, 'test-secret');

const run = async ({ cookie, bearer }: { cookie?: string; bearer?: string }) => {
  const req = {
    cookies: cookie ? { [AUTH_COOKIE_NAME]: cookie } : {},
    headers: bearer ? { authorization: `Bearer ${bearer}` } : {},
  } as unknown as Request;
  const res = { locals: {}, status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;
  const next = jest.fn();
  await verifyToken(req, res, next);
  return { req, status: (res.status as jest.Mock).mock.calls[0]?.[0], next };
};

describe('verifyToken', () => {
  beforeEach(() => findByPk.mockReset());

  it('rejects a missing or forged token with 401', async () => {
    expect((await run({})).status).toBe(401);
    expect((await run({ bearer: jwt.sign({ userId: 1 }, 'other-secret') })).status).toBe(401);
    expect(findByPk).not.toHaveBeenCalled();
  });

  it('rejects a valid token whose login was disabled with 401', async () => {
    findByPk.mockResolvedValue(null);
    const { status, next } = await run({ bearer: sign({ userId: 10, schoolId: 1, role: 'TEACHER', staffId: 21 }) });
    expect(status).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('answers 500, not 401, when the DB lookup fails (a 401 signs the mobile app out)', async () => {
    findByPk.mockRejectedValue(new Error('connect ETIMEDOUT'));
    const { status, next } = await run({ bearer: sign({ userId: 10, schoolId: 1, role: 'TEACHER' }) });
    expect(status).toBe(500);
    expect(next).not.toHaveBeenCalled();
  });

  it('takes the role and staff link from the DB, not the token', async () => {
    findByPk.mockResolvedValue({ id: 2, role: 'CASHIER', staffId: null });
    const { req, next } = await run({ bearer: sign({ userId: 2, schoolId: 1, role: 'ADMIN', staffId: 5 }) });
    expect(next).toHaveBeenCalled();
    expect(req.userRole).toBe('CASHIER');
    expect(req.staffId).toBeNull();
    expect(req.userId).toBe(2);
    expect(req.schoolId).toBe(1);
  });

  it('prefers the web cookie over the Authorization header', async () => {
    findByPk.mockResolvedValue({ id: 1, role: 'SUPER_ADMIN', staffId: null });
    await run({ cookie: sign({ userId: 1, schoolId: 1 }), bearer: sign({ userId: 99, schoolId: 1 }) });
    expect(findByPk).toHaveBeenCalledWith(1, expect.anything());
  });
});
