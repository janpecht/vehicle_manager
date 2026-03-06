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
      <Modal open={open} onClose={onClose} title="Schadensdetails">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <SeverityBadge severity={damage.severity} />
            <span className="text-sm text-gray-500">{damage.shape === 'CIRCLE' ? 'Kreis' : 'Rechteck'}</span>
            {isRepaired && (
              <span className="inline-block rounded-full bg-gray-400 px-2.5 py-0.5 text-xs font-semibold text-white">
                Repariert
              </span>
            )}
          </div>

          {damage.description && (
            <p className="text-sm text-gray-700">{damage.description}</p>
          )}

          <p className="text-xs text-gray-500">
            Erstellt: {new Date(damage.createdAt).toLocaleDateString('de-DE')}
          </p>

          {isRepaired && damage.repairedAt && (
            <p className="text-xs text-gray-500">
              Repariert: {new Date(damage.repairedAt).toLocaleDateString('de-DE')}
            </p>
          )}
        </div>

        <div className="mt-6 flex justify-between">
          {damage.isActive ? (
            <div className="flex gap-2">
              <Button variant="danger" onClick={() => setConfirmDeleteOpen(true)} disabled={deleteLoading || repairLoading}>
                Löschen
              </Button>
              <Button variant="secondary" onClick={() => setConfirmRepairOpen(true)} disabled={deleteLoading || repairLoading}>
                Als repariert markieren
              </Button>
            </div>
          ) : (
            <div />
          )}
          <Button variant="secondary" onClick={onClose}>
            Schließen
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
        title="Schaden löschen"
        message="Möchtest du diesen Schaden wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."
        loading={deleteLoading}
      />

      <ConfirmDialog
        open={confirmRepairOpen}
        onClose={() => setConfirmRepairOpen(false)}
        onConfirm={() => {
          setConfirmRepairOpen(false);
          onRepair(damage.id);
        }}
        title="Als repariert markieren"
        message="Diesen Schaden als repariert markieren? Er wird auf der Grafik abgeblendet dargestellt."
        confirmLabel="Bestätigen"
        loading={repairLoading}
      />
    </>
  );
}
