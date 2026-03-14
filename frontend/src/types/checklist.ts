import type { Driver } from './driver.ts';
import type { Vehicle } from './vehicle.ts';

export type DamageVisibility = 'NEW_DAMAGE' | 'KNOWN_DAMAGE' | 'NO_DAMAGE';
export type DashboardWarning = 'OIL' | 'AD_BLUE' | 'SONSTIGE';
export type FuelLevel = 'OK' | 'LOW';

export interface ChecklistSubmission {
  id: string;
  driverId: string;
  vehicleId: string;
  submittedAt: string;
  mileage: number;
  damageVisibility: DamageVisibility;
  dashboardWarnings: DashboardWarning[];
  seatsDirty: boolean;
  smokedInVehicle: boolean;
  foodLeftovers: boolean;
  cargoAreaDirty: boolean;
  freezerTempOk: boolean;
  chargingCablesOk: boolean;
  deliveryNotesPresent: boolean | null;
  fuelLevel: FuelLevel | null;
  carWashNeeded: boolean | null;
  notes: string | null;
  createdAt: string;
  driver: Driver;
  vehicle: Vehicle;
  previousDriverName: string | null;
  previousSubmissionDate: string | null;
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
  dashboardWarnings: DashboardWarning[];
  seatsDirty: boolean;
  smokedInVehicle: boolean;
  foodLeftovers: boolean;
  cargoAreaDirty: boolean;
  freezerTempOk: boolean;
  chargingCablesOk: boolean;
  deliveryNotesPresent?: boolean;
  fuelLevel?: FuelLevel;
  carWashNeeded?: boolean;
  notes?: string;
}

export const DAMAGE_VISIBILITY_LABELS: Record<DamageVisibility, string> = {
  NEW_DAMAGE: 'JA - neuer Schaden',
  KNOWN_DAMAGE: 'JA - bekannte Schäden',
  NO_DAMAGE: 'NEIN',
};

export const DASHBOARD_WARNING_LABELS: Record<DashboardWarning, string> = {
  OIL: 'Ölanzeige',
  AD_BLUE: 'Ad Blue',
  SONSTIGE: 'Sonstige',
};

export const FUEL_LABELS: Record<FuelLevel, string> = {
  OK: 'JA, mehr als halb voll',
  LOW: 'NEIN, weniger als halb voll',
};
