import { prisma } from '../db.js';
import { NotFoundError } from './errors.js';

export async function findVehicleOrThrow(id: string) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id } });
  if (!vehicle) throw new NotFoundError('Vehicle not found');
  return vehicle;
}

export async function findDamageOrThrow(id: string) {
  const damage = await prisma.damageMarking.findUnique({ where: { id } });
  if (!damage) throw new NotFoundError('Damage marking not found');
  return damage;
}
