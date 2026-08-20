import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, signToken, verifyToken, generatePassword, generateLoginId } from '../auth';

describe('Auth Utilities', () => {
  it('should hash and verify passwords correctly', async () => {
    const password = 'SuperSecretPassword123!';
    const hash = await hashPassword(password);
    expect(hash).not.toBe(password);
    expect(await verifyPassword(password, hash)).toBe(true);
    expect(await verifyPassword('WrongPassword', hash)).toBe(false);
  });

  it('should sign and verify JWT tokens with payload', () => {
    process.env.JWT_SECRET = 'test-secret-key-12345';
    const payload = { sub: 'admin-1', scope: 'super_admin' as const };
    const token = signToken(payload, '1h');
    const verified = verifyToken(token);
    expect(verified.sub).toBe('admin-1');
    expect(verified.scope).toBe('super_admin');
  });

  it('should generate cryptographically strong passwords', () => {
    const pwd1 = generatePassword(16);
    const pwd2 = generatePassword(16);
    expect(pwd1.length).toBe(16);
    expect(pwd2.length).toBe(16);
    expect(pwd1).not.toBe(pwd2);
  });

  it('should generate valid login IDs from event names', () => {
    const loginId = generateLoginId('Tech Gala 2026!');
    expect(loginId).toMatch(/^tech-gala-2026-[a-f0-9]{4}$/);
  });
});
