import { useState, useEffect, useRef } from 'react';
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
import type { Vehicle } from '../../types/vehicle.ts';
import { downloadCanvasAsPng } from '../../utils/exportCanvas.ts';
import { isNotFoundError, getApiErrorMessage } from '../../utils/apiError.ts';
import { useDamageManager } from '../../hooks/useDamageManager.ts';

export function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeView, setActiveView] = useState<ViewSide>('LEFT');
  const stageRef = useRef<Konva.Stage>(null);

  const dm = useDamageManager(id, !!vehicle);
  const viewDamages = dm.damages.filter((d) => d.viewSide === activeView);

  // Resolve custom background image from vehicle type
  const VIEW_IMAGE_MAP: Record<string, 'frontImage' | 'rearImage' | 'leftImage' | 'rightImage'> = {
    FRONT: 'frontImage',
    REAR: 'rearImage',
    LEFT: 'leftImage',
    RIGHT: 'rightImage',
  };
  const bgImageUrl = vehicle?.vehicleType?.[VIEW_IMAGE_MAP[activeView]] ?? undefined;

  useEffect(() => {
    if (!id) return;

    async function fetchVehicle() {
      setLoading(true);
      setError('');
      try {
        const v = await vehicleService.getVehicle(id!);
        setVehicle(v);
      } catch (err) {
        if (isNotFoundError(err)) {
          setError('Vehicle not found');
        } else {
          setError(getApiErrorMessage(err, 'Failed to load vehicle'));
        }
      } finally {
        setLoading(false);
      }
    }

    fetchVehicle();
  }, [id]);

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
            {vehicle.formLink && (
              <a
                href={vehicle.formLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-500 hover:underline"
              >
                Damage Report Form
              </a>
            )}
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
          activeTool={dm.activeTool}
          onToolChange={dm.setActiveTool}
          damageCount={viewDamages.length}
          showRepaired={dm.showRepaired}
          onShowRepairedChange={dm.setShowRepaired}
        />
      </div>

      {/* Canvas */}
      <div className="rounded-lg bg-white p-4 shadow">
        <SprinterCanvas
          viewSide={activeView}
          damages={viewDamages}
          activeTool={dm.activeTool}
          selectedDamageId={dm.selectedDamage?.id ?? null}
          stageRef={stageRef}
          backgroundImageUrl={bgImageUrl}
          onCanvasDraw={dm.handleCanvasDraw}
          onDamageClick={dm.handleDamageClick}
          onDamageMove={dm.handleDamageMove}
        />
      </div>

      {/* Form Dialog */}
      <DamageFormDialog
        open={dm.formDialogOpen}
        onClose={dm.closeFormDialog}
        onSave={(data) => dm.handleFormSave(activeView, data)}
        shape={dm.activeTool === 'RECTANGLE' ? 'RECTANGLE' : 'CIRCLE'}
        loading={dm.saving}
      />

      {/* Detail Popup */}
      <DamageDetailPopup
        open={dm.detailOpen}
        onClose={dm.closeDetailPopup}
        onDelete={dm.handleDeleteDamage}
        onRepair={dm.handleRepairDamage}
        damage={dm.selectedDamage}
        deleteLoading={dm.deleteLoading}
        repairLoading={dm.repairLoading}
      />
    </div>
  );
}
