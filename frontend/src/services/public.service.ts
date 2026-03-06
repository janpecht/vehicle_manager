import axios from 'axios';
import type { Vehicle } from '../types/vehicle.ts';
import type { Driver } from '../types/driver.ts';
import type { DamageMarking } from '../types/damage.ts';
import type { ChecklistSubmission, ChecklistPhoto, CreateChecklistInput } from '../types/checklist.ts';

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

/** List all vehicles (for public checklist form dropdown) */
export async function getPublicVehicles(): Promise<Vehicle[]> {
  const { data } = await axios.get<Vehicle[]>('/public/vehicles');
  return data;
}

/** List active drivers (for public checklist form dropdown) */
export async function getPublicDrivers(): Promise<Driver[]> {
  const { data } = await axios.get<Driver[]>('/public/drivers');
  return data;
}

/** Submit a checklist form (public, no auth) */
export async function submitChecklist(input: CreateChecklistInput): Promise<ChecklistSubmission> {
  const { data } = await axios.post<ChecklistSubmission>('/public/checklist', input);
  return data;
}

/** Upload damage photos for a checklist submission */
export async function uploadChecklistPhotos(submissionId: string, files: File[]): Promise<{ photos: ChecklistPhoto[] }> {
  const formData = new FormData();
  for (const file of files) {
    formData.append('photos', file);
  }
  const { data } = await axios.post<{ photos: ChecklistPhoto[] }>(
    `/public/checklist/${submissionId}/photos`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data;
}
