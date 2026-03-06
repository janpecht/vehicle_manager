import api from './api.ts';
import type {
  Vehicle,
  PaginatedVehicles,
  CreateVehicleInput,
  UpdateVehicleInput,
} from '../types/vehicle.ts';

export async function listVehicles(params?: {
  search?: string;
  includeInactive?: boolean;
  page?: number;
  limit?: number;
}): Promise<PaginatedVehicles> {
  const { data } = await api.get<PaginatedVehicles>('/api/vehicles', { params });
  return data;
}

export async function getVehicle(id: string): Promise<Vehicle> {
  const { data } = await api.get<{ vehicle: Vehicle }>(`/api/vehicles/${id}`);
  return data.vehicle;
}

export async function createVehicle(input: CreateVehicleInput): Promise<Vehicle> {
  const { data } = await api.post<{ vehicle: Vehicle }>('/api/vehicles', input);
  return data.vehicle;
}

export async function updateVehicle(id: string, input: UpdateVehicleInput): Promise<Vehicle> {
  const { data } = await api.put<{ vehicle: Vehicle }>(`/api/vehicles/${id}`, input);
  return data.vehicle;
}

export async function deleteVehicle(id: string): Promise<void> {
  await api.delete(`/api/vehicles/${id}`);
}
