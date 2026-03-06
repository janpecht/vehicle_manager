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

  // Inactive filter
  const [showInactive, setShowInactive] = useState(false);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);
  const [deleting, setDeleting] = useState(false);


  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await vehicleService.listVehicles({
        search: search || undefined,
        includeInactive: showInactive,
        page,
        limit: 20,
      });
      setData(result);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Fehler beim Laden der Fahrzeuge'));
    } finally {
      setLoading(false);
    }
  }, [search, showInactive, page]);

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

  async function toggleActive(vehicle: Vehicle) {
    try {
      await vehicleService.updateVehicle(vehicle.id, { isActive: !vehicle.isActive });
      toast.success(vehicle.isActive ? 'Fahrzeug deaktiviert' : 'Fahrzeug aktiviert');
      fetchVehicles();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Fehler beim Aktualisieren'));
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await vehicleService.deleteVehicle(deleteTarget.id);
      setDeleteTarget(null);
      toast.success('Fahrzeug gelöscht');
      fetchVehicles();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Fehler beim Löschen'));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Fahrzeuge</h2>
        <Button onClick={openAddDialog}>Fahrzeug hinzufügen</Button>
      </div>

      {/* Search + inactive toggle */}
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <input
          type="text"
          placeholder="Nach Kennzeichen oder Bezeichnung suchen..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full max-w-md rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => { setShowInactive(e.target.checked); setPage(1); }}
            className="h-4 w-4 rounded border-gray-300 text-blue-600"
          />
          Inaktive anzeigen
        </label>
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
            {search ? 'Keine Fahrzeuge gefunden.' : 'Noch keine Fahrzeuge vorhanden. Füge dein erstes Fahrzeug hinzu.'}
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
                  Kennzeichen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Bezeichnung
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  km-Stand
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Erstellt
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.vehicles.map((vehicle) => (
                <tr key={vehicle.id} className={`hover:bg-gray-50 ${!vehicle.isActive ? 'opacity-50' : ''}`}>
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
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${vehicle.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {vehicle.isActive ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {vehicle.checklistSubmissions?.[0]?.mileage != null
                      ? vehicle.checklistSubmissions[0].mileage.toLocaleString('de-DE') + ' km'
                      : '-'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {new Date(vehicle.createdAt).toLocaleDateString('de-DE')}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                    <button
                      onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                      className="mr-3 font-medium text-blue-600 hover:text-blue-500"
                    >
                      Anzeigen
                    </button>
                    <button
                      onClick={() => openEditDialog(vehicle)}
                      className="mr-3 font-medium text-blue-600 hover:text-blue-500"
                    >
                      Bearbeiten
                    </button>
                    <button
                      onClick={() => toggleActive(vehicle)}
                      className={`mr-3 font-medium ${vehicle.isActive ? 'text-yellow-600 hover:text-yellow-500' : 'text-green-600 hover:text-green-500'}`}
                    >
                      {vehicle.isActive ? 'Deaktivieren' : 'Aktivieren'}
                    </button>
                    <button
                      onClick={() => setDeleteTarget(vehicle)}
                      className="font-medium text-red-600 hover:text-red-500"
                    >
                      Löschen
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
                Seite {data.page} von {data.totalPages} ({data.total} Fahrzeuge)
              </span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Zurück
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page >= data.totalPages}
                >
                  Weiter
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
        title="Fahrzeug löschen"
        message={`Möchtest du das Fahrzeug "${deleteTarget?.licensePlate}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`}
        loading={deleting}
      />
    </div>
  );
}
