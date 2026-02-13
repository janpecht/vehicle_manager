import { useState, useCallback, useEffect } from 'react';
import * as damageService from '../services/damage.service.ts';
import type { DamageMarking, CanvasTool, Severity, ViewSide } from '../types/damage.ts';
import { toast } from 'sonner';

interface PendingDraw {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function useDamageManager(vehicleId: string | undefined, vehicleLoaded: boolean) {
  const [damages, setDamages] = useState<DamageMarking[]>([]);
  const [activeTool, setActiveTool] = useState<CanvasTool>('CIRCLE');
  const [pendingDraw, setPendingDraw] = useState<PendingDraw | null>(null);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [selectedDamage, setSelectedDamage] = useState<DamageMarking | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showRepaired, setShowRepaired] = useState(false);
  const [repairLoading, setRepairLoading] = useState(false);

  const loadDamages = useCallback(async () => {
    if (!vehicleId) return;
    try {
      const data = await damageService.listDamages(vehicleId, { activeOnly: !showRepaired });
      setDamages(data);
    } catch {
      // Silently fail — damages are secondary to vehicle view
    }
  }, [vehicleId, showRepaired]);

  useEffect(() => {
    if (vehicleLoaded) {
      loadDamages();
    }
  }, [vehicleLoaded, loadDamages]);

  function handleCanvasDraw(relX: number, relY: number, relW: number, relH: number) {
    setPendingDraw({ x: relX, y: relY, width: relW, height: relH });
    setFormDialogOpen(true);
  }

  async function handleFormSave(activeView: ViewSide, data: { description?: string; severity: Severity }) {
    if (!vehicleId || !pendingDraw) return;

    setSaving(true);
    try {
      const shape = activeTool === 'CIRCLE' ? 'CIRCLE' : 'RECTANGLE';
      const newDamage = await damageService.createDamage(vehicleId, {
        viewSide: activeView,
        shape,
        x: pendingDraw.x,
        y: pendingDraw.y,
        width: pendingDraw.width,
        height: pendingDraw.height,
        description: data.description,
        severity: data.severity,
      });
      setDamages((prev) => [newDamage, ...prev]);
      setFormDialogOpen(false);
      setPendingDraw(null);
      toast.success('Damage created');
    } catch {
      toast.error('Failed to create damage');
    } finally {
      setSaving(false);
    }
  }

  function handleDamageClick(damage: DamageMarking) {
    setSelectedDamage(damage);
    setDetailOpen(true);
  }

  async function handleDamageMove(damageId: string, relX: number, relY: number) {
    if (!vehicleId) return;

    setDamages((prev) =>
      prev.map((d) => (d.id === damageId ? { ...d, x: relX, y: relY } : d)),
    );

    try {
      await damageService.moveDamage(vehicleId, damageId, { x: relX, y: relY });
    } catch {
      loadDamages();
      toast.error('Failed to move damage');
    }
  }

  async function handleDeleteDamage(damageId: string) {
    if (!vehicleId) return;

    setDeleteLoading(true);
    try {
      await damageService.deleteDamage(vehicleId, damageId);
      setDamages((prev) => prev.filter((d) => d.id !== damageId));
      setDetailOpen(false);
      setSelectedDamage(null);
      toast.success('Damage deleted');
    } catch {
      toast.error('Failed to delete damage');
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleRepairDamage(damageId: string) {
    if (!vehicleId) return;

    setRepairLoading(true);
    try {
      const updated = await damageService.repairDamage(vehicleId, damageId);
      setDamages((prev) => prev.map((d) => (d.id === damageId ? updated : d)));
      setDetailOpen(false);
      setSelectedDamage(null);
      toast.success('Damage marked as repaired');
    } catch {
      toast.error('Failed to mark damage as repaired');
    } finally {
      setRepairLoading(false);
    }
  }

  function closeFormDialog() {
    setFormDialogOpen(false);
    setPendingDraw(null);
  }

  function closeDetailPopup() {
    setDetailOpen(false);
    setSelectedDamage(null);
  }

  return {
    damages,
    activeTool,
    setActiveTool,
    formDialogOpen,
    selectedDamage,
    detailOpen,
    saving,
    deleteLoading,
    showRepaired,
    setShowRepaired,
    repairLoading,
    handleCanvasDraw,
    handleFormSave,
    handleDamageClick,
    handleDamageMove,
    handleDeleteDamage,
    handleRepairDamage,
    closeFormDialog,
    closeDetailPopup,
  };
}
