import { prisma } from '../db.js';
import { ValidationError } from '../utils/errors.js';
import { findVehicleOrThrow, findDamageOrThrow } from '../utils/dbHelpers.js';
import type { CreateDamageInput, UpdateDamagePositionInput, DamageQuery } from './damages.schemas.js';

export async function listDamages(vehicleId: string, query: DamageQuery) {
  await findVehicleOrThrow(vehicleId);

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
  await findVehicleOrThrow(vehicleId);

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
  return findDamageOrThrow(damageId);
}

export async function updateDamagePosition(damageId: string, input: UpdateDamagePositionInput) {
  await findDamageOrThrow(damageId);
  return prisma.damageMarking.update({
    where: { id: damageId },
    data: { x: input.x, y: input.y },
  });
}

export async function deleteDamage(damageId: string) {
  await findDamageOrThrow(damageId);
  await prisma.damageMarking.delete({ where: { id: damageId } });
}

export async function repairDamage(damageId: string, userId: string) {
  const damage = await findDamageOrThrow(damageId);
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
