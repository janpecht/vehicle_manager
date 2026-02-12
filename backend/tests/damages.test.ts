import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = createApp();

let accessToken: string;
let userId: string;
let vehicleId: string;

const testUser = {
  email: 'damagetest@test.de',
  password: 'Test1234',
  name: 'Damage Test User',
};

const validDamage = {
  viewSide: 'LEFT',
  shape: 'CIRCLE',
  x: 0.5,
  y: 0.3,
  width: 0.05,
  height: 0.05,
  description: 'Scratch on left panel',
  severity: 'MEDIUM',
};

beforeAll(async () => {
  await prisma.$connect();

  // Clean up
  await prisma.damageMarking.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany({ where: { email: testUser.email } });

  // Create test user
  const res = await request(app).post('/auth/register').send(testUser);
  accessToken = res.body.accessToken;
  userId = res.body.user.id;
});

afterAll(async () => {
  await prisma.damageMarking.deleteMany();
  await prisma.vehicle.deleteMany({ where: { licensePlate: { startsWith: 'HD-DM' } } });
  await prisma.vehicle.deleteMany({ where: { licensePlate: 'B-XY 999' } });
  await prisma.vehicle.deleteMany({ where: { licensePlate: 'M-CD 5678' } });
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany({ where: { email: testUser.email } });
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clean damages and recreate vehicle each time to avoid conflicts with parallel vehicle tests
  await prisma.damageMarking.deleteMany();
  await prisma.vehicle.deleteMany({ where: { licensePlate: { startsWith: 'HD-DM' } } });

  const v = await prisma.vehicle.create({
    data: { licensePlate: 'HD-DM 1234', label: 'Damage Test Van' },
  });
  vehicleId = v.id;
});

function authHeader() {
  return { Authorization: `Bearer ${accessToken}` };
}

function damageUrl(vId = vehicleId) {
  return `/api/vehicles/${vId}/damages`;
}

