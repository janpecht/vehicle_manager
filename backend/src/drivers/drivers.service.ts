import { prisma } from '../db.js';
import { NotFoundError } from '../utils/errors.js';
import type { CreateDriverInput, UpdateDriverInput } from './drivers.schemas.js';

export async function listDrivers(includeInactive = false) {
  return prisma.driver.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: { name: 'asc' },
  });
}

export async function getDriver(id: string) {
  const driver = await prisma.driver.findUnique({ where: { id } });
  if (!driver) throw new NotFoundError('Driver not found');
  return driver;
}

export async function createDriver(input: CreateDriverInput) {
  return prisma.driver.create({ data: { name: input.name } });
}

export async function updateDriver(id: string, input: UpdateDriverInput) {
  await getDriver(id);
  return prisma.driver.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    },
  });
}

export async function deleteDriver(id: string) {
  await getDriver(id);
  await prisma.driver.delete({ where: { id } });
}
