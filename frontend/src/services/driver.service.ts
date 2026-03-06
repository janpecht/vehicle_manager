import api from './api.ts';
import type { Driver } from '../types/driver.ts';

export async function listDrivers(includeInactive = false): Promise<Driver[]> {
  const { data } = await api.get<Driver[]>('/api/drivers', {
    params: includeInactive ? { includeInactive: 'true' } : {},
  });
  return data;
}

export async function createDriver(name: string): Promise<Driver> {
  const { data } = await api.post<Driver>('/api/drivers', { name });
  return data;
}

export async function updateDriver(id: string, input: { name?: string; isActive?: boolean }): Promise<Driver> {
  const { data } = await api.put<Driver>(`/api/drivers/${id}`, input);
  return data;
}

export async function deleteDriver(id: string): Promise<void> {
  await api.delete(`/api/drivers/${id}`);
}
