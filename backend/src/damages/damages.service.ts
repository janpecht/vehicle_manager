import { PrismaClient } from '@prisma/client';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import type { CreateDamageInput, DamageQuery } from './damages.schemas.js';

const prisma = new PrismaClient();

export async function listDamages(vehicleId: string, query: DamageQuery) {
  // Verify vehicle exists
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle) {
    throw new NotFoundError('Vehicle not found');
  }

  const where: Record<string, unknown> = { vehicleId };
  if (query.viewSide) {
    where.viewSide = query.viewSide;
  }
  if (query.activeOnly) {
    where.isActive = true;
  }

  return prisma.damageMarking.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
}

export async function createDamage(vehicleId: string, userId: string, input: CreateDamageInput) {
  // Verify vehicle exists
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle) {
    throw new NotFoundError('Vehicle not found');
  }

  return prisma.damageMarking.create({
    data: {
      vehicleId,
      createdBy: userId,
      viewSide: input.viewSide,
      shape: input.shape,
      x: input.x,
      y: input.y,
      width: input.width,
      height: input.height,
      description: input.description ?? null,
      severity: input.severity,
    },
  });
}

export async function getDamage(damageId: string) {
  const damage = await prisma.damageMarking.findUnique({ where: { id: damageId } });
  if (!damage) {
    throw new NotFoundError('Damage marking not found');
  }
  return damage;
}

export async function deleteDamage(damageId: string) {
  const damage = await prisma.damageMarking.findUnique({ where: { id: damageId } });
  if (!damage) {
    throw new NotFoundError('Damage marking not found');
  }
  await prisma.damageMarking.delete({ where: { id: damageId } });
}

export async function repairDamage(damageId: string, userId: string) {
  const damage = await prisma.damageMarking.findUnique({ where: { id: damageId } });
  if (!damage) {
    throw new NotFoundError('Damage marking not found');
  }
  if (!damage.isActive) {
    throw new ValidationError('Damage is already repaired');
  }
  return prisma.damageMarking.update({
    where: { id: damageId },
    data: {
      isActive: false,
      repairedAt: new Date(),
      repairedBy: userId,
    },
  });
}
