import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../src/app.js';

export const prisma = new PrismaClient();
export const app = createApp();

interface TestUserResult {
  accessToken: string;
  userId: string;
}

export async function createTestUser(
  email: string,
  password = 'Test1234',
  name = 'Test User',
): Promise<TestUserResult> {
  // Register user
  const regRes = await request(app).post('/auth/register').send({ email, password, name });
  const userId = regRes.body.user.id;

  // Directly verify email in DB (skip email verification flow in tests)
  await prisma.user.update({ where: { id: userId }, data: { emailVerified: true } });

  // Clean up verification codes
  await prisma.emailVerificationCode.deleteMany({ where: { userId } });

  // Login to get tokens
  const loginRes = await request(app).post('/auth/login').send({ email, password });
  return {
    accessToken: loginRes.body.accessToken,
    userId,
  };
}

export function authHeader(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` };
}
