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
  previousDriverName: string | null;
  previousSubmissionDate: string | null;
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

function esc(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

interface ChecklistRow {
  label: string;
  value: string;
  isAlarm: boolean;
}

function buildChecklistRows(data: ChecklistEmailData): ChecklistRow[] {
  const rows: ChecklistRow[] = [];

  const damageLabel = DAMAGE_LABELS[data.damageVisibility] ?? data.damageVisibility;
  rows.push({
    label: 'Fahrzeug außen - Schäden sichtbar',
    value: damageLabel,
    isAlarm: data.damageVisibility === 'NEW_DAMAGE',
  });

  const dashboardStr = data.dashboardWarnings.length > 0
    ? data.dashboardWarnings.map((w) => DASHBOARD_WARNING_LABELS[w] ?? w).join(', ')
    : 'NEIN - alles ok';
  rows.push({
    label: 'Fehlermeldung Anzeigen',
    value: dashboardStr,
    isAlarm: data.dashboardWarnings.length > 0,
  });

  rows.push({ label: 'Sitze/Flächen dreckig', value: data.seatsDirty ? 'JA' : 'NEIN', isAlarm: data.seatsDirty });
  rows.push({ label: 'Im Fahrzeug geraucht', value: data.smokedInVehicle ? 'JA' : 'NEIN', isAlarm: data.smokedInVehicle });
  rows.push({ label: 'Essensreste/Verpackungen', value: data.foodLeftovers ? 'JA' : 'NEIN', isAlarm: data.foodLeftovers });
  rows.push({ label: 'Ladefläche dreckig', value: data.cargoAreaDirty ? 'JA' : 'NEIN', isAlarm: data.cargoAreaDirty });
  rows.push({ label: 'Temperatur Tiefkühlraum ok', value: data.freezerTempOk ? 'JA' : 'NEIN', isAlarm: !data.freezerTempOk });
  rows.push({ label: 'Alle Ladekabel vorhanden', value: data.chargingCablesOk ? 'JA' : 'NEIN', isAlarm: !data.chargingCablesOk });

  if (data.deliveryNotesPresent !== null) {
    rows.push({ label: 'Lieferscheine im Fahrzeug', value: data.deliveryNotesPresent ? 'JA' : 'NEIN', isAlarm: false });
  }
  if (data.fuelLevel !== null) {
    rows.push({
      label: 'Tankfüllung',
      value: FUEL_LABELS[data.fuelLevel] ?? data.fuelLevel,
      isAlarm: data.fuelLevel === 'LOW',
    });
  }
  if (data.carWashNeeded !== null) {
    rows.push({ label: 'Waschanlage nötig', value: data.carWashNeeded ? 'JA' : 'NEIN', isAlarm: false });
  }

  return rows;
}

function buildHtmlEmail(data: ChecklistEmailData, isAlarm: boolean): string {
  const rows = buildChecklistRows(data);

  const rowsHtml = rows.map((row) => {
    const valueStyle = row.isAlarm
      ? 'color: #dc2626; font-weight: bold;'
      : '';
    return `<tr>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${esc(row.label)}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: right;${valueStyle ? ` ${valueStyle}` : ''}">${esc(row.value)}</td>
    </tr>`;
  }).join('\n');

  const previousSection = data.previousDriverName
    ? `<div style="margin-top: 20px; padding: 16px; background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
        <h3 style="margin: 0 0 8px; font-size: 14px; color: #6b7280;">Vorheriger Fahrer</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 4px 0; color: #374151;">Letzter Fahrer:</td>
            <td style="padding: 4px 0; text-align: right; font-weight: 500;">${esc(data.previousDriverName)}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #374151;">Letzte Übergabe:</td>
            <td style="padding: 4px 0; text-align: right; font-weight: 500;">${esc(data.previousSubmissionDate ?? '-')}</td>
          </tr>
        </table>
      </div>`
    : '';

  const notesSection = data.notes
    ? `<div style="margin-top: 20px; padding: 16px; background-color: #fffbeb; border-radius: 8px; border: 1px solid #fde68a;">
        <h3 style="margin: 0 0 8px; font-size: 14px; color: #92400e;">Anmerkungen</h3>
        <p style="margin: 0; color: #374151; white-space: pre-wrap;">${esc(data.notes)}</p>
      </div>`
    : '';

  const headerBg = isAlarm ? '#dc2626' : '#2563eb';

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 20px; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">

    <!-- Header -->
    <div style="background-color: ${headerBg}; padding: 20px 24px;">
      <h1 style="margin: 0; color: #ffffff; font-size: 18px;">KFZ Checkliste${isAlarm ? ' — ALARM' : ''}</h1>
      <p style="margin: 4px 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">${esc(data.vehiclePlate)}</p>
    </div>

    <div style="padding: 24px;">
      <!-- Fahrzeugübergabe -->
      <div style="margin-bottom: 20px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Fahrer/in:</td>
            <td style="padding: 6px 0; text-align: right; font-weight: 600; font-size: 14px;">${esc(data.driverName)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Datum:</td>
            <td style="padding: 6px 0; text-align: right; font-size: 14px;">${esc(data.date)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Kilometerstand:</td>
            <td style="padding: 6px 0; text-align: right; font-size: 14px;">${data.mileage.toLocaleString('de-DE')}</td>
          </tr>
        </table>
      </div>

      ${previousSection}

      <!-- Checkliste -->
      <div style="margin-top: 20px;">
        <h3 style="margin: 0 0 12px; font-size: 14px; color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Checkliste</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          ${rowsHtml}
        </table>
      </div>

      ${notesSection}
    </div>
  </div>
</body>
</html>`;
}

export async function sendChecklistNotification(data: ChecklistEmailData): Promise<void> {
  if (!isSmtpConfigured()) {
    console.log(`[EMAIL] SMTP not configured or CHECKLIST_NOTIFY_EMAIL not set — skipping checklist notification`);
    return;
  }

  console.log(`[EMAIL] Sending checklist notification for ${data.vehiclePlate} to ${config.CHECKLIST_NOTIFY_EMAIL}`);

  const transporter = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    secure: config.SMTP_SECURE,
    ...(config.SMTP_USER && config.SMTP_PASS
      ? { auth: { user: config.SMTP_USER, pass: config.SMTP_PASS } }
      : {}),
  });

  const isAlarm = hasAlarmCondition(data);
  const subject = `[KFZ CHECKLISTE]${isAlarm ? ' [ALARM]' : ''} ${data.vehiclePlate} - ${data.driverName} (${data.date})`;
  const html = buildHtmlEmail(data, isAlarm);

  try {
    const info = await transporter.sendMail({
      from: config.SMTP_FROM ?? config.SMTP_USER ?? 'noreply@example.com',
      to: config.CHECKLIST_NOTIFY_EMAIL!,
      subject,
      html,
    });
    console.log(`[EMAIL] Checklist notification sent successfully to ${config.CHECKLIST_NOTIFY_EMAIL} (messageId: ${info.messageId})`);
  } catch (err) {
    console.error(`[EMAIL] Failed to send checklist notification:`, err);
    throw err;
  }
}
