import api from './api.ts';
import type { VehicleType } from '../types/vehicle.ts';

export async function listVehicleTypes(): Promise<VehicleType[]> {
  const { data } = await api.get<{ vehicleTypes: VehicleType[] }>('/api/vehicle-types');
  return data.vehicleTypes;
}

export async function getVehicleType(id: string): Promise<VehicleType> {
  const { data } = await api.get<{ vehicleType: VehicleType }>(`/api/vehicle-types/${id}`);
  return data.vehicleType;
}

export async function createVehicleType(name: string): Promise<VehicleType> {
  const { data } = await api.post<{ vehicleType: VehicleType }>('/api/vehicle-types', { name });
  return data.vehicleType;
}

export async function updateVehicleType(id: string, name: string): Promise<VehicleType> {
  const { data } = await api.put<{ vehicleType: VehicleType }>(`/api/vehicle-types/${id}`, { name });
  return data.vehicleType;
}

export async function deleteVehicleType(id: string): Promise<void> {
  await api.delete(`/api/vehicle-types/${id}`);
}

export async function uploadVehicleTypeImage(
  id: string,
  side: 'front' | 'rear' | 'left' | 'right',
  file: File,
): Promise<VehicleType> {
  const formData = new FormData();
  formData.append('image', file);
  const { data } = await api.post<{ vehicleType: VehicleType }>(
    `/api/vehicle-types/${id}/images/${side}`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data.vehicleType;
}
