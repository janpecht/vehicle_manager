import { useState } from 'react';
import { Modal } from '../ui/Modal.tsx';
import { Button } from '../ui/Button.tsx';
import { ConfirmDialog } from '../ui/ConfirmDialog.tsx';
import { SeverityBadge } from '../ui/SeverityBadge.tsx';
import type { DamageMarking } from '../../types/damage.ts';

interface DamageDetailPopupProps {
  open: boolean;
  onClose: () => void;
  onDelete: (damageId: string) => void;
  onRepair: (damageId: string) => void;
  damage: DamageMarking | null;
  deleteLoading?: boolean;
  repairLoading?: boolean;
}

export function DamageDetailPopup({
  open,
  onClose,
  onDelete,
  onRepair,
  damage,
  deleteLoading,
  repairLoading,
}: DamageDetailPopupProps) {
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmRepairOpen, setConfirmRepairOpen] = useState(false);

  if (!damage) return null;

  const isRepaired = !damage.isActive;

  return (
    <>
      <Modal open={open} onClose={onClose} title="Damage Details">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <SeverityBadge severity={damage.severity} />
            <span className="text-sm text-gray-500">{damage.shape}</span>
            {isRepaired && (
              <span className="inline-block rounded-full bg-gray-400 px-2.5 py-0.5 text-xs font-semibold text-white">
                Repaired
              </span>
            )}
          </div>

          {damage.description && (
            <p className="text-sm text-gray-700">{damage.description}</p>
          )}

          <p className="text-xs text-gray-500">
            Created: {new Date(damage.createdAt).toLocaleDateString()}
          </p>

          {isRepaired && damage.repairedAt && (
            <p className="text-xs text-gray-500">
              Repaired: {new Date(damage.repairedAt).toLocaleDateString()}
            </p>
          )}
        </div>

        <div className="mt-6 flex justify-between">
          {damage.isActive ? (
            <div className="flex gap-2">
              <Button variant="danger" onClick={() => setConfirmDeleteOpen(true)} disabled={deleteLoading || repairLoading}>
                Delete
              </Button>
              <Button variant="secondary" onClick={() => setConfirmRepairOpen(true)} disabled={deleteLoading || repairLoading}>
                Mark as Repaired
              </Button>
            </div>
          ) : (
            <div />
          )}
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={() => {
          setConfirmDeleteOpen(false);
          onDelete(damage.id);
        }}
        title="Delete Damage"
        message="Are you sure you want to delete this damage marking? This action cannot be undone."
        loading={deleteLoading}
      />

      <ConfirmDialog
        open={confirmRepairOpen}
        onClose={() => setConfirmRepairOpen(false)}
        onConfirm={() => {
          setConfirmRepairOpen(false);
          onRepair(damage.id);
        }}
        title="Mark as Repaired"
        message="Mark this damage as repaired? It will be visually subdued on the canvas."
        confirmLabel="Confirm"
        loading={repairLoading}
      />
    </>
  );
}
