import { PrismaClient } from '@prisma/client';
import { ConflictError, NotFoundError } from '../utils/errors.js';
import type { CreateVehicleInput, UpdateVehicleInput, VehicleQuery } from './vehicles.schemas.js';

const prisma = new PrismaClient();

export interface VehicleResponse {
  id: string;
  licensePlate: string;
  label: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedVehicles {
  vehicles: VehicleResponse[];
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

export async function getVehicle(id: string): Promise<VehicleResponse> {
  const vehicle = await prisma.vehicle.findUnique({ where: { id } });
  if (!vehicle) {
    throw new NotFoundError('Vehicle not found');
  }
  return vehicle;
}

export async function createVehicle(input: CreateVehicleInput): Promise<VehicleResponse> {
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
    },
  });
}

export async function updateVehicle(
  id: string,
  input: UpdateVehicleInput,
): Promise<VehicleResponse> {
  const vehicle = await prisma.vehicle.findUnique({ where: { id } });
  if (!vehicle) {
    throw new NotFoundError('Vehicle not found');
  }

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
    },
  });
}

export async function deleteVehicle(id: string): Promise<void> {
  const vehicle = await prisma.vehicle.findUnique({ where: { id } });
  if (!vehicle) {
    throw new NotFoundError('Vehicle not found');
  }

  await prisma.vehicle.delete({ where: { id } });
}
