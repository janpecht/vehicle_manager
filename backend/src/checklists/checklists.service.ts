import { prisma } from '../db.js';
import { NotFoundError } from '../utils/errors.js';
import type { CreateChecklistInput, ChecklistQuery } from './checklists.schemas.js';

const checklistInclude = {
  driver: true,
  vehicle: { include: { vehicleType: true } },
} as const;

export async function createChecklist(input: CreateChecklistInput) {
  // Verify driver and vehicle exist
  const [driver, vehicle] = await Promise.all([
    prisma.driver.findUnique({ where: { id: input.driverId } }),
    prisma.vehicle.findUnique({ where: { id: input.vehicleId } }),
  ]);
  if (!driver) throw new NotFoundError('Driver not found');
  if (!vehicle) throw new NotFoundError('Vehicle not found');

  return prisma.checklistSubmission.create({
    data: {
      driverId: input.driverId,
      vehicleId: input.vehicleId,
      mileage: input.mileage,
      damageVisibility: input.damageVisibility,
      seatsCleanliness: input.seatsCleanliness,
      smokedInVehicle: input.smokedInVehicle,
      foodLeftovers: input.foodLeftovers,
      cargoAreaClean: input.cargoAreaClean,
      freezerTempOk: input.freezerTempOk,
      chargingCablesOk: input.chargingCablesOk,
      deliveryNotesPresent: input.deliveryNotesPresent ?? null,
      fuelLevel: input.fuelLevel ?? null,
      notes: input.notes ?? null,
    },
    include: checklistInclude,
  });
}

export async function listChecklists(query: ChecklistQuery) {
  const { vehicleId, driverId, dateFrom, dateTo, page, limit } = query;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (vehicleId) where.vehicleId = vehicleId;
  if (driverId) where.driverId = driverId;
  if (dateFrom || dateTo) {
    const dateFilter: Record<string, Date> = {};
    if (dateFrom) dateFilter.gte = new Date(dateFrom);
    if (dateTo) {
      const end = new Date(dateTo);
      end.setDate(end.getDate() + 1);
      dateFilter.lt = end;
    }
    where.submittedAt = dateFilter;
  }

  const [submissions, total] = await Promise.all([
    prisma.checklistSubmission.findMany({
      where,
      include: checklistInclude,
      orderBy: { submittedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.checklistSubmission.count({ where }),
  ]);

  return {
    submissions,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getChecklist(id: string) {
  const submission = await prisma.checklistSubmission.findUnique({
    where: { id },
    include: checklistInclude,
  });
  if (!submission) throw new NotFoundError('Checklist submission not found');
  return submission;
}

export async function addPhoto(
  submissionId: string,
  data: Buffer,
  mimeType: string,
  filename: string,
) {
  // Verify submission exists
  const submission = await prisma.checklistSubmission.findUnique({ where: { id: submissionId } });
  if (!submission) throw new NotFoundError('Checklist submission not found');

  return prisma.checklistPhoto.create({
    data: { submissionId, data, mimeType, filename },
    select: { id: true, submissionId: true, filename: true, mimeType: true, createdAt: true },
  });
}

export async function getPhoto(photoId: string) {
  const photo = await prisma.checklistPhoto.findUnique({ where: { id: photoId } });
  if (!photo) return null;
  return { data: Buffer.from(photo.data), mimeType: photo.mimeType, filename: photo.filename };
}

export async function listPhotos(submissionId: string) {
  return prisma.checklistPhoto.findMany({
    where: { submissionId },
    select: { id: true, submissionId: true, filename: true, mimeType: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
}