describe('POST /api/vehicles/:vehicleId/damages', () => {
  it('should create a circle damage with all fields', async () => {
    const res = await request(app)
      .post(damageUrl())
      .set(authHeader())
      .send(validDamage);

    expect(res.status).toBe(201);
    expect(res.body.damage).toMatchObject({
      vehicleId,
      viewSide: 'LEFT',
      shape: 'CIRCLE',
      x: 0.5,
      y: 0.3,
      width: 0.05,
      height: 0.05,
      description: 'Scratch on left panel',
      severity: 'MEDIUM',
      isActive: true,
      createdBy: userId,
    });
    expect(res.body.damage.id).toBeDefined();
    expect(res.body.damage.createdAt).toBeDefined();
    expect(res.body.damage.repairedAt).toBeNull();
    expect(res.body.damage.repairedBy).toBeNull();
  });

  it('should create a rectangle damage', async () => {
    const res = await request(app)
      .post(damageUrl())
      .set(authHeader())
      .send({ ...validDamage, shape: 'RECTANGLE', viewSide: 'FRONT' });

    expect(res.status).toBe(201);
    expect(res.body.damage.shape).toBe('RECTANGLE');
    expect(res.body.damage.viewSide).toBe('FRONT');
  });

  it('should create a damage without description', async () => {
    const { description: _, ...noDesc } = validDamage;
    const res = await request(app)
      .post(damageUrl())
      .set(authHeader())
      .send(noDesc);

    expect(res.status).toBe(201);
    expect(res.body.damage.description).toBeNull();
  });

  it('should reject x < 0', async () => {
    const res = await request(app)
      .post(damageUrl())
      .set(authHeader())
      .send({ ...validDamage, x: -0.1 });

    expect(res.status).toBe(400);
  });

  it('should reject x > 1', async () => {
    const res = await request(app)
      .post(damageUrl())
      .set(authHeader())
      .send({ ...validDamage, x: 1.1 });

    expect(res.status).toBe(400);
  });

  it('should reject y < 0', async () => {
    const res = await request(app)
      .post(damageUrl())
      .set(authHeader())
      .send({ ...validDamage, y: -0.5 });

    expect(res.status).toBe(400);
  });

  it('should reject y > 1', async () => {
    const res = await request(app)
      .post(damageUrl())
      .set(authHeader())
      .send({ ...validDamage, y: 2 });

    expect(res.status).toBe(400);
  });

  it('should reject width < 0.01', async () => {
    const res = await request(app)
      .post(damageUrl())
      .set(authHeader())
      .send({ ...validDamage, width: 0.001 });

    expect(res.status).toBe(400);
  });

  it('should reject width > 1', async () => {
    const res = await request(app)
      .post(damageUrl())
      .set(authHeader())
      .send({ ...validDamage, width: 1.5 });

    expect(res.status).toBe(400);
  });

  it('should reject height < 0.01', async () => {
    const res = await request(app)
      .post(damageUrl())
      .set(authHeader())
      .send({ ...validDamage, height: 0 });

    expect(res.status).toBe(400);
  });

  it('should reject invalid viewSide', async () => {
    const res = await request(app)
      .post(damageUrl())
      .set(authHeader())
      .send({ ...validDamage, viewSide: 'TOP' });

    expect(res.status).toBe(400);
  });

  it('should reject invalid shape', async () => {
    const res = await request(app)
      .post(damageUrl())
      .set(authHeader())
      .send({ ...validDamage, shape: 'TRIANGLE' });

    expect(res.status).toBe(400);
  });

  it('should reject invalid severity', async () => {
    const res = await request(app)
      .post(damageUrl())
      .set(authHeader())
      .send({ ...validDamage, severity: 'CRITICAL' });

    expect(res.status).toBe(400);
  });

  it('should reject description > 500 chars', async () => {
    const res = await request(app)
      .post(damageUrl())
      .set(authHeader())
      .send({ ...validDamage, description: 'a'.repeat(501) });

    expect(res.status).toBe(400);
  });

  it('should return 404 for non-existent vehicle', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await request(app)
      .post(damageUrl(fakeId))
      .set(authHeader())
      .send(validDamage);

    expect(res.status).toBe(404);
  });

  it('should return 401 without auth token', async () => {
    const res = await request(app)
      .post(damageUrl())
      .send(validDamage);

    expect(res.status).toBe(401);
  });

  it('should accept boundary values x=0, y=0, x=1, y=1', async () => {
    const res = await request(app)
      .post(damageUrl())
      .set(authHeader())
      .send({ ...validDamage, x: 0, y: 0 });

    expect(res.status).toBe(201);

    const res2 = await request(app)
      .post(damageUrl())
      .set(authHeader())
      .send({ ...validDamage, x: 1, y: 1 });

    expect(res2.status).toBe(201);
  });
});

