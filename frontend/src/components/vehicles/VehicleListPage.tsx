import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button.tsx';
import { Skeleton } from '../ui/Skeleton.tsx';
import { Alert } from '../ui/Alert.tsx';
import { ConfirmDialog } from '../ui/ConfirmDialog.tsx';
import { VehicleDialog } from './VehicleDialog.tsx';
import * as vehicleService from '../../services/vehicle.service.ts';
import type { Vehicle, PaginatedVehicles } from '../../types/vehicle.ts';
import { toast } from 'sonner';
import { getApiErrorMessage } from '../../utils/apiError.ts';

export function VehicleListPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<PaginatedVehicles | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await vehicleService.listVehicles({
        search: search || undefined,
        page,
        limit: 20,
      });
      setData(result);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load vehicles'));
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function openAddDialog() {
    setEditVehicle(null);
    setDialogOpen(true);
  }

  function openEditDialog(vehicle: Vehicle) {
    setEditVehicle(vehicle);
    setDialogOpen(true);
  }

  function handleDialogSaved() {
    setDialogOpen(false);
    setEditVehicle(null);
    fetchVehicles();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await vehicleService.deleteVehicle(deleteTarget.id);
      setDeleteTarget(null);
      toast.success('Vehicle deleted');
      fetchVehicles();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to delete vehicle'));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Vehicles</h2>
        <Button onClick={openAddDialog}>Add Vehicle</Button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by license plate or label..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full max-w-md rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {error && (
        <div className="mb-4">
          <Alert type="error" message={error} />
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !data && (
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="bg-gray-50 px-6 py-3">
            <div className="flex gap-12">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="ml-auto h-4 w-16" />
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-12 px-6 py-4">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
                <div className="ml-auto flex gap-3">
                  <Skeleton className="h-4 w-10" />
                  <Skeleton className="h-4 w-10" />
                  <Skeleton className="h-4 w-12" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {data && data.vehicles.length === 0 && (
        <div className="rounded-lg bg-white p-8 text-center shadow">
          <p className="text-gray-500">
            {search ? 'No vehicles match your search.' : 'No vehicles yet. Add your first vehicle.'}
          </p>
        </div>
      )}

      {/* Vehicle table */}
      {data && data.vehicles.length > 0 && (
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  License Plate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Label
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.vehicles.map((vehicle) => (
                <tr key={vehicle.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                    <button
                      onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                      className="text-blue-600 hover:text-blue-500 hover:underline"
                    >
                      {vehicle.licensePlate}
                    </button>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {vehicle.label || '-'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {new Date(vehicle.createdAt).toLocaleDateString('de-DE')}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                    <button
                      onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                      className="mr-3 font-medium text-blue-600 hover:text-blue-500"
                    >
                      View
                    </button>
                    <button
                      onClick={() => openEditDialog(vehicle)}
                      className="mr-3 font-medium text-blue-600 hover:text-blue-500"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteTarget(vehicle)}
                      className="font-medium text-red-600 hover:text-red-500"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-6 py-3">
              <span className="text-sm text-gray-700">
                Page {data.page} of {data.totalPages} ({data.total} vehicles)
              </span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page >= data.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <VehicleDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditVehicle(null);
        }}
        onSaved={handleDialogSaved}
        vehicle={editVehicle}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Vehicle"
        message={`Are you sure you want to delete vehicle "${deleteTarget?.licensePlate}"? This action cannot be undone.`}
        loading={deleting}
      />
    </div>
  );
}
