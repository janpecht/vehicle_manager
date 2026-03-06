import { useState, useEffect, useCallback } from 'react';
import { Button } from '../ui/Button.tsx';
import { Alert } from '../ui/Alert.tsx';
import { Skeleton } from '../ui/Skeleton.tsx';
import { ConfirmDialog } from '../ui/ConfirmDialog.tsx';
import { Modal } from '../ui/Modal.tsx';
import { Input } from '../ui/Input.tsx';
import { toast } from 'sonner';
import * as driverService from '../../services/driver.service.ts';
import type { Driver } from '../../types/driver.ts';
import { getApiErrorMessage } from '../../utils/apiError.ts';

export function DriverListPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDriver, setEditDriver] = useState<Driver | null>(null);
  const [driverName, setDriverName] = useState('');
  const [dialogLoading, setDialogLoading] = useState(false);
  const [dialogError, setDialogError] = useState('');

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Driver | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await driverService.listDrivers(showInactive);
      setDrivers(result);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Fehler beim Laden der Fahrer'));
    } finally {
      setLoading(false);
    }
  }, [showInactive]);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  function openAddDialog() {
    setEditDriver(null);
    setDriverName('');
    setDialogError('');
    setDialogOpen(true);
  }

  function openEditDialog(driver: Driver) {
    setEditDriver(driver);
    setDriverName(driver.name);
    setDialogError('');
    setDialogOpen(true);
  }

  async function handleDialogSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!driverName.trim()) return;
    setDialogLoading(true);
    setDialogError('');
    try {
      if (editDriver) {
        await driverService.updateDriver(editDriver.id, { name: driverName.trim() });
        toast.success('Fahrer aktualisiert');
      } else {
        await driverService.createDriver(driverName.trim());
        toast.success('Fahrer hinzugefügt');
      }
      setDialogOpen(false);
      fetchDrivers();
    } catch (err) {
      setDialogError(getApiErrorMessage(err, 'Fehler'));
    } finally {
      setDialogLoading(false);
    }
  }

  async function toggleActive(driver: Driver) {
    try {
      await driverService.updateDriver(driver.id, { isActive: !driver.isActive });
      toast.success(driver.isActive ? 'Fahrer deaktiviert' : 'Fahrer aktiviert');
      fetchDrivers();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Fehler'));
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await driverService.deleteDriver(deleteTarget.id);
      toast.success('Fahrer gelöscht');
      setDeleteTarget(null);
      fetchDrivers();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Fehler beim Löschen'));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Fahrer</h2>
        <Button onClick={openAddDialog}>Fahrer hinzufügen</Button>
      </div>

      <div className="mb-4">
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="rounded"
          />
          Inaktive Fahrer anzeigen
        </label>
      </div>

      {error && (
        <div className="mb-4">
          <Alert type="error" message={error} />
        </div>
      )}

      {loading && drivers.length === 0 && (
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="divide-y divide-gray-200">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-8 px-6 py-4">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="ml-auto h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && drivers.length === 0 && (
        <div className="rounded-lg bg-white p-8 text-center shadow">
          <p className="text-gray-500">Noch keine Fahrer vorhanden.</p>
        </div>
      )}

      {drivers.length > 0 && (
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {drivers.map((driver) => (
                <tr key={driver.id} className={`hover:bg-gray-50 ${!driver.isActive ? 'opacity-50' : ''}`}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {driver.name}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${driver.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {driver.isActive ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                    <button
                      onClick={() => openEditDialog(driver)}
                      className="mr-3 font-medium text-blue-600 hover:text-blue-500"
                    >
                      Bearbeiten
                    </button>
                    <button
                      onClick={() => toggleActive(driver)}
                      className="mr-3 font-medium text-yellow-600 hover:text-yellow-500"
                    >
                      {driver.isActive ? 'Deaktivieren' : 'Aktivieren'}
                    </button>
                    <button
                      onClick={() => setDeleteTarget(driver)}
                      className="font-medium text-red-600 hover:text-red-500"
                    >
                      Löschen
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Modal
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editDriver ? 'Fahrer bearbeiten' : 'Fahrer hinzufügen'}
      >
        <form onSubmit={handleDialogSubmit} className="space-y-4">
          {dialogError && <Alert type="error" message={dialogError} />}
          <Input
            label="Name"
            value={driverName}
            onChange={(e) => setDriverName(e.target.value)}
            placeholder="Vor- und Nachname"
            required
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setDialogOpen(false)} disabled={dialogLoading}>
              Abbrechen
            </Button>
            <Button type="submit" loading={dialogLoading}>
              {editDriver ? 'Speichern' : 'Hinzufügen'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Fahrer löschen"
        message={`Möchtest du "${deleteTarget?.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`}
        loading={deleting}
      />
    </div>
  );
}
