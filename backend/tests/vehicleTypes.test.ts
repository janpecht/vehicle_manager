import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { prisma, app, createTestUser, authHeader as makeAuthHeader } from './helpers.ts';

let accessToken: string;

const testUser = {
  email: 'vtypetest@dieeisfabrik.de',
  password: 'Test1234',
  name: 'VType Test User',
};

beforeAll(async () => {
  await prisma.$connect();

  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany({ where: { email: testUser.email } });

  const result = await createTestUser(testUser.email, testUser.password, testUser.name);
  accessToken = result.accessToken;
});

afterAll(async () => {
  await prisma.vehicle.updateMany({ where: { vehicleTypeId: { not: null } }, data: { vehicleTypeId: null } });
  await prisma.vehicleType.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany({ where: { email: testUser.email } });
  await prisma.$disconnect();
});

beforeEach(async () => {
  await prisma.vehicle.updateMany({ where: { vehicleTypeId: { not: null } }, data: { vehicleTypeId: null } });
  await prisma.vehicleType.deleteMany();
});

function authHeader() {
  return makeAuthHeader(accessToken);
}

describe('POST /api/vehicle-types', () => {
  it('should create a vehicle type', async () => {
    const res = await request(app)
      .post('/api/vehicle-types')
      .set(authHeader())
      .send({ name: 'Sprinter' });

    expect(res.status).toBe(201);
    expect(res.body.vehicleType).toMatchObject({ name: 'Sprinter' });
    expect(res.body.vehicleType.id).toBeDefined();
    expect(res.body.vehicleType.frontImage).toBeNull();
    expect(res.body.vehicleType.rearImage).toBeNull();
    expect(res.body.vehicleType.leftImage).toBeNull();
    expect(res.body.vehicleType.rightImage).toBeNull();
  });

  it('should reject duplicate name', async () => {
    await request(app)
      .post('/api/vehicle-types')
      .set(authHeader())
      .send({ name: 'Sprinter' });

    const res = await request(app)
      .post('/api/vehicle-types')
      .set(authHeader())
      .send({ name: 'Sprinter' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('should reject empty name', async () => {
    const res = await request(app)
      .post('/api/vehicle-types')
      .set(authHeader())
      .send({ name: '' });

    expect(res.status).toBe(400);
  });

  it('should reject request without auth', async () => {
    const res = await request(app)
      .post('/api/vehicle-types')
      .send({ name: 'Sprinter' });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/vehicle-types', () => {
  beforeEach(async () => {
    await prisma.vehicleType.createMany({
      data: [
        { name: 'Sprinter' },
        { name: 'Vito' },
      ],
    });
  });

  it('should list all vehicle types', async () => {
    const res = await request(app)
      .get('/api/vehicle-types')
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.vehicleTypes).toHaveLength(2);
    // Ordered by name asc
    expect(res.body.vehicleTypes[0].name).toBe('Sprinter');
    expect(res.body.vehicleTypes[1].name).toBe('Vito');
  });

  it('should reject request without auth', async () => {
    const res = await request(app).get('/api/vehicle-types');

    expect(res.status).toBe(401);
  });
});

describe('GET /api/vehicle-types/:id', () => {
  it('should get a vehicle type by id', async () => {
    const created = await prisma.vehicleType.create({
      data: { name: 'Sprinter' },
    });

    const res = await request(app)
      .get(`/api/vehicle-types/${created.id}`)
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.vehicleType.name).toBe('Sprinter');
  });

  it('should return 404 for non-existent vehicle type', async () => {
    const res = await request(app)
      .get('/api/vehicle-types/00000000-0000-0000-0000-000000000000')
      .set(authHeader());

    expect(res.status).toBe(404);
  });
});

describe('PUT /api/vehicle-types/:id', () => {
  it('should update vehicle type name', async () => {
    const created = await prisma.vehicleType.create({
      data: { name: 'Sprinter' },
    });

    const res = await request(app)
      .put(`/api/vehicle-types/${created.id}`)
      .set(authHeader())
      .send({ name: 'Sprinter XL' });

    expect(res.status).toBe(200);
    expect(res.body.vehicleType.name).toBe('Sprinter XL');
  });

  it('should reject duplicate name on update', async () => {
    await prisma.vehicleType.create({ data: { name: 'Sprinter' } });
    const vito = await prisma.vehicleType.create({ data: { name: 'Vito' } });

    const res = await request(app)
      .put(`/api/vehicle-types/${vito.id}`)
      .set(authHeader())
      .send({ name: 'Sprinter' });

    expect(res.status).toBe(409);
  });

  it('should return 404 for non-existent vehicle type', async () => {
    const res = await request(app)
      .put('/api/vehicle-types/00000000-0000-0000-0000-000000000000')
      .set(authHeader())
      .send({ name: 'Test' });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/vehicle-types/:id', () => {
  it('should delete a vehicle type', async () => {
    const created = await prisma.vehicleType.create({
      data: { name: 'Sprinter' },
    });

    const res = await request(app)
      .delete(`/api/vehicle-types/${created.id}`)
      .set(authHeader());

    expect(res.status).toBe(204);

    const found = await prisma.vehicleType.findUnique({ where: { id: created.id } });
    expect(found).toBeNull();
  });

  it('should return 404 for non-existent vehicle type', async () => {
    const res = await request(app)
      .delete('/api/vehicle-types/00000000-0000-0000-0000-000000000000')
      .set(authHeader());

    expect(res.status).toBe(404);
  });
});

describe('POST /api/vehicle-types/:id/images/:side', () => {
  it('should upload a front image', async () => {
    const created = await prisma.vehicleType.create({
      data: { name: 'Sprinter' },
    });

    const res = await request(app)
      .post(`/api/vehicle-types/${created.id}/images/front`)
      .set(authHeader())
      .attach('image', Buffer.from('fake-png-data'), { filename: 'front.png', contentType: 'image/png' });

    expect(res.status).toBe(200);
    expect(res.body.vehicleType.frontImage).toMatch(/^\/uploads\/.+\.png$/);
  });

  it('should reject invalid side', async () => {
    const created = await prisma.vehicleType.create({
      data: { name: 'Sprinter' },
    });

    const res = await request(app)
      .post(`/api/vehicle-types/${created.id}/images/top`)
      .set(authHeader())
      .attach('image', Buffer.from('fake-png'), { filename: 'test.png', contentType: 'image/png' });

    expect(res.status).toBe(400);
  });

  it('should reject non-image file', async () => {
    const created = await prisma.vehicleType.create({
      data: { name: 'Sprinter' },
    });

    const res = await request(app)
      .post(`/api/vehicle-types/${created.id}/images/front`)
      .set(authHeader())
      .attach('image', Buffer.from('not-an-image'), { filename: 'test.txt', contentType: 'text/plain' });

    expect(res.status).toBe(500); // multer error propagates
  });

  it('should reject request without file', async () => {
    const created = await prisma.vehicleType.create({
      data: { name: 'Sprinter' },
    });

    const res = await request(app)
      .post(`/api/vehicle-types/${created.id}/images/front`)
      .set(authHeader());

    expect(res.status).toBe(400);
  });

  it('should return 404 for non-existent vehicle type', async () => {
    const res = await request(app)
      .post('/api/vehicle-types/00000000-0000-0000-0000-000000000000/images/front')
      .set(authHeader())
      .attach('image', Buffer.from('fake-png'), { filename: 'test.png', contentType: 'image/png' });

    expect(res.status).toBe(404);
  });
});

describe('Vehicle with vehicleType', () => {
  it('should create a vehicle with vehicleTypeId', async () => {
    const vt = await prisma.vehicleType.create({ data: { name: 'Sprinter' } });

    const res = await request(app)
      .post('/api/vehicles')
      .set(authHeader())
      .send({ licensePlate: 'HD-VT 1234', vehicleTypeId: vt.id });

    expect(res.status).toBe(201);
    expect(res.body.vehicle.vehicleType).toMatchObject({ name: 'Sprinter' });

    // Clean up
    await prisma.vehicle.deleteMany({ where: { licensePlate: 'HD-VT 1234' } });
  });

  it('should return vehicleType in vehicle get', async () => {
    const vt = await prisma.vehicleType.create({ data: { name: 'Vito' } });
    const v = await prisma.vehicle.create({
      data: { licensePlate: 'HD-VT 5678', vehicleTypeId: vt.id },
    });

    const res = await request(app)
      .get(`/api/vehicles/${v.id}`)
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.vehicle.vehicleType.name).toBe('Vito');

    // Clean up
    await prisma.vehicle.deleteMany({ where: { licensePlate: 'HD-VT 5678' } });
  });
});
