import { prisma } from '../db.js';
import { ConflictError, NotFoundError } from '../utils/errors.js';
import type { CreateVehicleTypeInput, UpdateVehicleTypeInput, ImageSide } from './vehicleTypes.schemas.js';

export interface VehicleTypeResponse {
  id: string;
  name: string;
  frontImage: string | null;
  rearImage: string | null;
  leftImage: string | null;
  rightImage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

async function findOrThrow(id: string): Promise<VehicleTypeResponse> {
  const vehicleType = await prisma.vehicleType.findUnique({ where: { id } });
  if (!vehicleType) {
    throw new NotFoundError('Vehicle type not found');
  }
  return vehicleType;
}

export async function listVehicleTypes(): Promise<VehicleTypeResponse[]> {
  return prisma.vehicleType.findMany({ orderBy: { name: 'asc' } });
}

export async function getVehicleType(id: string): Promise<VehicleTypeResponse> {
  return findOrThrow(id);
}

export async function createVehicleType(input: CreateVehicleTypeInput): Promise<VehicleTypeResponse> {
  const existing = await prisma.vehicleType.findUnique({ where: { name: input.name } });
  if (existing) {
    throw new ConflictError('A vehicle type with this name already exists');
  }

  return prisma.vehicleType.create({
    data: { name: input.name },
  });
}

export async function updateVehicleType(
  id: string,
  input: UpdateVehicleTypeInput,
): Promise<VehicleTypeResponse> {
  const vehicleType = await findOrThrow(id);

  if (input.name && input.name !== vehicleType.name) {
    const existing = await prisma.vehicleType.findUnique({ where: { name: input.name } });
    if (existing) {
      throw new ConflictError('A vehicle type with this name already exists');
    }
  }

  return prisma.vehicleType.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
    },
  });
}

export async function deleteVehicleType(id: string): Promise<void> {
  await findOrThrow(id);
  // Images are cascade-deleted via the DB foreign key
  await prisma.vehicleType.delete({ where: { id } });
}

const SIDE_FIELD_MAP: Record<ImageSide, 'frontImage' | 'rearImage' | 'leftImage' | 'rightImage'> = {
  front: 'frontImage',
  rear: 'rearImage',
  left: 'leftImage',
  right: 'rightImage',
};

export async function setImage(
  id: string,
  side: ImageSide,
  imageData: Buffer,
  mimeType: string,
): Promise<VehicleTypeResponse> {
  await findOrThrow(id);

  const field = SIDE_FIELD_MAP[side];
  const imageUrl = `/api/vehicle-type-images/${id}/${side}?v=${Date.now()}`;

  // Upsert the image record in the DB
  await prisma.vehicleTypeImage.upsert({
    where: { vehicleTypeId_side: { vehicleTypeId: id, side } },
    update: { data: imageData, mimeType },
    create: { vehicleTypeId: id, side, data: imageData, mimeType },
  });

  return prisma.vehicleType.update({
    where: { id },
    data: { [field]: imageUrl },
  });
}

export async function getImage(
  vehicleTypeId: string,
  side: string,
): Promise<{ data: Buffer; mimeType: string } | null> {
  const image = await prisma.vehicleTypeImage.findUnique({
    where: { vehicleTypeId_side: { vehicleTypeId, side } },
  });
  if (!image) return null;
  return { data: Buffer.from(image.data), mimeType: image.mimeType };
}
