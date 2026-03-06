import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { DamageReport } from '../src/components/damage-canvas/DamageReport.tsx';

// Mock vehicle service
vi.mock('../src/services/vehicle.service.ts', () => ({
  getVehicle: vi.fn(),
}));

// Mock damage service
vi.mock('../src/services/damage.service.ts', () => ({
  listDamages: vi.fn(),
}));

// Mock Konva components
vi.mock('react-konva', () => import('./mocks/konva.tsx'));

import * as vehicleService from '../src/services/vehicle.service.ts';
import * as damageService from '../src/services/damage.service.ts';
import { mockVehicle, mockDamage as mockActiveDamage, mockRepairedDamage } from './fixtures.ts';

describe('DamageReport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      configurable: true,
      get: () => 400,
    });
  });

  it('should show loading state initially', () => {
    vi.mocked(vehicleService.getVehicle).mockReturnValue(new Promise(() => {}));
    vi.mocked(damageService.listDamages).mockReturnValue(new Promise(() => {}));

    render(<DamageReport vehicleId="v1" />);
    expect(document.querySelector('[class*="animate-spin"]')).toBeTruthy();
  });

  it('should render vehicle info after loading', async () => {
    vi.mocked(vehicleService.getVehicle).mockResolvedValue(mockVehicle);
    vi.mocked(damageService.listDamages).mockResolvedValue([]);

    render(<DamageReport vehicleId="v1" />);

    await waitFor(() => {
      expect(screen.getByText(/HD-AB 1234/)).toBeInTheDocument();
    });
    expect(screen.getByText('Sprinter 1')).toBeInTheDocument();
  });

  it('should render all 4 canvas views', async () => {
    vi.mocked(vehicleService.getVehicle).mockResolvedValue(mockVehicle);
    vi.mocked(damageService.listDamages).mockResolvedValue([]);

    render(<DamageReport vehicleId="v1" />);

    await waitFor(() => {
      expect(screen.getByText('Front')).toBeInTheDocument();
    });
    expect(screen.getByText('Rear')).toBeInTheDocument();
    expect(screen.getByText('Left Side')).toBeInTheDocument();
    expect(screen.getByText('Right Side')).toBeInTheDocument();

    await waitFor(() => {
      const stages = screen.getAllByTestId('konva-stage');
      expect(stages).toHaveLength(4);
    });
  });

  it('should render damage table with correct data', async () => {
    vi.mocked(vehicleService.getVehicle).mockResolvedValue(mockVehicle);
    vi.mocked(damageService.listDamages).mockResolvedValue([mockActiveDamage, mockRepairedDamage]);

    render(<DamageReport vehicleId="v1" />);

    await waitFor(() => {
      expect(screen.getByText('Damage List')).toBeInTheDocument();
    });

    expect(screen.getByText('Scratch on door')).toBeInTheDocument();
    expect(screen.getByText('Bumper dent')).toBeInTheDocument();
  });

  it('should show repaired status for repaired damages', async () => {
    vi.mocked(vehicleService.getVehicle).mockResolvedValue(mockVehicle);
    vi.mocked(damageService.listDamages).mockResolvedValue([mockActiveDamage, mockRepairedDamage]);

    render(<DamageReport vehicleId="v1" />);

    await waitFor(() => {
      expect(screen.getByText('Active')).toBeInTheDocument();
    });
    expect(screen.getByText('Repaired')).toBeInTheDocument();
  });

  it('should show severity badges', async () => {
    vi.mocked(vehicleService.getVehicle).mockResolvedValue(mockVehicle);
    vi.mocked(damageService.listDamages).mockResolvedValue([mockActiveDamage, mockRepairedDamage]);

    render(<DamageReport vehicleId="v1" />);

    await waitFor(() => {
      expect(screen.getByText('Medium')).toBeInTheDocument();
    });
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('should show error when vehicle not found', async () => {
    vi.mocked(vehicleService.getVehicle).mockRejectedValue({
      isAxiosError: true,
      response: { status: 404, data: { error: { code: 'NOT_FOUND', message: 'Vehicle not found' } } },
    });
    vi.mocked(damageService.listDamages).mockRejectedValue(new Error('fail'));

    render(<DamageReport vehicleId="nonexistent" />);

    await waitFor(() => {
      expect(screen.getByText('Vehicle not found')).toBeInTheDocument();
    });
  });

  it('should show empty state when no damages', async () => {
    vi.mocked(vehicleService.getVehicle).mockResolvedValue(mockVehicle);
    vi.mocked(damageService.listDamages).mockResolvedValue([]);

    render(<DamageReport vehicleId="v1" />);

    await waitFor(() => {
      expect(screen.getByText('No damages recorded for this vehicle.')).toBeInTheDocument();
    });
  });
});
