import { useState } from 'react';
import { Modal } from '../ui/Modal.tsx';
import { Button } from '../ui/Button.tsx';
import type { Shape, Severity } from '../../types/damage.ts';
import { SEVERITY_COLORS, SEVERITY_LABELS } from '../../types/damage.ts';

interface DamageFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { description?: string; severity: Severity }) => void;
  shape: Shape;
  loading?: boolean;
}

const SEVERITIES: Severity[] = ['LOW', 'MEDIUM', 'HIGH'];

export function DamageFormDialog({ open, onClose, onSave, shape, loading }: DamageFormDialogProps) {
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<Severity>('MEDIUM');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      description: description.trim() || undefined,
      severity,
    });
    setDescription('');
    setSeverity('MEDIUM');
  }

  function handleClose() {
    setDescription('');
    setSeverity('MEDIUM');
    onClose();
  }

  const title = `Add ${shape === 'CIRCLE' ? 'Circle' : 'Rectangle'} Damage`;

  return (
    <Modal open={open} onClose={handleClose} title={title}>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="damage-description" className="block text-sm font-medium text-gray-700 mb-1">
            Description (optional)
          </label>
          <input
            id="damage-description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe the damage..."
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
          <div className="flex gap-2">
            {SEVERITIES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSeverity(s)}
                className={`flex-1 rounded-md border-2 px-3 py-2 text-sm font-medium transition-colors ${
                  severity === s
                    ? 'border-current text-white'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
                style={severity === s ? { backgroundColor: SEVERITY_COLORS[s] } : undefined}
                aria-pressed={severity === s}
              >
                {SEVERITY_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}
