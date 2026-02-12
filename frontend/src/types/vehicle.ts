export interface Vehicle {
  id: string;
  licensePlate: string;
  label: string | null;
  createdAt: string;
  updatedAt: string;
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
}

export interface UpdateVehicleInput {
  licensePlate?: string;
  label?: string | null;
}
