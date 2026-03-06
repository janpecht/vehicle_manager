import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { LoadingSpinner } from '../ui/LoadingSpinner.tsx';
import { Alert } from '../ui/Alert.tsx';
import { SprinterCanvas } from '../damage-canvas/SprinterCanvas.tsx';
import { DamageTable } from '../damage-canvas/DamageTable.tsx';
import { ALL_VIEWS, VIEW_LABELS, VIEW_ORDER } from '../damage-canvas/sprinterSvgPaths.ts';
import * as publicService from '../../services/public.service.ts';
import { isNotFoundError } from '../../utils/apiError.ts';
import type { Vehicle } from '../../types/vehicle.ts';
import type { DamageMarking, ViewSide } from '../../types/damage.ts';
import type { VehicleType } from '../../types/vehicle.ts';

const VIEW_IMAGE_KEY: Record<ViewSide, keyof VehicleType> = {
  FRONT: 'frontImage',
  REAR: 'rearImage',
  LEFT: 'leftImage',
  RIGHT: 'rightImage',
};

export function PublicReportPage() {
  const { id } = useParams<{ id: string }>();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [damages, setDamages] = useState<DamageMarking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const data = await publicService.getPublicReport(id);
      setVehicle(data.vehicle);
      setDamages(data.damages);
    } catch (err) {
      if (isNotFoundError(err)) {
        setError('Fahrzeug nicht gefunden');
      } else {
        setError('Fehler beim Laden der Daten');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Alert type="error" message={error} />
      </div>
    );
  }

  if (!vehicle) return null;

  const activeDamages = damages.filter((d) => d.isActive);
  const sortedDamages = [...activeDamages].sort((a, b) => {
    const viewDiff = VIEW_ORDER[a.viewSide] - VIEW_ORDER[b.viewSide];
    if (viewDiff !== 0) return viewDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm print:shadow-none print:border-b print:border-gray-300">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
            Schadensbericht: {vehicle.licensePlate}
          </h1>
          {vehicle.label && <p className="text-sm text-gray-500">{vehicle.label}</p>}
          <p className="mt-1 text-xs text-gray-400 print:text-gray-600">
            Stand: {new Date().toLocaleDateString('de-DE')} &middot;{' '}
            {activeDamages.length} aktive{activeDamages.length === 1 ? 'r Schaden' : ' Schäden'}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {/* 4-View Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 print:grid-cols-2">
          {ALL_VIEWS.map((view) => {
            const viewDamages = activeDamages.filter((d) => d.viewSide === view);
            return (
              <div
                key={view}
                className="rounded-lg bg-white p-3 shadow-sm sm:p-4 print:shadow-none print:border print:border-gray-300 print:break-inside-avoid"
              >
                <h2 className="mb-2 text-sm font-semibold text-gray-700 sm:text-base">
                  {VIEW_LABELS[view]}
                </h2>
                <SprinterCanvas
                  viewSide={view}
                  damages={viewDamages}
                  backgroundImageUrl={
                    (vehicle.vehicleType?.[VIEW_IMAGE_KEY[view]] as string | null) ?? undefined
                  }
                />
                <p className="mt-1 text-xs text-gray-500">
                  {viewDamages.length} {viewDamages.length === 1 ? 'Schaden' : 'Schäden'}
                </p>
              </div>
            );
          })}
        </div>

        {/* Damage Table */}
        {sortedDamages.length > 0 ? (
          <div className="mt-6 rounded-lg bg-white p-4 shadow-sm print:shadow-none print:border print:border-gray-300 print:break-inside-avoid">
            <h2 className="mb-3 text-base font-semibold text-gray-900 sm:text-lg">Schadensliste</h2>
            <DamageTable
              damages={sortedDamages}
              locale="de-DE"
              translateShape={(s) => (s === 'CIRCLE' ? 'Kreis' : 'Rechteck')}
            />
          </div>
        ) : (
          <div className="mt-6 rounded-lg bg-white p-6 text-center shadow-sm">
            <p className="text-gray-500">Keine aktiven Schäden für dieses Fahrzeug vorhanden.</p>
          </div>
        )}
      </main>

      {/* Print button (hidden on print) */}
      <div className="fixed bottom-4 right-4 print:hidden">
        <button
          onClick={() => window.print()}
          className="rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-lg hover:bg-gray-800 transition-colors"
        >
          Drucken
        </button>
      </div>
    </div>
  );
}
