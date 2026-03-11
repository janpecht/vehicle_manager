export type Lang = 'de' | 'en';

const translations = {
  title: { de: 'KFZ Checklist', en: 'Vehicle Checklist' },
  subtitle: { de: 'Bitte vor jeder Schicht ausfüllen!', en: 'Please fill out before every shift!' },
  selectPlaceholder: { de: 'Bitte auswählen', en: 'Please select' },
  driverLabel: { de: 'Name des Fahrers/Fahrerin', en: 'Driver name' },
  vehicleLabel: { de: 'Fahrzeug', en: 'Vehicle' },
  mileageLabel: { de: 'Kilometerstand bei Übergabe', en: 'Mileage at handover' },
  mileagePlaceholder: { de: 'z.B. 42000', en: 'e.g. 42000' },
  damageLabel: { de: 'Fahrzeug außen - Sind Schäden sichtbar?', en: 'Vehicle exterior - Is any damage visible?' },
  damageNew: { de: 'JA - neuer Schaden', en: 'YES - new damage' },
  damageKnown: { de: 'JA - bekannte Schäden', en: 'YES - known damage' },
  damageNo: { de: 'NEIN', en: 'NO' },
  photoLabel: { de: 'Fotos vom Schaden aufnehmen / hochladen', en: 'Take / upload photos of the damage' },
  photosSelected: { de: (n: number) => `${n} Foto${n !== 1 ? 's' : ''} ausgewählt:`, en: (n: number) => `${n} photo${n !== 1 ? 's' : ''} selected:` },
  dashboardWarningsLabel: { de: 'Fahrzeug innen - Fehlermeldung Anzeigen', en: 'Vehicle interior - Dashboard warning lights' },
  dashboardOil: { de: 'Ölanzeige', en: 'Oil warning' },
  dashboardAdBlue: { de: 'Ad Blue', en: 'Ad Blue' },
  dashboardOther: { de: 'Sonstige', en: 'Other' },
  dashboardNone: { de: 'NEIN - alles ok', en: 'NO - all ok' },
  seatsLabel: { de: 'Sitze und/oder Flächen dreckig?', en: 'Seats and/or surfaces dirty?' },
  seatsYes: { de: 'JA', en: 'YES' },
  seatsNo: { de: 'NEIN', en: 'NO' },
  smokedLabel: { de: 'Wurde im Fahrzeug geraucht?', en: 'Was there smoking in the vehicle?' },
  foodLabel: { de: 'Essensreste und/oder Verpackungen in der Fahrerkabine?', en: 'Food leftovers and/or packaging in the driver cabin?' },
  cargoLabel: { de: 'Ist die Ladefläche dreckig?', en: 'Is the cargo area dirty?' },
  freezerLabel: { de: 'Ist die Temperatur im Tiefkühlraum ok?', en: 'Is the freezer compartment temperature ok?' },
  freezerYes: { de: 'JA - zwischen -18 und -1 Grad', en: 'YES - between -18 and -1 degrees' },
  freezerNo: { de: 'NEIN - 0 Grad oder höher - BITTE NICHT LOSFAHREN', en: 'NO - 0 degrees or higher - DO NOT DEPART' },
  cablesLabel: { de: 'Sind alle Ladekabel vorhanden?', en: 'Are all charging cables present?' },
  cablesYes: { de: 'JA', en: 'YES' },
  cablesNo: { de: 'NEIN - bitte im Büro passendes Kabel holen. KEINE Neukäufe!', en: 'NO - please get a suitable cable from the office. NO new purchases!' },
  deliveryNotesLabel: { de: 'Sind Lieferscheine im Fahrzeug?', en: 'Are delivery notes in the vehicle?' },
  deliveryNotesYes: { de: 'JA', en: 'YES' },
  deliveryNotesNo: { de: 'NEIN - bitte im Büro welche holen', en: 'NO - please get some from the office' },
  fuelLabel: { de: 'Ist die Tankfüllung ok?', en: 'Is the fuel level ok?' },
  fuelOk: { de: 'JA, mehr als halb voll', en: 'YES, more than half full' },
  fuelLow: { de: 'NEIN, weniger als halb voll - DANN BITTE TANKEN', en: 'NO, less than half full - PLEASE REFUEL' },
  carWashLabel: { de: 'Muss das Fahrzeug in die Waschanlage?', en: 'Does the vehicle need a car wash?' },
  carWashYes: { de: 'JA - dann bitte in die Waschanlage', en: 'YES - please take to car wash' },
  carWashNo: { de: 'NEIN - ist sauber', en: 'NO - it\'s clean' },
  notesLabel: { de: 'Anmerkungen', en: 'Notes' },
  notesPlaceholder: { de: 'Optionale Anmerkungen...', en: 'Optional notes...' },
  yes: { de: 'JA', en: 'YES' },
  no: { de: 'NEIN', en: 'NO' },
  submit: { de: 'Absenden', en: 'Submit' },
  submitting: { de: 'Wird gesendet...', en: 'Submitting...' },
  validationError: { de: 'Bitte alle Pflichtfelder ausfüllen.', en: 'Please fill out all required fields.' },
  submitError: { de: 'Fehler beim Absenden. Bitte versuche es erneut.', en: 'Error submitting. Please try again.' },
  loadError: { de: 'Fehler beim Laden der Daten', en: 'Error loading data' },
  successTitle: { de: 'Vielen Dank!', en: 'Thank you!' },
  successMessage: { de: 'Deine Antworten wurden gespeichert.', en: 'Your answers have been saved.' },
  newChecklist: { de: 'Neue Checklist ausfüllen', en: 'Fill out a new checklist' },
  language: { de: 'Sprache', en: 'Language' },
} as const;

type Key = keyof typeof translations;
type SimpleKey = { [K in Key]: (typeof translations)[K]['de'] extends string ? K : never }[Key];
type FnKey = { [K in Key]: (typeof translations)[K]['de'] extends Function ? K : never }[Key];

export function useTranslation(lang: Lang) {
  function t(key: SimpleKey): string;
  function t(key: FnKey): (n: number) => string;
  function t(key: Key): string | ((n: number) => string) {
    return translations[key][lang];
  }
  return t;
}
