import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import type Konva from 'konva';
import { Skeleton } from '../ui/Skeleton.tsx';
import { Alert } from '../ui/Alert.tsx';
import { Button } from '../ui/Button.tsx';
import { SprinterCanvas } from '../damage-canvas/SprinterCanvas.tsx';
import { DamageToolbar } from '../damage-canvas/DamageToolbar.tsx';
import { DamageFormDialog } from '../damage-canvas/DamageFormDialog.tsx';
import { DamageDetailPopup } from '../damage-canvas/DamageDetailPopup.tsx';
import { ALL_VIEWS, VIEW_LABELS, type ViewSide } from '../damage-canvas/sprinterSvgPaths.ts';
import * as vehicleService from '../../services/vehicle.service.ts';
import * as damageService from '../../services/damage.service.ts';
import type { Vehicle } from '../../types/vehicle.ts';
import type { DamageMarking, CanvasTool, Severity } from '../../types/damage.ts';
import { downloadCanvasAsPng } from '../../utils/exportCanvas.ts';
import { toast } from 'sonner';
import type { ApiError } from '../../types/auth.ts';
import axios from 'axios';

export function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeView, setActiveView] = useState<ViewSide>('LEFT');

  // Damage state
  const [damages, setDamages] = useState<DamageMarking[]>([]);
  const [activeTool, setActiveTool] = useState<CanvasTool>('POINTER');
  const [pendingDraw, setPendingDraw] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [selectedDamage, setSelectedDamage] = useState<DamageMarking | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showRepaired, setShowRepaired] = useState(false);
  const [repairLoading, setRepairLoading] = useState(false);
  const stageRef = useRef<Konva.Stage>(null);

  useEffect(() => {
    if (!id) return;

    async function fetchVehicle() {
      setLoading(true);
      setError('');
      try {
        const v = await vehicleService.getVehicle(id!);
        setVehicle(v);
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          setError('Vehicle not found');
        } else if (axios.isAxiosError(err) && err.response?.data) {
          setError((err.response.data as ApiError).error.message);
        } else {
          setError('Failed to load vehicle');
        }
      } finally {
        setLoading(false);
      }
    }

    fetchVehicle();
  }, [id]);

  const loadDamages = useCallback(async () => {
    if (!id) return;
    try {
      const data = await damageService.listDamages(id, { activeOnly: !showRepaired });
      setDamages(data);
    } catch {
      // Silently fail — damages are secondary to vehicle view
    }
  }, [id, showRepaired]);

  useEffect(() => {
    if (vehicle) {
      loadDamages();
    }
  }, [vehicle, loadDamages]);

  const viewDamages = damages.filter((d) => d.viewSide === activeView);

  function handleCanvasDraw(relX: number, relY: number, relW: number, relH: number) {
    setPendingDraw({ x: relX, y: relY, width: relW, height: relH });
    setFormDialogOpen(true);
  }

  async function handleFormSave(data: { description?: string; severity: Severity }) {
    if (!id || !pendingDraw) return;

    setSaving(true);
    try {
      const shape = activeTool === 'CIRCLE' ? 'CIRCLE' : 'RECTANGLE';
      const newDamage = await damageService.createDamage(id, {
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
    if (!id) return;

    // Optimistic update
    setDamages((prev) =>
      prev.map((d) => (d.id === damageId ? { ...d, x: relX, y: relY } : d)),
    );

    try {
      await damageService.moveDamage(id, damageId, { x: relX, y: relY });
    } catch {
      // Revert on failure
      loadDamages();
      toast.error('Failed to move damage');
    }
  }

  async function handleDeleteDamage(damageId: string) {
    if (!id) return;

    setDeleteLoading(true);
    try {
      await damageService.deleteDamage(id, damageId);
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
    if (!id) return;

    setRepairLoading(true);
    try {
      const updated = await damageService.repairDamage(id, damageId);
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

  function handleExportPng() {
    if (!stageRef.current || !vehicle) return;
    const filename = `${vehicle.licensePlate.replace(/\s+/g, '_')}_${activeView}`;
    downloadCanvasAsPng(stageRef.current, filename);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-9 w-20" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-28" />
          </div>
        </div>
        {/* Tab bar skeleton */}
        <Skeleton className="h-10 w-full rounded-lg" />
        {/* Toolbar skeleton */}
        <Skeleton className="h-9 w-64" />
        {/* Canvas skeleton */}
        <Skeleton className="h-80 w-full rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Alert type="error" message={error} />
        <Button variant="secondary" onClick={() => navigate('/')}>
          Back to Vehicles
        </Button>
      </div>
    );
  }

  if (!vehicle) return null;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="secondary" onClick={() => navigate('/')}>
            &larr; Back
          </Button>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{vehicle.licensePlate}</h2>
            {vehicle.label && <p className="text-sm text-gray-500">{vehicle.label}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={handleExportPng}>
            Export PNG
          </Button>
          <Link to={`/vehicles/${id}/report`}>
            <Button variant="secondary">View Report</Button>
          </Link>
          <Link to={`/report/vehicles/${id}`} target="_blank" rel="noopener noreferrer">
            <Button variant="primary">Public Link</Button>
          </Link>
        </div>
      </div>

      {/* View Tabs */}
      <div className="mb-4">
        <nav className="flex gap-1 rounded-lg bg-gray-100 p-1" aria-label="Vehicle views">
          {ALL_VIEWS.map((view) => (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                activeView === view
                  ? 'bg-white text-gray-900 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              aria-selected={activeView === view}
              role="tab"
            >
              {VIEW_LABELS[view]}
            </button>
          ))}
        </nav>
      </div>

      {/* Toolbar */}
      <div className="mb-4">
        <DamageToolbar
          activeTool={activeTool}
          onToolChange={setActiveTool}
          damageCount={viewDamages.length}
          showRepaired={showRepaired}
          onShowRepairedChange={setShowRepaired}
        />
      </div>

      {/* Canvas */}
      <div className="rounded-lg bg-white p-4 shadow">
        <SprinterCanvas
          viewSide={activeView}
          damages={viewDamages}
          activeTool={activeTool}
          selectedDamageId={selectedDamage?.id ?? null}
          stageRef={stageRef}
          onCanvasDraw={handleCanvasDraw}
          onDamageClick={handleDamageClick}
          onDamageMove={handleDamageMove}
        />
      </div>

      {/* Form Dialog */}
      <DamageFormDialog
        open={formDialogOpen}
        onClose={() => {
          setFormDialogOpen(false);
          setPendingDraw(null);
        }}
        onSave={handleFormSave}
        shape={activeTool === 'RECTANGLE' ? 'RECTANGLE' : 'CIRCLE'}
        loading={saving}
      />

      {/* Detail Popup */}
      <DamageDetailPopup
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setSelectedDamage(null);
        }}
        onDelete={handleDeleteDamage}
        onRepair={handleRepairDamage}
        damage={selectedDamage}
        deleteLoading={deleteLoading}
        repairLoading={repairLoading}
      />
    </div>
  );
}
