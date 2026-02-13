import { prisma } from '../db.js';
import { ConflictError } from '../utils/errors.js';
import { findVehicleOrThrow } from '../utils/dbHelpers.js';
import type { CreateVehicleInput, UpdateVehicleInput, VehicleQuery } from './vehicles.schemas.js';

const vehicleInclude = { vehicleType: true } as const;

export interface PaginatedVehicles {
  vehicles: unknown[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function listVehicles(query: VehicleQuery): Promise<PaginatedVehicles> {
  const { search, page, limit } = query;
  const skip = (page - 1) * limit;

  const where = search
    ? {
        OR: [
          { licensePlate: { contains: search, mode: 'insensitive' as const } },
          { label: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const [vehicles, total] = await Promise.all([
    prisma.vehicle.findMany({
      where,
      include: vehicleInclude,
      orderBy: { licensePlate: 'asc' },
      skip,
      take: limit,
    }),
    prisma.vehicle.count({ where }),
  ]);

  return {
    vehicles,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getVehicle(id: string) {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: vehicleInclude,
  });
  if (!vehicle) {
    const { NotFoundError } = await import('../utils/errors.js');
    throw new NotFoundError('Vehicle not found');
  }
  return vehicle;
}

export async function createVehicle(input: CreateVehicleInput) {
  const existing = await prisma.vehicle.findUnique({
    where: { licensePlate: input.licensePlate },
  });
  if (existing) {
    throw new ConflictError('A vehicle with this license plate already exists');
  }

  return prisma.vehicle.create({
    data: {
      licensePlate: input.licensePlate,
      label: input.label ?? null,
      formLink: input.formLink || null,
      vehicleTypeId: input.vehicleTypeId ?? null,
    },
    include: vehicleInclude,
  });
}

export async function updateVehicle(
  id: string,
  input: UpdateVehicleInput,
) {
  const vehicle = await findVehicleOrThrow(id);

  if (input.licensePlate && input.licensePlate !== vehicle.licensePlate) {
    const existing = await prisma.vehicle.findUnique({
      where: { licensePlate: input.licensePlate },
    });
    if (existing) {
      throw new ConflictError('A vehicle with this license plate already exists');
    }
  }

  return prisma.vehicle.update({
    where: { id },
    data: {
      ...(input.licensePlate !== undefined && { licensePlate: input.licensePlate }),
      ...(input.label !== undefined && { label: input.label }),
      ...(input.formLink !== undefined && { formLink: input.formLink || null }),
      ...(input.vehicleTypeId !== undefined && { vehicleTypeId: input.vehicleTypeId }),
    },
    include: vehicleInclude,
  });
}

export async function deleteVehicle(id: string): Promise<void> {
  await findVehicleOrThrow(id);
  await prisma.vehicle.delete({ where: { id } });
}
