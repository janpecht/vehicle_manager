import { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/Button.tsx';
import { Alert } from '../ui/Alert.tsx';
import { Skeleton } from '../ui/Skeleton.tsx';
import { Modal } from '../ui/Modal.tsx';
import * as checklistService from '../../services/checklist.service.ts';
import * as vehicleService from '../../services/vehicle.service.ts';
import * as driverService from '../../services/driver.service.ts';
import type { ChecklistSubmission, PaginatedChecklists } from '../../types/checklist.ts';
import type { Vehicle } from '../../types/vehicle.ts';
import type { Driver } from '../../types/driver.ts';
import {
  DAMAGE_VISIBILITY_LABELS,
  DASHBOARD_WARNING_LABELS,
  FUEL_LABELS,
} from '../../types/checklist.ts';
import type { DashboardWarning } from '../../types/checklist.ts';
import { getApiErrorMessage } from '../../utils/apiError.ts';

export function ChecklistListPage() {
  const [data, setData] = useState<PaginatedChecklists | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  // Filters
  const [filterVehicleId, setFilterVehicleId] = useState('');
  const [filterDriverId, setFilterDriverId] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  // Reference data for filters
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);

  // Detail modal
  const [selectedSubmission, setSelectedSubmission] = useState<ChecklistSubmission | null>(null);
  const [photos, setPhotos] = useState<{ id: string; filename: string; mimeType: string }[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);

  // Photo gallery overlay
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);

  // Track request version to discard stale responses
  const requestId = useRef(0);

  useEffect(() => {
    Promise.all([
      vehicleService.listVehicles({ page: 1, limit: 100, includeInactive: true }),
      driverService.listDrivers(true),
    ]).then(([v, d]) => {
      setVehicles(v.vehicles);
      setDrivers(d);
    }).catch((err) => {
      console.error('Failed to load filter data:', err);
    });
  }, []);

  useEffect(() => {
    const id = ++requestId.current;
    setLoading(true);
    setError('');

    checklistService.listChecklists({
      vehicleId: filterVehicleId || undefined,
      driverId: filterDriverId || undefined,
      dateFrom: filterDateFrom || undefined,
      dateTo: filterDateTo || undefined,
      page,
      limit: 20,
    }).then((result) => {
      if (id === requestId.current) setData(result);
    }).catch((err) => {
      if (id === requestId.current) setError(getApiErrorMessage(err, 'Fehler beim Laden'));
    }).finally(() => {
      if (id === requestId.current) setLoading(false);
    });
  }, [filterVehicleId, filterDriverId, filterDateFrom, filterDateTo, page]);

  function openDetail(sub: ChecklistSubmission) {
    setSelectedSubmission(sub);
    setPhotos([]);
    setLoadingPhotos(true);
    checklistService.listChecklistPhotos(sub.id)
      .then(setPhotos)
      .catch(() => setPhotos([]))
      .finally(() => setLoadingPhotos(false));
  }

  function resetFilters() {
    setFilterVehicleId('');
    setFilterDriverId('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setPage(1);
  }

  const yn = (v: boolean | null) => (v === null ? '-' : v ? 'JA' : 'NEIN');

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">KFZ Checklisten</h2>
      </div>

      {/* Filters */}
      <div className="mb-4 rounded-lg bg-white p-4 shadow">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Fahrzeug</label>
            <select
              value={filterVehicleId}
              onChange={(e) => { setFilterVehicleId(e.target.value); setPage(1); }}
              className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
            >
              <option value="">Alle</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.licensePlate}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Fahrer</label>
            <select
              value={filterDriverId}
              onChange={(e) => { setFilterDriverId(e.target.value); setPage(1); }}
              className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
            >
              <option value="">Alle</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Von</label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => { setFilterDateFrom(e.target.value); setPage(1); }}
              className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Bis</label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => { setFilterDateTo(e.target.value); setPage(1); }}
              className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={resetFilters}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              Filter zurücksetzen
            </button>
          </div>
        </div>
      </div>

      {error && <div className="mb-4"><Alert type="error" message={error} /></div>}

      {/* Loading */}
      {loading && !data && (
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="divide-y divide-gray-200">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-8 px-6 py-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {data && data.submissions.length === 0 && (
        <div className="rounded-lg bg-white p-8 text-center shadow">
          <p className="text-gray-500">Keine Einträge gefunden.</p>
        </div>
      )}

      {/* Table */}
      {data && data.submissions.length > 0 && (
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Datum</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Fahrer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Fahrzeug</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">km</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Schäden</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.submissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                      {new Date(sub.submittedAt).toLocaleString('de-DE')}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                      {sub.driver.name}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                      {sub.vehicle.licensePlate}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                      {sub.mileage.toLocaleString('de-DE')}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <DamageStatusBadge status={sub.damageVisibility} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                      <button
                        onClick={() => openDetail(sub)}
                        className="font-medium text-blue-600 hover:text-blue-500"
                      >
                        Anzeigen
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-6 py-3">
              <span className="text-sm text-gray-700">
                Seite {data.page} von {data.totalPages} ({data.total} Einträge)
              </span>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                  Zurück
                </Button>
                <Button variant="secondary" onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))} disabled={page >= data.totalPages}>
                  Weiter
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        open={!!selectedSubmission}
        onClose={() => setSelectedSubmission(null)}
        title="Checklist-Details"
      >
        {selectedSubmission && (
          <div className="space-y-3 text-sm">
            <DetailRow label="Eingereicht am" value={new Date(selectedSubmission.submittedAt).toLocaleString('de-DE')} />
            <DetailRow label="Fahrer/in" value={selectedSubmission.driver.name} />
            <DetailRow label="Fahrzeug" value={selectedSubmission.vehicle.licensePlate} />
            <DetailRow label="Kilometerstand" value={selectedSubmission.mileage.toLocaleString('de-DE')} />
            <hr />
            <DetailRow label="Schäden sichtbar" value={DAMAGE_VISIBILITY_LABELS[selectedSubmission.damageVisibility]} />
            <DetailRow
              label="Fehlermeldung Anzeigen"
              value={
                selectedSubmission.dashboardWarnings.length > 0
                  ? selectedSubmission.dashboardWarnings.map((w: DashboardWarning) => DASHBOARD_WARNING_LABELS[w]).join(', ')
                  : 'NEIN - alles ok'
              }
            />
            <DetailRow label="Sitze/Flächen dreckig" value={yn(selectedSubmission.seatsDirty)} />
            <DetailRow label="Im Fahrzeug geraucht" value={yn(selectedSubmission.smokedInVehicle)} />
            <DetailRow label="Essensreste/Verpackungen" value={yn(selectedSubmission.foodLeftovers)} />
            <DetailRow label="Ladefläche dreckig" value={yn(selectedSubmission.cargoAreaDirty)} />
            <DetailRow label="Tiefkühlraum-Temp. ok" value={yn(selectedSubmission.freezerTempOk)} />
            <DetailRow label="Ladekabel vorhanden" value={yn(selectedSubmission.chargingCablesOk)} />
            {selectedSubmission.deliveryNotesPresent !== null && (
              <DetailRow label="Lieferscheine" value={yn(selectedSubmission.deliveryNotesPresent)} />
            )}
            {selectedSubmission.fuelLevel && (
              <DetailRow label="Tankfüllung" value={FUEL_LABELS[selectedSubmission.fuelLevel]} />
            )}
            {selectedSubmission.carWashNeeded !== null && (
              <DetailRow label="Waschanlage nötig" value={yn(selectedSubmission.carWashNeeded)} />
            )}
            {selectedSubmission.notes && (
              <>
                <hr />
                <DetailRow label="Anmerkungen" value={selectedSubmission.notes} />
              </>
            )}
            {/* Photos */}
            {loadingPhotos && (
              <>
                <hr />
                <p className="text-xs text-gray-500">Fotos werden geladen...</p>
              </>
            )}
            {photos.length > 0 && (
              <>
                <hr />
                <div>
                  <span className="font-medium text-gray-600">Schadensfotos</span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {photos.map((photo, idx) => (
                      <button
                        key={photo.id}
                        type="button"
                        onClick={() => setGalleryIndex(idx)}
                        className="cursor-pointer rounded-md border border-gray-200 hover:ring-2 hover:ring-blue-400"
                      >
                        <img
                          src={`/public/checklist-photos/${photo.id}`}
                          alt={photo.filename}
                          className="h-24 w-24 rounded-md object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* Photo Gallery Overlay */}
      {galleryIndex !== null && photos[galleryIndex] && (
        <PhotoGallery
          photos={photos}
          currentIndex={galleryIndex}
          onChangeIndex={setGalleryIndex}
          onClose={() => setGalleryIndex(null)}
        />
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="font-medium text-gray-600">{label}</span>
      <span className="text-right text-gray-900">{value}</span>
    </div>
  );
}

function PhotoGallery({
  photos,
  currentIndex,
  onChangeIndex,
  onClose,
}: {
  photos: { id: string; filename: string }[];
  currentIndex: number;
  onChangeIndex: (i: number) => void;
  onClose: () => void;
}) {
  const photo = photos[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < photos.length - 1;

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasPrev) onChangeIndex(currentIndex - 1);
      if (e.key === 'ArrowRight' && hasNext) onChangeIndex(currentIndex + 1);
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentIndex, hasPrev, hasNext, onClose, onChangeIndex]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-2xl text-white hover:bg-white/30"
      >
        &times;
      </button>

      {/* Counter */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-sm text-white/80">
        {currentIndex + 1} / {photos.length}
      </div>

      {/* Previous */}
      {hasPrev && (
        <button
          onClick={(e) => { e.stopPropagation(); onChangeIndex(currentIndex - 1); }}
          className="absolute left-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-2xl text-white hover:bg-white/30"
        >
          &#8249;
        </button>
      )}

      {/* Image */}
      <img
        src={`/public/checklist-photos/${photo.id}`}
        alt={photo.filename}
        className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Next */}
      {hasNext && (
        <button
          onClick={(e) => { e.stopPropagation(); onChangeIndex(currentIndex + 1); }}
          className="absolute right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-2xl text-white hover:bg-white/30"
        >
          &#8250;
        </button>
      )}
    </div>
  );
}

function DamageStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    NEW_DAMAGE: 'bg-red-100 text-red-800',
    KNOWN_DAMAGE: 'bg-yellow-100 text-yellow-800',
    NO_DAMAGE: 'bg-green-100 text-green-800',
  };
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] ?? 'bg-gray-100 text-gray-800'}`}>
      {DAMAGE_VISIBILITY_LABELS[status as keyof typeof DAMAGE_VISIBILITY_LABELS] ?? status}
    </span>
  );
}
