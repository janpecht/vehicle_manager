import type { DamageMarking } from '../src/types/damage.ts';
import type { Vehicle } from '../src/types/vehicle.ts';

export const mockVehicle: Vehicle = {
  id: 'v1',
  licensePlate: 'HD-AB 1234',
  label: 'Sprinter 1',
  formLink: null,
  vehicleTypeId: null,
  vehicleType: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

export const mockDamage: DamageMarking = {
  id: 'd1',
  vehicleId: 'v1',
  viewSide: 'LEFT',
  shape: 'CIRCLE',
  x: 0.5,
  y: 0.3,
  width: 0.05,
  height: 0.05,
  description: 'Scratch on door',
  severity: 'MEDIUM',
  createdAt: '2026-01-15T00:00:00Z',
  createdBy: '1',
  repairedAt: null,
  repairedBy: null,
  isActive: true,
};

export const mockRepairedDamage: DamageMarking = {
  ...mockDamage,
  id: 'd2',
  viewSide: 'FRONT',
  description: 'Bumper dent',
  severity: 'HIGH',
  isActive: false,
  repairedAt: '2026-02-01T00:00:00Z',
  repairedBy: 'u2',
};
