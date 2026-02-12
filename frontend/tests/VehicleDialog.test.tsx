import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { VehicleDialog } from '../src/components/vehicles/VehicleDialog.tsx';

// Mock sonner
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('../src/services/vehicle.service.ts', () => ({
  createVehicle: vi.fn(),
  updateVehicle: vi.fn(),
}));

import * as vehicleService from '../src/services/vehicle.service.ts';

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  onSaved: vi.fn(),
  vehicle: null,
};

function renderDialog(props = {}) {
  return render(
    <MemoryRouter>
      <VehicleDialog {...defaultProps} {...props} />
    </MemoryRouter>,
  );
}

describe('VehicleDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render add form when no vehicle is provided', () => {
    renderDialog();

    expect(screen.getByRole('heading', { name: 'Add Vehicle' })).toBeInTheDocument();
    expect(screen.getByLabelText(/license plate/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/label/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add vehicle/i })).toBeInTheDocument();
  });

  it('should render edit form with pre-filled values', () => {
    renderDialog({
      vehicle: {
        id: '1',
        licensePlate: 'HD-AB 1234',
        label: 'Sprinter 1',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    });

    expect(screen.getByText('Edit Vehicle')).toBeInTheDocument();
    expect(screen.getByDisplayValue('HD-AB 1234')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Sprinter 1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });

  it('should call createVehicle on add form submit', async () => {
    const user = userEvent.setup();
    vi.mocked(vehicleService.createVehicle).mockResolvedValueOnce({
      id: '1',
      licensePlate: 'HD-AB 1234',
      label: 'Test',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    });

    renderDialog();

    await user.type(screen.getByLabelText(/license plate/i), 'HD-AB 1234');
    await user.type(screen.getByLabelText(/label/i), 'Test');
    await user.click(screen.getByRole('button', { name: /add vehicle/i }));

    await waitFor(() => {
      expect(vehicleService.createVehicle).toHaveBeenCalledWith({
        licensePlate: 'HD-AB 1234',
        label: 'Test',
      });
      expect(defaultProps.onSaved).toHaveBeenCalled();
    });
  });

  it('should call updateVehicle on edit form submit', async () => {
    const user = userEvent.setup();
    vi.mocked(vehicleService.updateVehicle).mockResolvedValueOnce({
      id: '1',
      licensePlate: 'HD-AB 1234',
      label: 'Updated',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    });

    renderDialog({
      vehicle: {
        id: '1',
        licensePlate: 'HD-AB 1234',
        label: 'Old',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    });

    const labelInput = screen.getByLabelText(/label/i);
    await user.clear(labelInput);
    await user.type(labelInput, 'Updated');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(vehicleService.updateVehicle).toHaveBeenCalledWith('1', {
        licensePlate: 'HD-AB 1234',
        label: 'Updated',
      });
      expect(defaultProps.onSaved).toHaveBeenCalled();
    });
  });

  it('should call onClose when cancel is clicked', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('should not render when open is false', () => {
    renderDialog({ open: false });

    expect(screen.queryByText('Add Vehicle')).not.toBeInTheDocument();
  });
});
