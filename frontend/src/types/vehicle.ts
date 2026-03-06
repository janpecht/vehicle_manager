export interface VehicleType {
  id: string;
  name: string;
  frontImage: string | null;
  rearImage: string | null;
  leftImage: string | null;
  rightImage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Vehicle {
  id: string;
  licensePlate: string;
  label: string | null;
  formLink: string | null;
  vehicleTypeId: string | null;
  vehicleType: VehicleType | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  checklistSubmissions?: { mileage: number; submittedAt: string }[];
}

export interface PaginatedVehicles {
  vehicles: Vehicle[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateVehicleInput {
  licensePlate: string;
  label?: string;
  formLink?: string;
  vehicleTypeId?: string | null;
}

export interface UpdateVehicleInput {
  licensePlate?: string;
  label?: string | null;
  formLink?: string | null;
  vehicleTypeId?: string | null;
  isActive?: boolean;
}