describe('GET /api/vehicles/:vehicleId/damages', () => {
  it('should return empty array when no damages', async () => {
    const res = await request(app)
      .get(damageUrl())
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.damages).toEqual([]);
  });

  it('should return active damages by default', async () => {
    // Create active damage
    await request(app).post(damageUrl()).set(authHeader()).send(validDamage);

    // Create inactive damage directly
    await prisma.damageMarking.create({
      data: {
        vehicleId,
        createdBy: userId,
        viewSide: 'LEFT',
        shape: 'CIRCLE',
        x: 0.2,
        y: 0.2,
        width: 0.05,
        height: 0.05,
        severity: 'LOW',
        isActive: false,
      },
    });

    const res = await request(app)
      .get(damageUrl())
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.damages).toHaveLength(1);
    expect(res.body.damages[0].isActive).toBe(true);
  });

  it('should return all damages when activeOnly=false', async () => {
    await request(app).post(damageUrl()).set(authHeader()).send(validDamage);

    await prisma.damageMarking.create({
      data: {
        vehicleId,
        createdBy: userId,
        viewSide: 'LEFT',
        shape: 'CIRCLE',
        x: 0.2,
        y: 0.2,
        width: 0.05,
        height: 0.05,
        severity: 'LOW',
        isActive: false,
      },
    });

    const res = await request(app)
      .get(`${damageUrl()}?activeOnly=false`)
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.damages).toHaveLength(2);
  });

  it('should filter by viewSide', async () => {
    await request(app).post(damageUrl()).set(authHeader())
      .send({ ...validDamage, viewSide: 'LEFT' });
    await request(app).post(damageUrl()).set(authHeader())
      .send({ ...validDamage, viewSide: 'FRONT' });
    await request(app).post(damageUrl()).set(authHeader())
      .send({ ...validDamage, viewSide: 'LEFT' });

    const res = await request(app)
      .get(`${damageUrl()}?viewSide=LEFT`)
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.damages).toHaveLength(2);
    expect(res.body.damages.every((d: { viewSide: string }) => d.viewSide === 'LEFT')).toBe(true);
  });

  it('should order by createdAt desc', async () => {
    await request(app).post(damageUrl()).set(authHeader())
      .send({ ...validDamage, description: 'first' });
    // Small delay to ensure different createdAt timestamps
    await new Promise((r) => setTimeout(r, 10));
    await request(app).post(damageUrl()).set(authHeader())
      .send({ ...validDamage, description: 'second' });

    const res = await request(app)
      .get(damageUrl())
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.damages).toHaveLength(2);
    expect(res.body.damages[0].description).toBe('second');
    expect(res.body.damages[1].description).toBe('first');
  });

  it('should return 404 for non-existent vehicle', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await request(app)
      .get(damageUrl(fakeId))
      .set(authHeader());

    expect(res.status).toBe(404);
  });

  it('should not return damages from another vehicle', async () => {
    // Create another vehicle
    const v2 = await prisma.vehicle.create({
      data: { licensePlate: 'B-XY 999' },
    });

    // Create damage on original vehicle
    await request(app).post(damageUrl()).set(authHeader()).send(validDamage);

    // Query damage on second vehicle — should be empty
    const res = await request(app)
      .get(damageUrl(v2.id))
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.damages).toHaveLength(0);

    // Clean up second vehicle
    await prisma.vehicle.delete({ where: { id: v2.id } });
  });
});

