import axios from 'axios';
import type { Vehicle } from '../types/vehicle.ts';
import type { DamageMarking } from '../types/damage.ts';

/** Fetch vehicle report data from public (unauthenticated) endpoint */
export async function getPublicReport(vehicleId: string): Promise<{
  vehicle: Vehicle;
  damages: DamageMarking[];
}> {
  const { data } = await axios.get<{ vehicle: Vehicle; damages: DamageMarking[] }>(
    `/public/vehicles/${vehicleId}/report`,
  );
  return data;
}
