import { useState, useEffect, useCallback } from 'react';
import { LoadingSpinner } from '../ui/LoadingSpinner.tsx';
import { Alert } from '../ui/Alert.tsx';
import { SprinterCanvas } from './SprinterCanvas.tsx';
import { DamageTable } from './DamageTable.tsx';
import { ALL_VIEWS, VIEW_LABELS, VIEW_ORDER } from './sprinterSvgPaths.ts';
import * as vehicleService from '../../services/vehicle.service.ts';
import * as damageService from '../../services/damage.service.ts';
import type { Vehicle } from '../../types/vehicle.ts';
import type { DamageMarking } from '../../types/damage.ts';
import type { ViewSide } from '../../types/damage.ts';
import type { VehicleType } from '../../types/vehicle.ts';
import { isNotFoundError, getApiErrorMessage } from '../../utils/apiError.ts';

const VIEW_IMAGE_KEY: Record<ViewSide, keyof VehicleType> = {
  FRONT: 'frontImage',
  REAR: 'rearImage',
  LEFT: 'leftImage',
  RIGHT: 'rightImage',
};

interface DamageReportProps {
  vehicleId: string;
}

export function DamageReport({ vehicleId }: DamageReportProps) {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [damages, setDamages] = useState<DamageMarking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [v, d] = await Promise.all([
        vehicleService.getVehicle(vehicleId),
        damageService.listDamages(vehicleId, { activeOnly: false }),
      ]);
      setVehicle(v);
      setDamages(d);
    } catch (err) {
      if (isNotFoundError(err)) {
        setError('Fahrzeug nicht gefunden');
      } else {
        setError(getApiErrorMessage(err, 'Fehler beim Laden der Berichtsdaten'));
      }
    } finally {
      setLoading(false);
    }
  }, [vehicleId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <Alert type="error" message={error} />;
  }

  if (!vehicle) return null;

  const sortedDamages = [...damages].sort((a, b) => {
    const viewDiff = VIEW_ORDER[a.viewSide] - VIEW_ORDER[b.viewSide];
    if (viewDiff !== 0) return viewDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <div className="print:text-center">
        <h2 className="text-xl font-semibold text-gray-900">
          Schadensbericht: {vehicle.licensePlate}
        </h2>
        {vehicle.label && <p className="text-sm text-gray-500">{vehicle.label}</p>}
        <p className="text-xs text-gray-400 print:text-gray-600">
          Erstellt: {new Date().toLocaleDateString('de-DE')}
        </p>
      </div>

      {/* 4-View Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 print:grid-cols-2">
        {ALL_VIEWS.map((view) => {
          const viewDamages = damages.filter((d) => d.viewSide === view);
          return (
            <div key={view} className="rounded-lg bg-white p-3 shadow print:shadow-none print:border print:border-gray-300 print:break-inside-avoid">
              <h3 className="mb-2 text-sm font-medium text-gray-700">{VIEW_LABELS[view]}</h3>
              <SprinterCanvas
                viewSide={view}
                damages={viewDamages}
                backgroundImageUrl={
                  (vehicle.vehicleType?.[VIEW_IMAGE_KEY[view]] as string | null) ?? undefined
                }
              />
              <p className="mt-1 text-xs text-gray-500">
                {viewDamages.filter((d) => d.isActive).length} aktive {viewDamages.filter((d) => d.isActive).length === 1 ? 'Schaden' : 'Schäden'}
              </p>
            </div>
          );
        })}
      </div>

      {/* Damage Table */}
      <div className="rounded-lg bg-white p-4 shadow print:shadow-none print:border print:border-gray-300 print:break-inside-avoid">
        <h3 className="mb-3 text-lg font-medium text-gray-900">Schadensliste</h3>
        {sortedDamages.length === 0 ? (
          <p className="text-sm text-gray-500">Keine Schäden für dieses Fahrzeug erfasst.</p>
        ) : (
          <DamageTable damages={sortedDamages} showStatus />
        )}
      </div>
    </div>
  );
}
