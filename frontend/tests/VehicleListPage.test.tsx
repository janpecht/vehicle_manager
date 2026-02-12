import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { VehicleListPage } from '../src/components/vehicles/VehicleListPage.tsx';
import { useAuthStore } from '../src/stores/authStore.ts';

// Mock sonner
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('../src/services/vehicle.service.ts', () => ({
  listVehicles: vi.fn(),
  createVehicle: vi.fn(),
  updateVehicle: vi.fn(),
  deleteVehicle: vi.fn(),
}));

import * as vehicleService from '../src/services/vehicle.service.ts';

const mockVehicles = {
  vehicles: [
    { id: '1', licensePlate: 'HD-AB 1234', label: 'Sprinter 1', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
    { id: '2', licensePlate: 'KA-CD 5678', label: null, createdAt: '2026-01-02T00:00:00Z', updatedAt: '2026-01-02T00:00:00Z' },
  ],
  total: 2,
  page: 1,
  limit: 20,
  totalPages: 1,
};

function renderPage() {
  // Ensure auth state is set
  useAuthStore.setState({
    isAuthenticated: true,
    isLoading: false,
    user: { id: '1', email: 'test@test.de', name: 'Test', role: 'USER' },
    accessToken: 'token',
  });

  return render(
    <MemoryRouter>
      <VehicleListPage />
    </MemoryRouter>,
  );
}

describe('VehicleListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(vehicleService.listVehicles).mockResolvedValue(mockVehicles);
  });

  it('should render the vehicle list with data', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('HD-AB 1234')).toBeInTheDocument();
    });

    expect(screen.getByText('Sprinter 1')).toBeInTheDocument();
    expect(screen.getByText('KA-CD 5678')).toBeInTheDocument();
  });

  it('should show empty state when no vehicles', async () => {
    vi.mocked(vehicleService.listVehicles).mockResolvedValue({
      vehicles: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/no vehicles yet/i)).toBeInTheDocument();
    });
  });

  it('should show Add Vehicle button', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add vehicle/i })).toBeInTheDocument();
    });
  });

  it('should open add dialog when clicking Add Vehicle', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('HD-AB 1234')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /add vehicle/i }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Add Vehicle' })).toBeInTheDocument();
    });
  });

  it('should call listVehicles with search parameter', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('HD-AB 1234')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'HD');

    await waitFor(() => {
      expect(vehicleService.listVehicles).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'HD' }),
      );
    });
  });

  it('should show edit and delete buttons for each vehicle', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('HD-AB 1234')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByText('Edit');
    const deleteButtons = screen.getAllByText('Delete');

    expect(editButtons).toHaveLength(2);
    expect(deleteButtons).toHaveLength(2);
  });

  it('should open confirm dialog when clicking delete', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('HD-AB 1234')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText('Delete');
    await user.click(deleteButtons[0]!);

    await waitFor(() => {
      expect(screen.getByText(/are you sure you want to delete/i)).toBeInTheDocument();
    });
  });
});
