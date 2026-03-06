import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { Button } from '../ui/Button.tsx';
import { Input } from '../ui/Input.tsx';
import { Modal } from '../ui/Modal.tsx';
import { Alert } from '../ui/Alert.tsx';
import { Skeleton } from '../ui/Skeleton.tsx';
import { toast } from 'sonner';
import * as vehicleTypeService from '../../services/vehicleType.service.ts';
import type { VehicleType } from '../../types/vehicle.ts';
import { getApiErrorMessage } from '../../utils/apiError.ts';

const SIDES = ['front', 'rear', 'left', 'right'] as const;
const SIDE_LABELS: Record<(typeof SIDES)[number], string> = {
  front: 'Vorne',
  rear: 'Hinten',
  left: 'Links',
  right: 'Rechts',
};
const SIDE_FIELD_MAP: Record<(typeof SIDES)[number], keyof VehicleType> = {
  front: 'frontImage',
  rear: 'rearImage',
  left: 'leftImage',
  right: 'rightImage',
};

export function VehicleTypeListPage() {
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<VehicleType | null>(null);
  const [typeName, setTypeName] = useState('');
  const [saving, setSaving] = useState(false);
  const [dialogError, setDialogError] = useState('');

  // Delete state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Image upload state
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadingSide, setUploadingSide] = useState<(typeof SIDES)[number] | null>(null);

  const loadTypes = useCallback(async () => {
    setLoading(true);
    try {
      const types = await vehicleTypeService.listVehicleTypes();
      setVehicleTypes(types);
      setError('');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Fehler beim Laden der Fahrzeugtypen'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTypes();
  }, [loadTypes]);

  function openCreateDialog() {
    setEditingType(null);
    setTypeName('');
    setDialogError('');
    setDialogOpen(true);
  }

  function openEditDialog(vt: VehicleType) {
    setEditingType(vt);
    setTypeName(vt.name);
    setDialogError('');
    setDialogOpen(true);
  }

  async function handleDialogSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setDialogError('');

    try {
      if (editingType) {
        await vehicleTypeService.updateVehicleType(editingType.id, typeName);
        toast.success('Fahrzeugtyp aktualisiert');
      } else {
        await vehicleTypeService.createVehicleType(typeName);
        toast.success('Fahrzeugtyp erstellt');
      }
      setDialogOpen(false);
      loadTypes();
    } catch (err) {
      setDialogError(getApiErrorMessage(err, 'Fehler beim Speichern'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await vehicleTypeService.deleteVehicleType(deleteId);
      toast.success('Fahrzeugtyp gelöscht');
      setDeleteId(null);
      loadTypes();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Fehler beim Löschen'));
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleImageUpload(vtId: string, side: (typeof SIDES)[number], file: File) {
    setUploadingId(vtId);
    setUploadingSide(side);
    try {
      await vehicleTypeService.uploadVehicleTypeImage(vtId, side, file);
      toast.success(`${SIDE_LABELS[side]}-Bild hochgeladen`);
      loadTypes();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Fehler beim Hochladen'));
    } finally {
      setUploadingId(null);
      setUploadingSide(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-9 w-36" />
        </div>
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Fahrzeugtypen</h1>
        <Button onClick={openCreateDialog}>Fahrzeugtyp hinzufügen</Button>
      </div>

      {error && <Alert type="error" message={error} />}

      {vehicleTypes.length === 0 && !error && (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-500">Noch keine Fahrzeugtypen vorhanden. Erstelle einen, um loszulegen.</p>
        </div>
      )}

      {/* Vehicle type cards */}
      <div className="space-y-4">
        {vehicleTypes.map((vt) => (
          <div key={vt.id} className="rounded-lg bg-white p-4 shadow">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{vt.name}</h3>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => openEditDialog(vt)}>
                  Bearbeiten
                </Button>
                <Button variant="danger" onClick={() => setDeleteId(vt.id)}>
                  Löschen
                </Button>
              </div>
            </div>

            {/* Image upload grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {SIDES.map((side) => {
                const imageUrl = vt[SIDE_FIELD_MAP[side]] as string | null;
                const isUploading = uploadingId === vt.id && uploadingSide === side;

                return (
                  <div key={side} className="flex flex-col items-center gap-1">
                    <span className="text-xs font-medium text-gray-500">{SIDE_LABELS[side]}</span>
                    <div className="flex h-20 w-full items-center justify-center rounded border border-gray-200 bg-gray-50 overflow-hidden">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={`${vt.name} ${SIDE_LABELS[side]}`}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <span className="text-xs text-gray-400">Kein Bild</span>
                      )}
                    </div>
                    <label className="cursor-pointer text-xs text-blue-600 hover:text-blue-500">
                      {isUploading ? 'Lädt hoch...' : 'Hochladen'}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/svg+xml"
                        className="hidden"
                        disabled={isUploading}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(vt.id, side, file);
                          e.target.value = '';
                        }}
                      />
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit dialog */}
      <Modal
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editingType ? 'Fahrzeugtyp bearbeiten' : 'Fahrzeugtyp hinzufügen'}
      >
        <form onSubmit={handleDialogSubmit} className="space-y-4">
          {dialogError && <Alert type="error" message={dialogError} />}
          <Input
            label="Name"
            type="text"
            value={typeName}
            onChange={(e) => setTypeName(e.target.value)}
            placeholder="e.g. Sprinter"
            required
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setDialogOpen(false)} disabled={saving}>
              Abbrechen
            </Button>
            <Button type="submit" loading={saving}>
              {editingType ? 'Speichern' : 'Hinzufügen'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Fahrzeugtyp löschen">
        <p className="mb-4 text-gray-600">
          Möchtest du diesen Fahrzeugtyp wirklich löschen? Fahrzeuge mit diesem Typ haben danach keinen Typ mehr zugewiesen.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteId(null)} disabled={deleteLoading}>
            Abbrechen
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={deleteLoading}>
            Löschen
          </Button>
        </div>
      </Modal>
    </div>
  );
}
