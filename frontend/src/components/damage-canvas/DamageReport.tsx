import { useState, useEffect, useCallback } from 'react';
import { LoadingSpinner } from '../ui/LoadingSpinner.tsx';
import { Alert } from '../ui/Alert.tsx';
import { SprinterCanvas } from './SprinterCanvas.tsx';
import { ALL_VIEWS, VIEW_LABELS } from './sprinterSvgPaths.ts';
import * as vehicleService from '../../services/vehicle.service.ts';
import * as damageService from '../../services/damage.service.ts';
import type { Vehicle } from '../../types/vehicle.ts';
import type { DamageMarking } from '../../types/damage.ts';
import { SEVERITY_COLORS, SEVERITY_LABELS } from '../../types/damage.ts';
import type { ApiError } from '../../types/auth.ts';
import axios from 'axios';

interface DamageReportProps {
  vehicleId: string;
}

const VIEW_ORDER = { FRONT: 0, REAR: 1, LEFT: 2, RIGHT: 3 } as const;

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
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setError('Vehicle not found');
      } else if (axios.isAxiosError(err) && err.response?.data) {
        setError((err.response.data as ApiError).error.message);
      } else {
        setError('Failed to load report data');
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
          Damage Report: {vehicle.licensePlate}
        </h2>
        {vehicle.label && <p className="text-sm text-gray-500">{vehicle.label}</p>}
        <p className="text-xs text-gray-400 print:text-gray-600">
          Generated: {new Date().toLocaleDateString()}
        </p>
      </div>

      {/* 4-View Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 print:grid-cols-2">
        {ALL_VIEWS.map((view) => {
          const viewDamages = damages.filter((d) => d.viewSide === view);
          return (
            <div key={view} className="rounded-lg bg-white p-3 shadow print:shadow-none print:border print:border-gray-300 print:break-inside-avoid">
              <h3 className="mb-2 text-sm font-medium text-gray-700">{VIEW_LABELS[view]}</h3>
              <SprinterCanvas viewSide={view} damages={viewDamages} />
              <p className="mt-1 text-xs text-gray-500">
                {viewDamages.filter((d) => d.isActive).length} active damage{viewDamages.filter((d) => d.isActive).length !== 1 ? 's' : ''}
              </p>
            </div>
          );
        })}
      </div>

      {/* Damage Table */}
      <div className="rounded-lg bg-white p-4 shadow print:shadow-none print:border print:border-gray-300 print:break-inside-avoid">
        <h3 className="mb-3 text-lg font-medium text-gray-900">Damage List</h3>
        {sortedDamages.length === 0 ? (
          <p className="text-sm text-gray-500">No damages recorded for this vehicle.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-xs uppercase text-gray-500">
                  <th className="pb-2 pr-4">View</th>
                  <th className="pb-2 pr-4">Shape</th>
                  <th className="pb-2 pr-4">Severity</th>
                  <th className="pb-2 pr-4">Description</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {sortedDamages.map((damage) => (
                  <tr key={damage.id} className="border-b last:border-0">
                    <td className="py-2 pr-4">{VIEW_LABELS[damage.viewSide]}</td>
                    <td className="py-2 pr-4">{damage.shape}</td>
                    <td className="py-2 pr-4">
                      <span
                        className="inline-block rounded-full px-2 py-0.5 text-xs font-semibold text-white"
                        style={{ backgroundColor: SEVERITY_COLORS[damage.severity] }}
                      >
                        {SEVERITY_LABELS[damage.severity]}
                      </span>
                    </td>
                    <td className="py-2 pr-4 max-w-48 truncate">{damage.description ?? '—'}</td>
                    <td className="py-2 pr-4">
                      {damage.isActive ? (
                        <span className="text-green-600 font-medium">Active</span>
                      ) : (
                        <span className="text-gray-400">Repaired</span>
                      )}
                    </td>
                    <td className="py-2 text-gray-500">
                      {new Date(damage.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
