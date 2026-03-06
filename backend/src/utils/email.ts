import nodemailer from 'nodemailer';
import { config } from '../config.js';

const DAMAGE_LABELS: Record<string, string> = {
  NEW_DAMAGE: 'JA - neuer Schaden',
  KNOWN_DAMAGE: 'JA - bekannte Schäden',
  NO_DAMAGE: 'NEIN',
};

const CLEANLINESS_LABELS: Record<string, string> = {
  CLEAN: 'JA',
  SLIGHTLY_DIRTY: 'NEIN - leicht verdreckt',
  VERY_DIRTY: 'NEIN - stark verdreckt',
};

const FUEL_LABELS: Record<string, string> = {
  OK: 'JA, mehr als halb voll',
  LOW: 'NEIN, weniger als halb voll',
};

interface ChecklistEmailData {
  driverName: string;
  vehiclePlate: string;
  date: string;
  mileage: number;
  damageVisibility: string;
  seatsCleanliness: string;
  smokedInVehicle: boolean;
  foodLeftovers: boolean;
  cargoAreaClean: boolean;
  freezerTempOk: boolean;
  chargingCablesOk: boolean;
  deliveryNotesPresent: boolean | null;
  fuelLevel: string | null;
  notes: string | null;
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

  const lines = [
    `Fahrer/in: ${data.driverName}`,
    `Datum: ${data.date}`,
    `Fahrzeug: ${data.vehiclePlate}`,
    `Kilometerstand: ${data.mileage}`,
    '',
    `Fahrzeug außen - Schäden sichtbar: ${DAMAGE_LABELS[data.damageVisibility] ?? data.damageVisibility}`,
    `Sitze und Flächen sauber: ${CLEANLINESS_LABELS[data.seatsCleanliness] ?? data.seatsCleanliness}`,
    `Im Fahrzeug geraucht: ${yn(data.smokedInVehicle)}`,
    `Essens-/Getränkereste: ${yn(data.foodLeftovers)}`,
    `Ladefläche sauber: ${yn(data.cargoAreaClean)}`,
    `Temperatur Tiefkühlraum ok: ${yn(data.freezerTempOk)}`,
    `Alle Ladekabel vorhanden: ${yn(data.chargingCablesOk)}`,
    ...(data.deliveryNotesPresent !== null
      ? [`Lieferscheine im Fahrzeug: ${yn(data.deliveryNotesPresent)}`]
      : []),
    ...(data.fuelLevel !== null
      ? [`Tankfüllung: ${FUEL_LABELS[data.fuelLevel] ?? data.fuelLevel}`]
      : []),
    ...(data.notes ? ['', `Anmerkungen: ${data.notes}`] : []),
  ];

  const subject = `KFZ Checklist: ${data.vehiclePlate} - ${data.driverName} (${data.date})`;

  await transporter.sendMail({
    from: config.SMTP_FROM ?? config.SMTP_USER ?? 'noreply@example.com',
    to: config.CHECKLIST_NOTIFY_EMAIL!,
    subject,
    text: lines.join('\n'),
  });
}
