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
  const res = await request(app).post('/auth/register').send({ email, password, name });
  return {
    accessToken: res.body.accessToken,
    userId: res.body.user.id,
  };
}

export function authHeader(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` };
}
