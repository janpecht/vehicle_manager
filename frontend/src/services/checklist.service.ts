import api from './api.ts';
import type { PaginatedChecklists, ChecklistSubmission, ChecklistPhoto } from '../types/checklist.ts';

interface ChecklistQuery {
  vehicleId?: string;
  driverId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export async function listChecklists(query: ChecklistQuery = {}): Promise<PaginatedChecklists> {
  const { data } = await api.get<PaginatedChecklists>('/api/checklists', { params: query });
  return data;
}

export async function getChecklist(id: string): Promise<ChecklistSubmission> {
  const { data } = await api.get<ChecklistSubmission>(`/api/checklists/${id}`);
  return data;
}

export async function listChecklistPhotos(submissionId: string): Promise<ChecklistPhoto[]> {
  const { data } = await api.get<ChecklistPhoto[]>(`/api/checklists/${submissionId}/photos`);
  return data;
}
