import { type FormEvent, useState, useEffect } from 'react';
import { Modal } from '../ui/Modal.tsx';
import { Input } from '../ui/Input.tsx';
import { Button } from '../ui/Button.tsx';
import { Alert } from '../ui/Alert.tsx';
import { toast } from 'sonner';
import * as vehicleService from '../../services/vehicle.service.ts';
import * as vehicleTypeService from '../../services/vehicleType.service.ts';
import type { Vehicle, VehicleType } from '../../types/vehicle.ts';
import type { ApiError } from '../../types/auth.ts';
import axios from 'axios';

interface VehicleDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  vehicle?: Vehicle | null;
}

export function VehicleDialog({ open, onClose, onSaved, vehicle }: VehicleDialogProps) {
  const isEdit = !!vehicle;

  const [licensePlate, setLicensePlate] = useState('');
  const [label, setLabel] = useState('');
  const [formLink, setFormLink] = useState('');
  const [vehicleTypeId, setVehicleTypeId] = useState('');
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setLicensePlate(vehicle?.licensePlate ?? '');
      setLabel(vehicle?.label ?? '');
      setFormLink(vehicle?.formLink ?? '');
      setVehicleTypeId(vehicle?.vehicleTypeId ?? '');
      setError('');
      setFieldErrors({});
      vehicleTypeService.listVehicleTypes().then(setVehicleTypes).catch(() => {});
    }
  }, [open, vehicle]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setLoading(true);

    try {
      if (isEdit) {
        await vehicleService.updateVehicle(vehicle.id, {
          licensePlate,
          label: label || null,
          formLink: formLink || null,
          vehicleTypeId: vehicleTypeId || null,
        });
      } else {
        await vehicleService.createVehicle({
          licensePlate,
          label: label || undefined,
          formLink: formLink || undefined,
          vehicleTypeId: vehicleTypeId || undefined,
        });
      }
      toast.success(isEdit ? 'Fahrzeug aktualisiert' : 'Fahrzeug hinzugefügt');
      onSaved();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data) {
        const apiError = err.response.data as ApiError;
        if (apiError.error.details) {
          const errors: Record<string, string> = {};
          for (const detail of apiError.error.details) {
            errors[detail.field] = detail.message;
          }
          setFieldErrors(errors);
        } else {
          setError(apiError.error.message);
        }
      } else {
        setError('Ein unerwarteter Fehler ist aufgetreten');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Fahrzeug bearbeiten' : 'Fahrzeug hinzufügen'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert type="error" message={error} />}
        <Input
          label="Kennzeichen"
          type="text"
          value={licensePlate}
          onChange={(e) => setLicensePlate(e.target.value)}
          error={fieldErrors['licensePlate']}
          placeholder="z.B. HD-AB 1234"
          required
        />
        <Input
          label="Bezeichnung (optional)"
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          error={fieldErrors['label']}
          placeholder="z.B. Sprinter #1"
        />
        <Input
          label="Formular-Link (optional)"
          type="url"
          value={formLink}
          onChange={(e) => setFormLink(e.target.value)}
          error={fieldErrors['formLink']}
          placeholder="https://example.com/form"
        />
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Fahrzeugtyp (optional)
          </label>
          <select
            value={vehicleTypeId}
            onChange={(e) => setVehicleTypeId(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Kein Typ</option>
            {vehicleTypes.map((vt) => (
              <option key={vt.id} value={vt.id}>
                {vt.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={onClose} disabled={loading}>
            Abbrechen
          </Button>
          <Button type="submit" loading={loading}>
            {isEdit ? 'Speichern' : 'Hinzufügen'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
