import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { DamageReportPage } from '../src/components/vehicles/DamageReportPage.tsx';

// Mock vehicle service
vi.mock('../src/services/vehicle.service.ts', () => ({
  getVehicle: vi.fn(),
}));

// Mock damage service
vi.mock('../src/services/damage.service.ts', () => ({
  listDamages: vi.fn(),
}));

// Mock Konva components
vi.mock('react-konva', () => ({
  Stage: ({ children, ...props }: Record<string, unknown>) => (
    <div data-testid="konva-stage" data-width={props.width} data-height={props.height}>
      {children as React.ReactNode}
    </div>
  ),
  Layer: ({ children }: { children: React.ReactNode }) => <div data-testid="konva-layer">{children}</div>,
  Path: (props: Record<string, unknown>) => <div data-testid="konva-path" data-fill={props.fill} />,
  Rect: (props: Record<string, unknown>) => <div data-testid="konva-rect" data-fill={props.fill} />,
  Circle: (props: Record<string, unknown>) => <div data-testid="konva-circle" data-fill={props.fill} />,
}));

import * as vehicleService from '../src/services/vehicle.service.ts';
import * as damageService from '../src/services/damage.service.ts';

const mockVehicle = {
  id: 'v1',
  licensePlate: 'HD-AB 1234',
  label: 'Sprinter 1',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

function renderReportPage() {
  return render(
    <MemoryRouter initialEntries={['/vehicles/v1/report']}>
      <Routes>
        <Route path="/vehicles/:id/report" element={<DamageReportPage />} />
        <Route path="/vehicles/:id" element={<div>Vehicle Detail</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('DamageReportPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(vehicleService.getVehicle).mockResolvedValue(mockVehicle);
    vi.mocked(damageService.listDamages).mockResolvedValue([]);
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      configurable: true,
      get: () => 400,
    });
  });

  it('should render back button and print button', async () => {
    renderReportPage();

    await waitFor(() => {
      expect(screen.getByText(/HD-AB 1234/)).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /back to vehicle/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /print/i })).toBeInTheDocument();
  });

  it('should render the damage report content', async () => {
    renderReportPage();

    await waitFor(() => {
      expect(screen.getByText(/HD-AB 1234/)).toBeInTheDocument();
    });

    expect(screen.getByText('Damage List')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getAllByTestId('konva-stage')).toHaveLength(4);
    });
  });

  it('should navigate back when clicking back button', async () => {
    const user = userEvent.setup();
    renderReportPage();

    await waitFor(() => {
      expect(screen.getByText(/HD-AB 1234/)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /back to vehicle/i }));

    await waitFor(() => {
      expect(screen.getByText('Vehicle Detail')).toBeInTheDocument();
    });
  });

  it('should have print:hidden class on toolbar', async () => {
    renderReportPage();

    await waitFor(() => {
      expect(screen.getByText(/HD-AB 1234/)).toBeInTheDocument();
    });

    const backButton = screen.getByRole('button', { name: /back to vehicle/i });
    const toolbar = backButton.closest('div.print\\:hidden');
    expect(toolbar).toBeTruthy();
  });
});
