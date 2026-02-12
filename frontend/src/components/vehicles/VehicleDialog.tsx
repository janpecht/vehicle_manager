import { type FormEvent, useState, useEffect } from 'react';
import { Modal } from '../ui/Modal.tsx';
import { Input } from '../ui/Input.tsx';
import { Button } from '../ui/Button.tsx';
import { Alert } from '../ui/Alert.tsx';
import { toast } from 'sonner';
import * as vehicleService from '../../services/vehicle.service.ts';
import type { Vehicle } from '../../types/vehicle.ts';
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
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setLicensePlate(vehicle?.licensePlate ?? '');
      setLabel(vehicle?.label ?? '');
      setError('');
      setFieldErrors({});
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
        });
      } else {
        await vehicleService.createVehicle({
          licensePlate,
          label: label || undefined,
        });
      }
      toast.success(isEdit ? 'Vehicle updated' : 'Vehicle added');
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
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Vehicle' : 'Add Vehicle'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert type="error" message={error} />}
        <Input
          label="License Plate"
          type="text"
          value={licensePlate}
          onChange={(e) => setLicensePlate(e.target.value)}
          error={fieldErrors['licensePlate']}
          placeholder="e.g. HD-AB 1234"
          required
        />
        <Input
          label="Label (optional)"
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          error={fieldErrors['label']}
          placeholder="e.g. Sprinter #1"
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {isEdit ? 'Save Changes' : 'Add Vehicle'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
