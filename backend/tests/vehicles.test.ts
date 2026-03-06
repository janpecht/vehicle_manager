import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { prisma, app, createTestUser, authHeader as makeAuthHeader } from './helpers.ts';

let accessToken: string;

const testUser = {
  email: 'vehicletest@dieeisfabrik.de',
  password: 'Test1234',
  name: 'Vehicle Test User',
};

beforeAll(async () => {
  await prisma.$connect();

  // Clean up and create test user
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany({ where: { email: testUser.email } });

  const result = await createTestUser(testUser.email, testUser.password, testUser.name);
  accessToken = result.accessToken;
});

afterAll(async () => {
  await prisma.damageMarking.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany({ where: { email: testUser.email } });
  await prisma.$disconnect();
});

beforeEach(async () => {
  await prisma.damageMarking.deleteMany();
  await prisma.vehicle.deleteMany();
});

function authHeader() {
  return makeAuthHeader(accessToken);
}

describe('POST /api/vehicles', () => {
  it('should create a vehicle with valid license plate', async () => {
    const res = await request(app)
      .post('/api/vehicles')
      .set(authHeader())
      .send({ licensePlate: 'HD-AB 1234', label: 'Sprinter 1' });

    expect(res.status).toBe(201);
    expect(res.body.vehicle).toMatchObject({
      licensePlate: 'HD-AB 1234',
      label: 'Sprinter 1',
    });
    expect(res.body.vehicle.id).toBeDefined();
  });

  it('should normalize license plate to uppercase', async () => {
    const res = await request(app)
      .post('/api/vehicles')
      .set(authHeader())
      .send({ licensePlate: 'hd-ab 1234' });

    expect(res.status).toBe(201);
    expect(res.body.vehicle.licensePlate).toBe('HD-AB 1234');
  });

  it('should create a vehicle without label', async () => {
    const res = await request(app)
      .post('/api/vehicles')
      .set(authHeader())
      .send({ licensePlate: 'B-XY 999' });

    expect(res.status).toBe(201);
    expect(res.body.vehicle.label).toBeNull();
  });

  it('should reject duplicate license plate', async () => {
    await request(app)
      .post('/api/vehicles')
      .set(authHeader())
      .send({ licensePlate: 'HD-AB 1234' });

    const res = await request(app)
      .post('/api/vehicles')
      .set(authHeader())
      .send({ licensePlate: 'HD-AB 1234' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('should reject invalid license plate format', async () => {
    const res = await request(app)
      .post('/api/vehicles')
      .set(authHeader())
      .send({ licensePlate: 'INVALID' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should reject various invalid formats', async () => {
    const invalidPlates = ['123', 'A', 'ABCDE-AB 1234', 'HD-ABC 1234', 'HD-AB 12345', ''];
    for (const plate of invalidPlates) {
      const res = await request(app)
        .post('/api/vehicles')
        .set(authHeader())
        .send({ licensePlate: plate });
      expect(res.status).toBe(400, `Expected 400 for plate: "${plate}"`);
    }
  });

  it('should accept valid German plates', async () => {
    const validPlates = ['B-A 1', 'M-XY 42', 'KA-AB 1234', 'HD-AB 1234', 'HH-ZZ 9999'];
    for (const plate of validPlates) {
      await prisma.vehicle.deleteMany();
      const res = await request(app)
        .post('/api/vehicles')
        .set(authHeader())
        .send({ licensePlate: plate });
      expect(res.status).toBe(201, `Expected 201 for plate: "${plate}"`);
    }
  });

  it('should accept E-plates (electric)', async () => {
    const res = await request(app)
      .post('/api/vehicles')
      .set(authHeader())
      .send({ licensePlate: 'HD-AB 1234E' });

    expect(res.status).toBe(201);
  });

  it('should reject request without auth', async () => {
    const res = await request(app)
      .post('/api/vehicles')
      .send({ licensePlate: 'HD-AB 1234' });

    expect(res.status).toBe(401);
  });

  it('should create a vehicle with a form link', async () => {
    const res = await request(app)
      .post('/api/vehicles')
      .set(authHeader())
      .send({ licensePlate: 'HD-AB 1234', formLink: 'https://example.com/form' });

    expect(res.status).toBe(201);
    expect(res.body.vehicle.formLink).toBe('https://example.com/form');
  });

  it('should create a vehicle with null formLink when not provided', async () => {
    const res = await request(app)
      .post('/api/vehicles')
      .set(authHeader())
      .send({ licensePlate: 'HD-AB 1234' });

    expect(res.status).toBe(201);
    expect(res.body.vehicle.formLink).toBeNull();
  });

  it('should reject invalid form link URL', async () => {
    const res = await request(app)
      .post('/api/vehicles')
      .set(authHeader())
      .send({ licensePlate: 'HD-AB 1234', formLink: 'not-a-url' });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/vehicles', () => {
  beforeEach(async () => {
    await prisma.vehicle.createMany({
      data: [
        { licensePlate: 'HD-AB 1234', label: 'Sprinter 1' },
        { licensePlate: 'KA-CD 5678', label: 'Sprinter 2' },
        { licensePlate: 'MA-EF 9012', label: null },
      ],
    });
  });

  it('should list all vehicles', async () => {
    const res = await request(app).get('/api/vehicles').set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.vehicles).toHaveLength(3);
    expect(res.body.total).toBe(3);
    expect(res.body.page).toBe(1);
    expect(res.body.totalPages).toBe(1);
  });

  it('should search by license plate', async () => {
    const res = await request(app)
      .get('/api/vehicles')
      .query({ search: 'HD' })
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.vehicles).toHaveLength(1);
    expect(res.body.vehicles[0].licensePlate).toBe('HD-AB 1234');
  });

  it('should search by label', async () => {
    const res = await request(app)
      .get('/api/vehicles')
      .query({ search: 'Sprinter 2' })
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.vehicles).toHaveLength(1);
    expect(res.body.vehicles[0].label).toBe('Sprinter 2');
  });

  it('should search case-insensitively', async () => {
    const res = await request(app)
      .get('/api/vehicles')
      .query({ search: 'hd' })
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.vehicles).toHaveLength(1);
  });

  it('should paginate results', async () => {
    const res = await request(app)
      .get('/api/vehicles')
      .query({ page: 1, limit: 2 })
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.vehicles).toHaveLength(2);
    expect(res.body.total).toBe(3);
    expect(res.body.totalPages).toBe(2);

    const page2 = await request(app)
      .get('/api/vehicles')
      .query({ page: 2, limit: 2 })
      .set(authHeader());

    expect(page2.body.vehicles).toHaveLength(1);
  });

  it('should return empty for no matches', async () => {
    const res = await request(app)
      .get('/api/vehicles')
      .query({ search: 'NONEXISTENT' })
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.vehicles).toHaveLength(0);
    expect(res.body.total).toBe(0);
  });

  it('should reject request without auth', async () => {
    const res = await request(app).get('/api/vehicles');

    expect(res.status).toBe(401);
  });
});

describe('GET /api/vehicles/:id', () => {
  it('should get a vehicle by id', async () => {
    const created = await prisma.vehicle.create({
      data: { licensePlate: 'HD-AB 1234', label: 'Test' },
    });

    const res = await request(app)
      .get(`/api/vehicles/${created.id}`)
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.vehicle.licensePlate).toBe('HD-AB 1234');
  });

  it('should return 404 for non-existent vehicle', async () => {
    const res = await request(app)
      .get('/api/vehicles/00000000-0000-0000-0000-000000000000')
      .set(authHeader());

    expect(res.status).toBe(404);
  });
});

describe('PUT /api/vehicles/:id', () => {
  it('should update vehicle license plate', async () => {
    const created = await prisma.vehicle.create({
      data: { licensePlate: 'HD-AB 1234', label: 'Old' },
    });

    const res = await request(app)
      .put(`/api/vehicles/${created.id}`)
      .set(authHeader())
      .send({ licensePlate: 'KA-XY 5678' });

    expect(res.status).toBe(200);
    expect(res.body.vehicle.licensePlate).toBe('KA-XY 5678');
    expect(res.body.vehicle.label).toBe('Old');
  });

  it('should update vehicle label', async () => {
    const created = await prisma.vehicle.create({
      data: { licensePlate: 'HD-AB 1234', label: 'Old' },
    });

    const res = await request(app)
      .put(`/api/vehicles/${created.id}`)
      .set(authHeader())
      .send({ label: 'New Label' });

    expect(res.status).toBe(200);
    expect(res.body.vehicle.label).toBe('New Label');
    expect(res.body.vehicle.licensePlate).toBe('HD-AB 1234');
  });

  it('should clear label by setting to null', async () => {
    const created = await prisma.vehicle.create({
      data: { licensePlate: 'HD-AB 1234', label: 'Has Label' },
    });

    const res = await request(app)
      .put(`/api/vehicles/${created.id}`)
      .set(authHeader())
      .send({ label: null });

    expect(res.status).toBe(200);
    expect(res.body.vehicle.label).toBeNull();
  });

  it('should update vehicle form link', async () => {
    const created = await prisma.vehicle.create({
      data: { licensePlate: 'HD-AB 1234' },
    });

    const res = await request(app)
      .put(`/api/vehicles/${created.id}`)
      .set(authHeader())
      .send({ formLink: 'https://example.com/form' });

    expect(res.status).toBe(200);
    expect(res.body.vehicle.formLink).toBe('https://example.com/form');
  });

  it('should clear form link by sending empty string', async () => {
    const created = await prisma.vehicle.create({
      data: { licensePlate: 'HD-AB 1234', formLink: 'https://example.com/form' },
    });

    const res = await request(app)
      .put(`/api/vehicles/${created.id}`)
      .set(authHeader())
      .send({ formLink: '' });

    expect(res.status).toBe(200);
    expect(res.body.vehicle.formLink).toBeNull();
  });

  it('should reject duplicate license plate on update', async () => {
    await prisma.vehicle.create({
      data: { licensePlate: 'HD-AB 1234' },
    });
    const second = await prisma.vehicle.create({
      data: { licensePlate: 'KA-XY 5678' },
    });

    const res = await request(app)
      .put(`/api/vehicles/${second.id}`)
      .set(authHeader())
      .send({ licensePlate: 'HD-AB 1234' });

    expect(res.status).toBe(409);
  });

  it('should return 404 for non-existent vehicle', async () => {
    const res = await request(app)
      .put('/api/vehicles/00000000-0000-0000-0000-000000000000')
      .set(authHeader())
      .send({ label: 'Test' });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/vehicles/:id', () => {
  it('should delete a vehicle', async () => {
    const created = await prisma.vehicle.create({
      data: { licensePlate: 'HD-AB 1234' },
    });

    const res = await request(app)
      .delete(`/api/vehicles/${created.id}`)
      .set(authHeader());

    expect(res.status).toBe(204);

    const found = await prisma.vehicle.findUnique({ where: { id: created.id } });
    expect(found).toBeNull();
  });

  it('should return 404 for non-existent vehicle', async () => {
    const res = await request(app)
      .delete('/api/vehicles/00000000-0000-0000-0000-000000000000')
      .set(authHeader());

    expect(res.status).toBe(404);
  });
});
