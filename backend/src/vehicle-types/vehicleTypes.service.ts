import { prisma } from '../db.js';
import { ConflictError, NotFoundError } from '../utils/errors.js';
import type { CreateVehicleTypeInput, UpdateVehicleTypeInput, ImageSide } from './vehicleTypes.schemas.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.resolve(__dirname, '../../uploads');

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
  const vehicleType = await findOrThrow(id);

  // Delete associated image files
  const images = [vehicleType.frontImage, vehicleType.rearImage, vehicleType.leftImage, vehicleType.rightImage];
  for (const img of images) {
    if (img) {
      try {
        await fs.unlink(path.join(UPLOADS_DIR, path.basename(img)));
      } catch {
        // File may already be deleted, ignore
      }
    }
  }

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
  filename: string,
): Promise<VehicleTypeResponse> {
  const vehicleType = await findOrThrow(id);

  const field = SIDE_FIELD_MAP[side];
  const oldImage = vehicleType[field];

  // Delete old image file if it exists
  if (oldImage) {
    try {
      await fs.unlink(path.join(UPLOADS_DIR, path.basename(oldImage)));
    } catch {
      // Ignore
    }
  }

  const imagePath = `/uploads/${filename}`;

  return prisma.vehicleType.update({
    where: { id },
    data: { [field]: imagePath },
  });
}
