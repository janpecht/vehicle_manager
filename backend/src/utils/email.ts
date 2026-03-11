import nodemailer from 'nodemailer';
import { config } from '../config.js';

const DAMAGE_LABELS: Record<string, string> = {
  NEW_DAMAGE: 'JA - neuer Schaden',
  KNOWN_DAMAGE: 'JA - bekannte Schäden',
  NO_DAMAGE: 'NEIN',
};

const DASHBOARD_WARNING_LABELS: Record<string, string> = {
  OIL: 'Ölanzeige',
  AD_BLUE: 'Ad Blue',
  SONSTIGE: 'Sonstige',
};

const FUEL_LABELS: Record<string, string> = {
  OK: 'JA, mehr als halb voll',
  LOW: 'NEIN, weniger als halb voll - DANN BITTE TANKEN',
};

export interface ChecklistEmailData {
  driverName: string;
  vehiclePlate: string;
  date: string;
  mileage: number;
  damageVisibility: string;
  dashboardWarnings: string[];
  seatsDirty: boolean;
  smokedInVehicle: boolean;
  foodLeftovers: boolean;
  cargoAreaDirty: boolean;
  freezerTempOk: boolean;
  chargingCablesOk: boolean;
  deliveryNotesPresent: boolean | null;
  fuelLevel: string | null;
  carWashNeeded: boolean | null;
  notes: string | null;
}

/** Check whether this submission has any alarm conditions */
export function hasAlarmCondition(data: ChecklistEmailData): boolean {
  return (
    data.damageVisibility === 'NEW_DAMAGE' ||
    data.dashboardWarnings.length > 0 ||
    data.seatsDirty === true ||
    data.foodLeftovers === true ||
    data.smokedInVehicle === true ||
    data.cargoAreaDirty === true ||
    data.freezerTempOk === false ||
    data.chargingCablesOk === false ||
    data.fuelLevel === 'LOW'
  );
}

function isSmtpConfigured(): boolean {
  return !!(config.SMTP_HOST && config.SMTP_PORT && config.CHECKLIST_NOTIFY_EMAIL);
}

export async function sendChecklistNotification(data: ChecklistEmailData): Promise<void> {
  if (!isSmtpConfigured()) return;

  const transporter = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    secure: config.SMTP_SECURE,
    ...(config.SMTP_USER && config.SMTP_PASS
      ? { auth: { user: config.SMTP_USER, pass: config.SMTP_PASS } }
      : {}),
  });

  const yn = (v: boolean) => (v ? 'JA' : 'NEIN');

  const dashboardStr = data.dashboardWarnings.length > 0
    ? data.dashboardWarnings.map((w) => DASHBOARD_WARNING_LABELS[w] ?? w).join(', ')
    : 'NEIN - alles ok';

  const lines = [
    `Fahrer/in: ${data.driverName}`,
    `Datum: ${data.date}`,
    `Fahrzeug: ${data.vehiclePlate}`,
    `Kilometerstand: ${data.mileage}`,
    '',
    `Fahrzeug außen - Schäden sichtbar: ${DAMAGE_LABELS[data.damageVisibility] ?? data.damageVisibility}`,
    `Fehlermeldung Anzeigen: ${dashboardStr}`,
    `Sitze/Flächen dreckig: ${yn(data.seatsDirty)}`,
    `Im Fahrzeug geraucht: ${yn(data.smokedInVehicle)}`,
    `Essensreste/Verpackungen: ${yn(data.foodLeftovers)}`,
    `Ladefläche dreckig: ${yn(data.cargoAreaDirty)}`,
    `Temperatur Tiefkühlraum ok: ${yn(data.freezerTempOk)}`,
    `Alle Ladekabel vorhanden: ${yn(data.chargingCablesOk)}`,
    ...(data.deliveryNotesPresent !== null
      ? [`Lieferscheine im Fahrzeug: ${yn(data.deliveryNotesPresent)}`]
      : []),
    ...(data.fuelLevel !== null
      ? [`Tankfüllung: ${FUEL_LABELS[data.fuelLevel] ?? data.fuelLevel}`]
      : []),
    ...(data.carWashNeeded !== null
      ? [`Waschanlage nötig: ${yn(data.carWashNeeded)}`]
      : []),
    ...(data.notes ? ['', `Anmerkungen: ${data.notes}`] : []),
  ];

  const isAlarm = hasAlarmCondition(data);
  const subject = `${isAlarm ? '[ALARM] ' : ''}KFZ Checklist: ${data.vehiclePlate} - ${data.driverName} (${data.date})`;

  await transporter.sendMail({
    from: config.SMTP_FROM ?? config.SMTP_USER ?? 'noreply@example.com',
    to: config.CHECKLIST_NOTIFY_EMAIL!,
    subject,
    text: lines.join('\n'),
  });
}
