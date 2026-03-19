import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import crypto from 'node:crypto';
import request from 'supertest';
import { prisma, app } from './helpers.ts';

const testUser = {
  email: 'resettest@dieeisfabrik.de',
  password: 'Test1234',
  name: 'Reset Test User',
};

/** Helper: hash a 6-digit code using SHA-256 (matches passwordReset.service) */
function hashCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

/** Helper: register + verify a user (no login) */
async function registerAndVerify(user = testUser) {
  await request(app).post('/auth/register').send(user);
  await prisma.user.update({
    where: { email: user.email },
    data: { emailVerified: true },
  });
  await prisma.emailVerificationCode.deleteMany({
    where: { user: { email: user.email } },
  });
}

/** Helper: register + verify + login to get tokens */
async function registerVerifyAndLogin(user = testUser) {
  await registerAndVerify(user);
  const loginRes = await request(app)
    .post('/auth/login')
    .send({ email: user.email, password: user.password });
  return loginRes;
}

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  await prisma.passwordResetCode.deleteMany();
  await prisma.emailVerificationCode.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany({ where: { email: { startsWith: 'resettest' } } });
});

describe('POST /auth/forgot-password', () => {
  it('should return success message for known verified email', async () => {
    await registerAndVerify();

    const res = await request(app)
      .post('/auth/forgot-password')
      .send({ email: testUser.email });

    expect(res.status).toBe(200);
    expect(res.body.message).toBeDefined();
  });

  it('should return 404 for unknown email', async () => {
    const res = await request(app)
      .post('/auth/forgot-password')
      .send({ email: 'unknown@dieeisfabrik.de' });

    expect(res.status).toBe(404);
  });

  it('should create a PasswordResetCode record in the database', async () => {
    await registerAndVerify();

    await request(app)
      .post('/auth/forgot-password')
      .send({ email: testUser.email });

    const user = await prisma.user.findUnique({ where: { email: testUser.email } });
    const codes = await prisma.passwordResetCode.findMany({
      where: { userId: user!.id },
    });

    expect(codes.length).toBe(1);
    expect(codes[0]!.codeHash).toBeDefined();
    expect(codes[0]!.expiresAt).toBeInstanceOf(Date);
    expect(codes[0]!.expiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(codes[0]!.attempts).toBe(0);
  });

  it('should replace existing code when requesting again', async () => {
    await registerAndVerify();

    await request(app)
      .post('/auth/forgot-password')
      .send({ email: testUser.email });

    await request(app)
      .post('/auth/forgot-password')
      .send({ email: testUser.email });

    const user = await prisma.user.findUnique({ where: { email: testUser.email } });
    const codes = await prisma.passwordResetCode.findMany({
      where: { userId: user!.id },
    });

    // Old code should be deleted, only one should exist
    expect(codes.length).toBe(1);
  });

  it('should reject invalid email format', async () => {
    const res = await request(app)
      .post('/auth/forgot-password')
      .send({ email: 'not-an-email' });

    expect(res.status).toBe(400);
  });
});

describe('POST /auth/reset-password', () => {
  it('should successfully reset password with valid code', async () => {
    await registerAndVerify();

    // Request reset code
    await request(app)
      .post('/auth/forgot-password')
      .send({ email: testUser.email });

    // Get code hash from DB and create a matching code
    const user = await prisma.user.findUnique({ where: { email: testUser.email } });
    const codeRecord = await prisma.passwordResetCode.findFirst({
      where: { userId: user!.id },
    });

    // We can't reverse the hash, so we'll insert a known code directly
    const knownCode = '123456';
    await prisma.passwordResetCode.update({
      where: { id: codeRecord!.id },
      data: { codeHash: hashCode(knownCode) },
    });

    const newPassword = 'NewPass1234';
    const res = await request(app)
      .post('/auth/reset-password')
      .send({ email: testUser.email, code: knownCode, password: newPassword });

    expect(res.status).toBe(200);
    expect(res.body.message).toBeDefined();

    // Verify user can login with new password
    const loginRes = await request(app)
      .post('/auth/login')
      .send({ email: testUser.email, password: newPassword });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.accessToken).toBeDefined();
  });

  it('should reject old password after reset', async () => {
    await registerAndVerify();

    await request(app)
      .post('/auth/forgot-password')
      .send({ email: testUser.email });

    const user = await prisma.user.findUnique({ where: { email: testUser.email } });
    const codeRecord = await prisma.passwordResetCode.findFirst({
      where: { userId: user!.id },
    });

    const knownCode = '123456';
    await prisma.passwordResetCode.update({
      where: { id: codeRecord!.id },
      data: { codeHash: hashCode(knownCode) },
    });

    await request(app)
      .post('/auth/reset-password')
      .send({ email: testUser.email, code: knownCode, password: 'NewPass1234' });

    // Old password should fail
    const loginRes = await request(app)
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    expect(loginRes.status).toBe(401);
  });

  it('should reject expired codes', async () => {
    await registerAndVerify();

    const user = await prisma.user.findUnique({ where: { email: testUser.email } });

    // Insert an expired code
    const knownCode = '654321';
    await prisma.passwordResetCode.create({
      data: {
        userId: user!.id,
        codeHash: hashCode(knownCode),
        expiresAt: new Date(Date.now() - 60000), // expired 1 minute ago
      },
    });

    const res = await request(app)
      .post('/auth/reset-password')
      .send({ email: testUser.email, code: knownCode, password: 'NewPass1234' });

    expect(res.status).toBe(400);
  });

  it('should reject invalid/wrong code', async () => {
    await registerAndVerify();

    await request(app)
      .post('/auth/forgot-password')
      .send({ email: testUser.email });

    const res = await request(app)
      .post('/auth/reset-password')
      .send({ email: testUser.email, code: '000000', password: 'NewPass1234' });

    expect(res.status).toBe(401);
  });

  it('should reject after too many attempts (>5)', async () => {
    await registerAndVerify();

    await request(app)
      .post('/auth/forgot-password')
      .send({ email: testUser.email });

    // Set attempts to 5 in DB (next attempt will be >5)
    const user = await prisma.user.findUnique({ where: { email: testUser.email } });
    await prisma.passwordResetCode.updateMany({
      where: { userId: user!.id },
      data: { attempts: 5 },
    });

    const res = await request(app)
      .post('/auth/reset-password')
      .send({ email: testUser.email, code: '000000', password: 'NewPass1234' });

    expect(res.status).toBe(400);
  });

  it('should invalidate all existing refresh tokens (forced logout)', async () => {
    const loginRes = await registerVerifyAndLogin();
    const cookie = loginRes.headers['set-cookie']![0]!;

    // Request reset
    await request(app)
      .post('/auth/forgot-password')
      .send({ email: testUser.email });

    const user = await prisma.user.findUnique({ where: { email: testUser.email } });
    const codeRecord = await prisma.passwordResetCode.findFirst({
      where: { userId: user!.id },
    });

    const knownCode = '123456';
    await prisma.passwordResetCode.update({
      where: { id: codeRecord!.id },
      data: { codeHash: hashCode(knownCode) },
    });

    // Reset password
    await request(app)
      .post('/auth/reset-password')
      .send({ email: testUser.email, code: knownCode, password: 'NewPass1234' });

    // Old refresh token should be invalidated
    const refreshRes = await request(app).post('/auth/refresh').set('Cookie', cookie);
    expect(refreshRes.status).toBe(401);
  });

  it('should reject weak password (validation error)', async () => {
    await registerAndVerify();

    await request(app)
      .post('/auth/forgot-password')
      .send({ email: testUser.email });

    const user = await prisma.user.findUnique({ where: { email: testUser.email } });
    const codeRecord = await prisma.passwordResetCode.findFirst({
      where: { userId: user!.id },
    });

    const knownCode = '123456';
    await prisma.passwordResetCode.update({
      where: { id: codeRecord!.id },
      data: { codeHash: hashCode(knownCode) },
    });

    const res = await request(app)
      .post('/auth/reset-password')
      .send({ email: testUser.email, code: knownCode, password: 'weak' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should reject unknown email', async () => {
    const res = await request(app)
      .post('/auth/reset-password')
      .send({ email: 'unknown@dieeisfabrik.de', code: '123456', password: 'NewPass1234' });

    expect(res.status).toBe(401);
  });

  it('should reject invalid code format', async () => {
    const res = await request(app)
      .post('/auth/reset-password')
      .send({ email: testUser.email, code: 'abc', password: 'NewPass1234' });

    expect(res.status).toBe(400);
  });
});
