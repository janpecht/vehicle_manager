export type ViewSide = 'FRONT' | 'REAR' | 'LEFT' | 'RIGHT';
export type Shape = 'CIRCLE' | 'RECTANGLE';
export type Severity = 'LOW' | 'MEDIUM' | 'HIGH';
export type CanvasTool = 'CIRCLE' | 'RECTANGLE';

export interface DamageMarking {
  id: string;
  vehicleId: string;
  viewSide: ViewSide;
  shape: Shape;
  x: number;
  y: number;
  width: number;
  height: number;
  description: string | null;
  severity: Severity;
  createdAt: string;
  createdBy: string;
  repairedAt: string | null;
  repairedBy: string | null;
  isActive: boolean;
}

export interface CreateDamageInput {
  viewSide: ViewSide;
  shape: Shape;
  x: number;
  y: number;
  width: number;
  height: number;
  description?: string;
  severity: Severity;
}

export const SEVERITY_COLORS: Record<Severity, string> = {
  LOW: '#22c55e',
  MEDIUM: '#eab308',
  HIGH: '#ef4444',
};

export const SEVERITY_LABELS: Record<Severity, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
};

export const DEFAULT_DAMAGE_SIZE = 0.05;
