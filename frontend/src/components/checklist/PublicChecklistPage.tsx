import { useState, useEffect, useCallback } from 'react';
import { LoadingSpinner } from '../ui/LoadingSpinner.tsx';
import { Alert } from '../ui/Alert.tsx';
import { SprinterCanvas } from '../damage-canvas/SprinterCanvas.tsx';
import { ALL_VIEWS, VIEW_LABELS } from '../damage-canvas/sprinterSvgPaths.ts';
import * as publicService from '../../services/public.service.ts';
import type { Vehicle } from '../../types/vehicle.ts';
import type { Driver } from '../../types/driver.ts';
import type { DamageMarking } from '../../types/damage.ts';
import type {
  DamageVisibility,
  DashboardWarning,
  FuelLevel,
} from '../../types/checklist.ts';
import { useTranslation, type Lang } from './checklistI18n.ts';

export function PublicChecklistPage() {
  const [lang, setLang] = useState<Lang>('de');
  const t = useTranslation(lang);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Form fields
  const [driverId, setDriverId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [mileage, setMileage] = useState('');
  const [damageVisibility, setDamageVisibility] = useState<DamageVisibility | ''>('');
  const [dashboardWarnings, setDashboardWarnings] = useState<DashboardWarning[]>([]);
  const [dashboardNone, setDashboardNone] = useState(false);
  const [seatsDirty, setSeatsDirty] = useState<boolean | null>(null);
  const [smokedInVehicle, setSmokedInVehicle] = useState<boolean | null>(null);
  const [foodLeftovers, setFoodLeftovers] = useState<boolean | null>(null);
  const [cargoAreaDirty, setCargoAreaDirty] = useState<boolean | null>(null);
  const [freezerTempOk, setFreezerTempOk] = useState<boolean | null>(null);
  const [chargingCablesOk, setChargingCablesOk] = useState<boolean | null>(null);
  const [deliveryNotesPresent, setDeliveryNotesPresent] = useState<boolean | null>(null);
  const [fuelLevel, setFuelLevel] = useState<FuelLevel | ''>('');
  const [carWashNeeded, setCarWashNeeded] = useState<boolean | null>(null);
  const [notes, setNotes] = useState('');

  // Vehicle damages for display
  const [damages, setDamages] = useState<DamageMarking[]>([]);
  const [loadingDamages, setLoadingDamages] = useState(false);

  // Damage photos
  const [damagePhotos, setDamagePhotos] = useState<File[]>([]);

  useEffect(() => {
    Promise.all([publicService.getPublicVehicles(), publicService.getPublicDrivers()])
      .then(([v, d]) => {
        setVehicles(v);
        setDrivers(d);
      })
      .catch(() => setError(t('loadError')))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDamages = useCallback(async (vId: string) => {
    if (!vId) {
      setDamages([]);
      return;
    }
    setLoadingDamages(true);
    try {
      const report = await publicService.getPublicReport(vId);
      setDamages(report.damages.filter((d) => d.isActive));
    } catch {
      setDamages([]);
    } finally {
      setLoadingDamages(false);
    }
  }, []);

  function handleVehicleChange(id: string) {
    setVehicleId(id);
    loadDamages(id);
  }

  function handleDashboardWarningToggle(warning: DashboardWarning) {
    setDashboardNone(false);
    setDashboardWarnings((prev) =>
      prev.includes(warning) ? prev.filter((w) => w !== warning) : [...prev, warning]
    );
  }

  function handleDashboardNone() {
    setDashboardNone(true);
    setDashboardWarnings([]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (
      !driverId || !vehicleId || !mileage ||
      !damageVisibility ||
      (!dashboardNone && dashboardWarnings.length === 0) ||
      seatsDirty === null ||
      smokedInVehicle === null || foodLeftovers === null ||
      cargoAreaDirty === null || freezerTempOk === null ||
      chargingCablesOk === null
    ) {
      setError(t('validationError'));
      return;
    }

    setSubmitting(true);
    try {
      const submission = await publicService.submitChecklist({
        driverId,
        vehicleId,
        mileage: parseInt(mileage, 10),
        damageVisibility,
        dashboardWarnings,
        seatsDirty,
        smokedInVehicle,
        foodLeftovers,
        cargoAreaDirty,
        freezerTempOk,
        chargingCablesOk,
        ...(deliveryNotesPresent !== null ? { deliveryNotesPresent } : {}),
        ...(fuelLevel ? { fuelLevel } : {}),
        ...(carWashNeeded !== null ? { carWashNeeded } : {}),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      });

      // Upload damage photos if any
      if (damagePhotos.length > 0) {
        await publicService.uploadChecklistPhotos(submission.id, damagePhotos);
      }

      setSuccess(true);
    } catch {
      setError(t('submitError'));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-lg rounded-lg bg-white p-8 text-center shadow">
          <div className="mb-4 text-4xl">&#10003;</div>
          <h2 className="mb-2 text-xl font-semibold text-gray-900">{t('successTitle')}</h2>
          <p className="mb-6 text-gray-600">{t('successMessage')}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            {t('newChecklist')}
          </button>
        </div>
      </div>
    );
  }

  const selectedVehicle = vehicles.find((v) => v.id === vehicleId);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-2xl px-4">
        <div className="mb-6 rounded-t-lg bg-blue-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
              <p className="mt-1 text-sm text-blue-100">{t('subtitle')}</p>
            </div>
            <LanguageSwitcher lang={lang} onChange={setLang} />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="px-1">
              <Alert type="error" message={error} />
            </div>
          )}

          {/* Fahrer */}
          <FormSection label={t('driverLabel')} required>
            <select
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            >
              <option value="">{t('selectPlaceholder')}</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </FormSection>

          {/* Fahrzeug */}
          <FormSection label={t('vehicleLabel')} required>
            <select
              value={vehicleId}
              onChange={(e) => handleVehicleChange(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            >
              <option value="">{t('selectPlaceholder')}</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label ? `${v.label} ${v.licensePlate}` : v.licensePlate}
                </option>
              ))}
            </select>
          </FormSection>

          {/* Kilometerstand */}
          <FormSection label={t('mileageLabel')} required>
            <input
              type="number"
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder={t('mileagePlaceholder')}
              min={0}
              required
            />
          </FormSection>

          {/* Fahrzeug außen - Schäden */}
          <FormSection label={t('damageLabel')} required>
            {/* Vehicle damage graphics above the radio options */}
            {vehicleId && (
              <div className="mb-4">
                {loadingDamages ? (
                  <div className="flex justify-center py-4">
                    <LoadingSpinner size="sm" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {ALL_VIEWS.map((view) => {
                      const viewDamages = damages.filter((d) => d.viewSide === view);
                      return (
                        <div key={view} className="rounded-lg border border-gray-200 bg-white p-2">
                          <h4 className="mb-1 text-xs font-medium text-gray-500">
                            {VIEW_LABELS[view]}
                          </h4>
                          <SprinterCanvas
                            viewSide={view}
                            damages={viewDamages}
                            backgroundImageUrl={
                              selectedVehicle?.vehicleType
                                ? getViewImage(selectedVehicle.vehicleType, view)
                                : undefined
                            }
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            <RadioGroup
              name="damageVisibility"
              value={damageVisibility}
              onChange={(v) => {
                setDamageVisibility(v as DamageVisibility);
                if (v !== 'NEW_DAMAGE') setDamagePhotos([]);
              }}
              options={[
                { value: 'NEW_DAMAGE', label: t('damageNew') },
                { value: 'KNOWN_DAMAGE', label: t('damageKnown') },
                { value: 'NO_DAMAGE', label: t('damageNo') },
              ]}
            />
            {/* Photo upload when new damage is selected */}
            {damageVisibility === 'NEW_DAMAGE' && (
              <div className="mt-4 rounded-md border border-orange-200 bg-orange-50 p-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  {t('photoLabel')}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  onChange={(e) => {
                    if (e.target.files) {
                      setDamagePhotos((prev) => [...prev, ...Array.from(e.target.files!)]);
                    }
                  }}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
                />
                {damagePhotos.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-medium text-gray-600">
                      {t('photosSelected')(damagePhotos.length)}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {damagePhotos.map((file, idx) => (
                        <div key={idx} className="relative">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="h-20 w-20 rounded-md border border-gray-200 object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setDamagePhotos((prev) => prev.filter((_, i) => i !== idx))}
                            className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white hover:bg-red-600"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </FormSection>

          {/* Dashboard Warnings */}
          <FormSection label={t('dashboardWarningsLabel')} required>
            <CheckboxGroup
              options={[
                { value: 'OIL', label: t('dashboardOil'), checked: dashboardWarnings.includes('OIL') },
                { value: 'AD_BLUE', label: t('dashboardAdBlue'), checked: dashboardWarnings.includes('AD_BLUE') },
                { value: 'SONSTIGE', label: t('dashboardOther'), checked: dashboardWarnings.includes('SONSTIGE') },
              ]}
              onChange={(value) => handleDashboardWarningToggle(value as DashboardWarning)}
            />
            <div className="mt-1">
              <label className="flex cursor-pointer items-center gap-3 rounded-md p-2 hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={dashboardNone}
                  onChange={handleDashboardNone}
                  className="h-4 w-4 rounded text-blue-600"
                />
                <span className="text-sm text-gray-700">{t('dashboardNone')}</span>
              </label>
            </div>
          </FormSection>

          {/* Sitze dreckig */}
          <FormSection label={t('seatsLabel')} required>
            <RadioGroup
              name="seatsDirty"
              value={seatsDirty === null ? '' : seatsDirty ? 'true' : 'false'}
              onChange={(v) => setSeatsDirty(v === 'true')}
              options={[
                { value: 'true', label: t('seatsYes') },
                { value: 'false', label: t('seatsNo') },
              ]}
            />
          </FormSection>

          {/* Geraucht */}
          <FormSection label={t('smokedLabel')} required>
            <RadioGroup
              name="smokedInVehicle"
              value={smokedInVehicle === null ? '' : smokedInVehicle ? 'true' : 'false'}
              onChange={(v) => setSmokedInVehicle(v === 'true')}
              options={[
                { value: 'true', label: t('yes') },
                { value: 'false', label: t('no') },
              ]}
            />
          </FormSection>

          {/* Essensreste */}
          <FormSection label={t('foodLabel')} required>
            <RadioGroup
              name="foodLeftovers"
              value={foodLeftovers === null ? '' : foodLeftovers ? 'true' : 'false'}
              onChange={(v) => setFoodLeftovers(v === 'true')}
              options={[
                { value: 'true', label: t('yes') },
                { value: 'false', label: t('no') },
              ]}
            />
          </FormSection>

          {/* Ladefläche */}
          <FormSection label={t('cargoLabel')} required>
            <RadioGroup
              name="cargoAreaDirty"
              value={cargoAreaDirty === null ? '' : cargoAreaDirty ? 'true' : 'false'}
              onChange={(v) => setCargoAreaDirty(v === 'true')}
              options={[
                { value: 'true', label: t('yes') },
                { value: 'false', label: t('no') },
              ]}
            />
          </FormSection>

          {/* Temperatur */}
          <FormSection label={t('freezerLabel')} required>
            <RadioGroup
              name="freezerTempOk"
              value={freezerTempOk === null ? '' : freezerTempOk ? 'true' : 'false'}
              onChange={(v) => setFreezerTempOk(v === 'true')}
              options={[
                { value: 'true', label: t('freezerYes') },
                { value: 'false', label: t('freezerNo') },
              ]}
            />
          </FormSection>

          {/* Ladekabel */}
          <FormSection label={t('cablesLabel')} required>
            <RadioGroup
              name="chargingCablesOk"
              value={chargingCablesOk === null ? '' : chargingCablesOk ? 'true' : 'false'}
              onChange={(v) => setChargingCablesOk(v === 'true')}
              options={[
                { value: 'true', label: t('cablesYes') },
                { value: 'false', label: t('cablesNo') },
              ]}
            />
          </FormSection>

          {/* Lieferscheine (optional) */}
          <FormSection label={t('deliveryNotesLabel')}>
            <RadioGroup
              name="deliveryNotesPresent"
              value={deliveryNotesPresent === null ? '' : deliveryNotesPresent ? 'true' : 'false'}
              onChange={(v) => setDeliveryNotesPresent(v === 'true')}
              options={[
                { value: 'true', label: t('deliveryNotesYes') },
                { value: 'false', label: t('deliveryNotesNo') },
              ]}
            />
          </FormSection>

          {/* Tankfüllung (optional) */}
          <FormSection label={t('fuelLabel')}>
            <RadioGroup
              name="fuelLevel"
              value={fuelLevel}
              onChange={(v) => setFuelLevel(v as FuelLevel)}
              options={[
                { value: 'OK', label: t('fuelOk') },
                { value: 'LOW', label: t('fuelLow') },
              ]}
            />
          </FormSection>

          {/* Waschanlage (optional) */}
          <FormSection label={t('carWashLabel')}>
            <RadioGroup
              name="carWashNeeded"
              value={carWashNeeded === null ? '' : carWashNeeded ? 'true' : 'false'}
              onChange={(v) => setCarWashNeeded(v === 'true')}
              options={[
                { value: 'true', label: t('carWashYes') },
                { value: 'false', label: t('carWashNo') },
              ]}
            />
          </FormSection>

          {/* Anmerkungen */}
          <FormSection label={t('notesLabel')}>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-20 resize-y"
              placeholder={t('notesPlaceholder')}
              maxLength={1000}
            />
          </FormSection>

          <div className="rounded-b-lg bg-white p-6 shadow">
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? t('submitting') : t('submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LanguageSwitcher({ lang, onChange }: { lang: Lang; onChange: (l: Lang) => void }) {
  return (
    <div className="flex gap-1 rounded-md bg-blue-700 p-0.5">
      <button
        type="button"
        onClick={() => onChange('de')}
        className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
          lang === 'de' ? 'bg-white text-blue-700' : 'text-blue-100 hover:text-white'
        }`}
      >
        DE
      </button>
      <button
        type="button"
        onClick={() => onChange('en')}
        className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
          lang === 'en' ? 'bg-white text-blue-700' : 'text-blue-100 hover:text-white'
        }`}
      >
        EN
      </button>
    </div>
  );
}

function FormSection({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg bg-white p-5 shadow">
      <label className="mb-3 block text-sm font-medium text-gray-900">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function RadioGroup({
  name,
  value,
  onChange,
  options,
}: {
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-2">
      {options.map((opt) => (
        <label key={opt.value} className="flex cursor-pointer items-center gap-3 rounded-md p-2 hover:bg-gray-50">
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            className="h-4 w-4 text-blue-600"
          />
          <span className="text-sm text-gray-700">{opt.label}</span>
        </label>
      ))}
    </div>
  );
}

function CheckboxGroup({
  options,
  onChange,
}: {
  options: { value: string; label: string; checked: boolean }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      {options.map((opt) => (
        <label key={opt.value} className="flex cursor-pointer items-center gap-3 rounded-md p-2 hover:bg-gray-50">
          <input
            type="checkbox"
            checked={opt.checked}
            onChange={() => onChange(opt.value)}
            className="h-4 w-4 rounded text-blue-600"
          />
          <span className="text-sm text-gray-700">{opt.label}</span>
        </label>
      ))}
    </div>
  );
}

function getViewImage(
  vehicleType: { frontImage: string | null; rearImage: string | null; leftImage: string | null; rightImage: string | null },
  view: string,
): string | undefined {
  const map: Record<string, string | null> = {
    FRONT: vehicleType.frontImage,
    REAR: vehicleType.rearImage,
    LEFT: vehicleType.leftImage,
    RIGHT: vehicleType.rightImage,
  };
  return map[view] ?? undefined;
}
