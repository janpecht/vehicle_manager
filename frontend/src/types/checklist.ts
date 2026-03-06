import type { Driver } from './driver.ts';
import type { Vehicle } from './vehicle.ts';

export type DamageVisibility = 'NEW_DAMAGE' | 'KNOWN_DAMAGE' | 'NO_DAMAGE';
export type CleanlinessLevel = 'CLEAN' | 'SLIGHTLY_DIRTY' | 'VERY_DIRTY';
export type FuelLevel = 'OK' | 'LOW';

export interface ChecklistSubmission {
  id: string;
  driverId: string;
  vehicleId: string;
  submittedAt: string;
  mileage: number;
  damageVisibility: DamageVisibility;
  seatsCleanliness: CleanlinessLevel;
  smokedInVehicle: boolean;
  foodLeftovers: boolean;
  cargoAreaClean: boolean;
  freezerTempOk: boolean;
  chargingCablesOk: boolean;
  deliveryNotesPresent: boolean | null;
  fuelLevel: FuelLevel | null;
  notes: string | null;
  createdAt: string;
  driver: Driver;
  vehicle: Vehicle;
}

export interface ChecklistPhoto {
  id: string;
  submissionId: string;
  filename: string;
  mimeType: string;
  createdAt: string;
}

export interface PaginatedChecklists {
  submissions: ChecklistSubmission[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateChecklistInput {
  driverId: string;
  vehicleId: string;
  mileage: number;
  damageVisibility: DamageVisibility;
  seatsCleanliness: CleanlinessLevel;
  smokedInVehicle: boolean;
  foodLeftovers: boolean;
  cargoAreaClean: boolean;
  freezerTempOk: boolean;
  chargingCablesOk: boolean;
  deliveryNotesPresent?: boolean;
  fuelLevel?: FuelLevel;
  notes?: string;
}

export const DAMAGE_VISIBILITY_LABELS: Record<DamageVisibility, string> = {
  NEW_DAMAGE: 'JA - neuer Schaden',
  KNOWN_DAMAGE: 'JA - bekannte Schäden',
  NO_DAMAGE: 'NEIN',
};

export const CLEANLINESS_LABELS: Record<CleanlinessLevel, string> = {
  CLEAN: 'JA',
  SLIGHTLY_DIRTY: 'NEIN - leicht verdreckt',
  VERY_DIRTY: 'NEIN - stark verdreckt',
};

export const FUEL_LABELS: Record<FuelLevel, string> = {
  OK: 'JA, mehr als halb voll',
  LOW: 'NEIN, weniger als halb voll',
};