describe('GET /api/vehicles/:vehicleId/damages/:damageId', () => {
  it('should return a single damage', async () => {
    const createRes = await request(app)
      .post(damageUrl())
      .set(authHeader())
      .send(validDamage);
    const damageId = createRes.body.damage.id;

    const res = await request(app)
      .get(`${damageUrl()}/${damageId}`)
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.damage.id).toBe(damageId);
    expect(res.body.damage.description).toBe('Scratch on left panel');
  });

  it('should return 404 for non-existent damage', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await request(app)
      .get(`${damageUrl()}/${fakeId}`)
      .set(authHeader());

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/vehicles/:vehicleId/damages/:damageId', () => {
  it('should delete a damage', async () => {
    const createRes = await request(app)
      .post(damageUrl())
      .set(authHeader())
      .send(validDamage);
    const damageId = createRes.body.damage.id;

    const res = await request(app)
      .delete(`${damageUrl()}/${damageId}`)
      .set(authHeader());

    expect(res.status).toBe(204);

    // Verify it's gone
    const getRes = await request(app)
      .get(`${damageUrl()}/${damageId}`)
      .set(authHeader());
    expect(getRes.status).toBe(404);
  });

  it('should return 404 for non-existent damage', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await request(app)
      .delete(`${damageUrl()}/${fakeId}`)
      .set(authHeader());

    expect(res.status).toBe(404);
  });

  it('should return 401 without auth token', async () => {
    const createRes = await request(app)
      .post(damageUrl())
      .set(authHeader())
      .send(validDamage);
    const damageId = createRes.body.damage.id;

    const res = await request(app)
      .delete(`${damageUrl()}/${damageId}`);

    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/vehicles/:vehicleId/damages/:damageId/repair', () => {
  function repairUrl(damageId: string, vId = vehicleId) {
    return `${damageUrl(vId)}/${damageId}/repair`;
  }

  it('should repair an active damage', async () => {
    const createRes = await request(app)
      .post(damageUrl())
      .set(authHeader())
      .send(validDamage);
    const damageId = createRes.body.damage.id;

    const res = await request(app)
      .patch(repairUrl(damageId))
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.damage.isActive).toBe(false);
    expect(res.body.damage.repairedAt).toBeDefined();
    expect(res.body.damage.repairedBy).toBe(userId);
  });

  it('should return 400 for already-repaired damage', async () => {
    const createRes = await request(app)
      .post(damageUrl())
      .set(authHeader())
      .send(validDamage);
    const damageId = createRes.body.damage.id;

    // Repair once
    await request(app)
      .patch(repairUrl(damageId))
      .set(authHeader());

    // Repair again
    const res = await request(app)
      .patch(repairUrl(damageId))
      .set(authHeader());

    expect(res.status).toBe(400);
  });

  it('should return 404 for non-existent damage', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await request(app)
      .patch(repairUrl(fakeId))
      .set(authHeader());

    expect(res.status).toBe(404);
  });

  it('should return 401 without auth', async () => {
    const createRes = await request(app)
      .post(damageUrl())
      .set(authHeader())
      .send(validDamage);
    const damageId = createRes.body.damage.id;

    const res = await request(app)
      .patch(repairUrl(damageId));

    expect(res.status).toBe(401);
  });

  it('should exclude repaired damage from activeOnly=true list', async () => {
    const createRes = await request(app)
      .post(damageUrl())
      .set(authHeader())
      .send(validDamage);
    const damageId = createRes.body.damage.id;

    await request(app)
      .patch(repairUrl(damageId))
      .set(authHeader());

    const res = await request(app)
      .get(damageUrl())
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.damages).toHaveLength(0);
  });

  it('should include repaired damage in activeOnly=false list', async () => {
    const createRes = await request(app)
      .post(damageUrl())
      .set(authHeader())
      .send(validDamage);
    const damageId = createRes.body.damage.id;

    await request(app)
      .patch(repairUrl(damageId))
      .set(authHeader());

    const res = await request(app)
      .get(`${damageUrl()}?activeOnly=false`)
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.damages).toHaveLength(1);
    expect(res.body.damages[0].isActive).toBe(false);
  });

  it('should have a valid ISO date for repairedAt', async () => {
    const createRes = await request(app)
      .post(damageUrl())
      .set(authHeader())
      .send(validDamage);
    const damageId = createRes.body.damage.id;

    const res = await request(app)
      .patch(repairUrl(damageId))
      .set(authHeader());

    const date = new Date(res.body.damage.repairedAt);
    expect(date.toISOString()).toBe(res.body.damage.repairedAt);
  });

  it('should set repairedBy to the authenticated user', async () => {
    const createRes = await request(app)
      .post(damageUrl())
      .set(authHeader())
      .send(validDamage);
    const damageId = createRes.body.damage.id;

    const res = await request(app)
      .patch(repairUrl(damageId))
      .set(authHeader());

    expect(res.body.damage.repairedBy).toBe(userId);
    expect(res.body.damage.createdBy).toBe(userId);
  });
});

describe('Cascade delete', () => {
  it('should delete damages when vehicle is deleted', async () => {
    // Create a separate vehicle for this test
    const cascadeVehicle = await prisma.vehicle.create({
      data: { licensePlate: 'M-CD 5678' },
    });

    // Create damage on it
    await request(app)
      .post(damageUrl(cascadeVehicle.id))
      .set(authHeader())
      .send(validDamage);

    // Verify damage exists
    const listRes = await request(app)
      .get(damageUrl(cascadeVehicle.id))
      .set(authHeader());
    expect(listRes.body.damages).toHaveLength(1);

    // Delete vehicle via API
    await request(app)
      .delete(`/api/vehicles/${cascadeVehicle.id}`)
      .set(authHeader());

    // Verify damages are gone (at DB level)
    const count = await prisma.damageMarking.count({
      where: { vehicleId: cascadeVehicle.id },
    });
    expect(count).toBe(0);
  });
});
