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
  seatsLabel: { de: 'Fahrzeug innen - Sind die Sitze und Flächen sauber?', en: 'Vehicle interior - Are seats and surfaces clean?' },
  seatsClean: { de: 'JA', en: 'YES' },
  seatsSlightlyDirty: { de: 'NEIN - leicht verdreckt', en: 'NO - slightly dirty' },
  seatsVeryDirty: { de: 'NEIN - stark verdreckt', en: 'NO - very dirty' },
  smokedLabel: { de: 'Wurde im Fahrzeug geraucht?', en: 'Was there smoking in the vehicle?' },
  foodLabel: { de: 'Liegen unerlaubte Essens- oder Getränkereste rum?', en: 'Are there unauthorized food or drink leftovers?' },
  cargoLabel: { de: 'Ist die Ladefläche sauber?', en: 'Is the cargo area clean?' },
  freezerLabel: { de: 'Ist die Temperatur im Tiefkühlraum ok?', en: 'Is the freezer compartment temperature ok?' },
  cablesLabel: { de: 'Sind alle Ladekabel vorhanden?', en: 'Are all charging cables present?' },
  deliveryNotesLabel: { de: 'Sind Lieferscheine im Fahrzeug?', en: 'Are delivery notes in the vehicle?' },
  fuelLabel: { de: 'Ist die Tankfüllung ok?', en: 'Is the fuel level ok?' },
  fuelOk: { de: 'JA, mehr als halb voll', en: 'YES, more than half full' },
  fuelLow: { de: 'NEIN, weniger als halb voll', en: 'NO, less than half full' },
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
