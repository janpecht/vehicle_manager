import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = createApp();

const testUser = {
  email: 'authtest@test.de',
  password: 'Test1234',
  name: 'Auth Test User',
};

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany({ where: { email: { startsWith: 'authtest' } } });
});

describe('POST /auth/register', () => {
  it('should register a new user and return tokens', async () => {
    const res = await request(app).post('/auth/register').send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({
      email: testUser.email,
      name: testUser.name,
      role: 'USER',
    });
    expect(res.body.user.id).toBeDefined();
    expect(res.body.accessToken).toBeDefined();
    expect(res.headers['set-cookie']).toBeDefined();

    const cookie = res.headers['set-cookie']![0]!;
    expect(cookie).toContain('refresh_token=');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Path=/auth');
  });

  it('should reject duplicate email', async () => {
    await request(app).post('/auth/register').send(testUser);
    const res = await request(app).post('/auth/register').send(testUser);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('should reject weak password', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ ...testUser, password: 'weak' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should reject password without uppercase', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ ...testUser, password: 'test1234' });

    expect(res.status).toBe(400);
  });

  it('should reject password without digit', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ ...testUser, password: 'TestTest' });

    expect(res.status).toBe(400);
  });

  it('should reject invalid email', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ ...testUser, email: 'not-an-email' });

    expect(res.status).toBe(400);
  });

  it('should reject missing name', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: testUser.email, password: testUser.password });

    expect(res.status).toBe(400);
  });
});

describe('POST /auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/auth/register').send(testUser);
  });

  it('should login with valid credentials', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(testUser.email);
    expect(res.body.accessToken).toBeDefined();
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('should reject wrong password', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: testUser.email, password: 'WrongPass1' });

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Invalid email or password');
  });

  it('should reject unknown email', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'unknown@test.de', password: testUser.password });

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Invalid email or password');
  });
});

describe('POST /auth/refresh', () => {
  it('should refresh tokens with valid cookie', async () => {
    const registerRes = await request(app).post('/auth/register').send(testUser);
    const cookie = registerRes.headers['set-cookie']![0]!;

    const res = await request(app).post('/auth/refresh').set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.email).toBe(testUser.email);
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('should rotate refresh token (old token invalidated)', async () => {
    const registerRes = await request(app).post('/auth/register').send(testUser);
    const oldCookie = registerRes.headers['set-cookie']![0]!;

    // Use the token once
    await request(app).post('/auth/refresh').set('Cookie', oldCookie);

    // Try to use the old token again
    const res = await request(app).post('/auth/refresh').set('Cookie', oldCookie);

    expect(res.status).toBe(401);
  });

  it('should reject when no cookie is present', async () => {
    const res = await request(app).post('/auth/refresh');

    expect(res.status).toBe(401);
  });
});

describe('POST /auth/logout', () => {
  it('should clear refresh token cookie', async () => {
    const registerRes = await request(app).post('/auth/register').send(testUser);
    const cookie = registerRes.headers['set-cookie']![0]!;

    const res = await request(app).post('/auth/logout').set('Cookie', cookie);

    expect(res.status).toBe(204);

    // Refresh should fail after logout
    const refreshRes = await request(app).post('/auth/refresh').set('Cookie', cookie);
    expect(refreshRes.status).toBe(401);
  });
});

describe('GET /auth/me', () => {
  it('should return current user with valid access token', async () => {
    const registerRes = await request(app).post('/auth/register').send(testUser);
    const { accessToken } = registerRes.body;

    const res = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(testUser.email);
  });

  it('should reject request without token', async () => {
    const res = await request(app).get('/auth/me');

    expect(res.status).toBe(401);
  });

  it('should reject request with invalid token', async () => {
    const res = await request(app)
      .get('/auth/me')
      .set('Authorization', 'Bearer invalid-token');

    expect(res.status).toBe(401);
  });
});

describe('GET /health', () => {
  it('should return ok', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});
