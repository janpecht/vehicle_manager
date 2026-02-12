import api from './api.ts';
import type { DamageMarking, CreateDamageInput } from '../types/damage.ts';

export async function listDamages(
  vehicleId: string,
  params?: { viewSide?: string; activeOnly?: boolean },
): Promise<DamageMarking[]> {
  const { data } = await api.get<{ damages: DamageMarking[] }>(
    `/api/vehicles/${vehicleId}/damages`,
    { params },
  );
  return data.damages;
}

export async function createDamage(
  vehicleId: string,
  input: CreateDamageInput,
): Promise<DamageMarking> {
  const { data } = await api.post<{ damage: DamageMarking }>(
    `/api/vehicles/${vehicleId}/damages`,
    input,
  );
  return data.damage;
}

export async function getDamage(
  vehicleId: string,
  damageId: string,
): Promise<DamageMarking> {
  const { data } = await api.get<{ damage: DamageMarking }>(
    `/api/vehicles/${vehicleId}/damages/${damageId}`,
  );
  return data.damage;
}

export async function deleteDamage(
  vehicleId: string,
  damageId: string,
): Promise<void> {
  await api.delete(`/api/vehicles/${vehicleId}/damages/${damageId}`);
}

export async function repairDamage(
  vehicleId: string,
  damageId: string,
): Promise<DamageMarking> {
  const { data } = await api.patch<{ damage: DamageMarking }>(
    `/api/vehicles/${vehicleId}/damages/${damageId}/repair`,
  );
  return data.damage;
}
