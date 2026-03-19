# Claude Code Projekt-Prompt: KFZ Schadensmanagement-Tool

## Projekt-Übersicht
Entwickle ein vollständiges Web-Tool zur Schadensdokumentation für eine Flotte von Lieferwagen. Das Tool zeigt für jeden Sprinter (identifiziert durch Kennzeichen) eine interaktive 4-Seiten-Ansicht (Front, Heck, Links, Rechts), auf der Schäden per Klick als Kreise oder Rechtecke markiert werden können. Schäden können nach Reparatur entfernt werden. Die Grafiken lassen sich in Webformulare einbetten. Das Backend ist durch Login geschützt.

---

## Agent-Team-Struktur

Arbeite mit drei spezialisierten Agents, die iterativ zusammenarbeiten:

### 🏗️ Agent 1: Planungs- & Implementierungs-Agent (Lead)
- Erstellt die Architektur und implementiert alle Features
- Koordiniert die anderen Agents
- Reagiert auf Feedback der anderen Agents und überarbeitet Code

### 🧪 Agent 2: Test-Agent
- Schreibt Unit-Tests, Integrationstests und E2E-Tests für jedes Feature
- Führt alle Tests nach jeder Implementierungsphase aus
- Meldet Fehler an Agent 1 zurück

### 🔒 Agent 3: Security-Agent
- Prüft jeden Code-Abschnitt auf Sicherheitslücken
- Validiert Authentifizierung, Autorisierung, Input-Sanitization, CSRF, XSS, SQL-Injection
- Erstellt einen Security-Report nach jeder Phase und gibt Anweisungen an Agent 1

**Workflow pro Phase:**
1. Agent 1 plant und implementiert
2. Agent 2 schreibt Tests und führt sie aus
3. Agent 3 prüft Sicherheit
4. Agent 1 fixt gefundene Probleme
5. Wiederholen bis Phase stabil ist

---

## Technologie-Stack

### Backend
- **Runtime:** Node.js mit Express.js (oder alternativ: Python/FastAPI – entscheide basierend auf Eignung)
- **Datenbank:** PostgreSQL mit Prisma ORM
- **Authentifizierung:** JWT-basiert mit bcrypt-Passwort-Hashing, Refresh-Tokens
- **API:** RESTful JSON API

### Frontend
- **Framework:** React 18+ mit TypeScript
- **Styling:** Tailwind CSS
- **Canvas/SVG:** Fabric.js oder Konva.js für die interaktive Schadensmarkierung
- **State Management:** Zustand oder React Context
- **HTTP Client:** Axios mit Interceptors für Auth

### DevOps
- Docker Compose für lokale Entwicklung (App + PostgreSQL)
- Environment-basierte Konfiguration (.env)

---

## Datenmodell

```
User {
  id: UUID (PK)
  email: String (unique)
  passwordHash: String
  name: String
  role: Enum [ADMIN, USER]
  createdAt: DateTime
  updatedAt: DateTime
}

Vehicle {
  id: UUID (PK)
  licensePlate: String (unique) // z.B. "HD-AB 1234"
  label: String? // optionaler Anzeigename
  createdAt: DateTime
  updatedAt: DateTime
}

DamageMarking {
  id: UUID (PK)
  vehicleId: UUID (FK -> Vehicle)
  viewSide: Enum [FRONT, REAR, LEFT, RIGHT]
  shape: Enum [CIRCLE, RECTANGLE]
  x: Float // relative Position (0-1)
  y: Float // relative Position (0-1)
  width: Float // relative Größe
  height: Float // relative Größe
  description: String? // optionale Schadensbeschreibung
  severity: Enum [LOW, MEDIUM, HIGH]
  createdAt: DateTime
  createdBy: UUID (FK -> User)
  repairedAt: DateTime?
  repairedBy: UUID? (FK -> User)
  isActive: Boolean (default: true)
}
```

---

## Feature-Phasen (in dieser Reihenfolge implementieren)

### Phase 1: Projekt-Setup & Auth
- [ ] Projekt-Scaffolding (Monorepo mit `/backend` und `/frontend`)
- [ ] Docker Compose mit PostgreSQL
- [ ] Prisma-Schema und Migrationen
- [ ] User-Registration & Login API (POST /auth/register, POST /auth/login, POST /auth/refresh)
- [ ] JWT Middleware für geschützte Routen
- [ ] Login/Register-Seiten im Frontend
- [ ] Protected Route Wrapper im Frontend
- [ ] Automatischer Token-Refresh

**🧪 Test-Agent Phase 1:**
- Auth-API Unit-Tests (gültige/ungültige Credentials, Token-Expiry, Refresh-Flow)
- Frontend: Login-Flow E2E-Test

**🔒 Security-Agent Phase 1:**
- Passwort-Hashing verifizieren (bcrypt, min. 10 Rounds)
- JWT-Secret-Stärke prüfen
- Rate Limiting auf Auth-Endpoints
- CORS-Konfiguration prüfen
- Prüfe auf Token-Leakage in Logs/Responses

---

### Phase 2: Fahrzeugverwaltung
- [ ] CRUD-API für Fahrzeuge (GET/POST/PUT/DELETE /api/vehicles)
- [ ] Kennzeichen-Validierung (deutsches Format)
- [ ] Frontend: Fahrzeugliste mit Suchfunktion
- [ ] Frontend: Fahrzeug hinzufügen/bearbeiten/löschen Dialog
- [ ] Wählbare Anzahl Fahrzeuge (keine feste Begrenzung)

**🧪 Test-Agent Phase 2:**
- CRUD-Operationen testen
- Kennzeichen-Validierung Edge Cases
- Duplikat-Kennzeichen-Handling
- Frontend: Fahrzeugverwaltungs-Flow

**🔒 Security-Agent Phase 2:**
- Input-Sanitization bei Kennzeichen
- Autorisierung: Nur eingeloggte User dürfen Fahrzeuge verwalten
- SQL-Injection-Tests auf Suchfunktion

---

### Phase 3: Sprinter 4-Seiten-Ansicht (Kernfeature)
- [ ] SVG-Grafiken des Mercedes Sprinter erstellen/einbinden für alle 4 Seiten:
  - Front (Vorderansicht)
  - Rear (Heckansicht)
  - Left (Linke Seite)
  - Right (Rechte Seite)
- [ ] Verwende vereinfachte, saubere Vektor-Silhouetten des Sprinter
- [ ] Die 4 Ansichten werden als Tabs oder nebeneinander dargestellt
- [ ] Jede Ansicht ist ein interaktiver Canvas (Fabric.js/Konva.js) mit dem Sprinter-SVG als Hintergrund
- [ ] Responsive Darstellung (Desktop & Tablet)

**Wichtig:** Die Sprinter-Silhouetten sollen klar als Lieferwagen erkennbar sein. Nutze einfache SVG-Pfade, die programmatisch erstellt werden. Keine externen Bild-Assets nötig.

**🧪 Test-Agent Phase 3:**
- Canvas-Rendering auf allen 4 Ansichten
- Responsive-Verhalten testen
- SVG-Laden und Anzeige verifizieren

**🔒 Security-Agent Phase 3:**
- SVG-Injection prüfen (falls User SVGs hochladen könnten)
- Canvas-Export-Sanitization

---

### Phase 4: Interaktive Schadensmarkierung
- [ ] Toolbar: Werkzeugauswahl (Kreis, Rechteck, Auswahl/Verschieben)
- [ ] Per Klick/Drag auf Canvas: Schaden als Kreis oder Rechteck platzieren
- [ ] Schadensformular beim Platzieren:
  - Beschreibung (Freitext)
  - Schweregrad (Niedrig/Mittel/Hoch) → Farbcodierung (Grün/Gelb/Rot)
- [ ] Markierungen speichern via API (POST /api/vehicles/:id/damages)
- [ ] Bestehende Markierungen beim Laden anzeigen (GET /api/vehicles/:id/damages)
- [ ] Markierungen anklickbar → Detail-Popup mit Infos
- [ ] Relative Koordinaten speichern (0-1 Range), damit es bei verschiedenen Auflösungen funktioniert

**🧪 Test-Agent Phase 4:**
- Schadenserstellung auf allen 4 Seiten testen
- Koordinaten-Persistenz und Reload
- Kreise und Rechtecke separat testen
- Edge Cases: Überlappende Markierungen, Rand-Platzierungen
- API-Validierung der Damage-Endpoints

**🔒 Security-Agent Phase 4:**
- XSS in Beschreibungsfeldern prüfen
- Input-Validierung (Koordinaten-Ranges, String-Längen)
- Autorisierung: User kann nur eigene Fahrzeuge bearbeiten?

---

### Phase 5: Schadensentfernung (Reparatur)
- [ ] Kontextmenü oder Button bei Schadensmarkierung: "Als repariert markieren"
- [ ] Reparierte Schäden werden halbtransparent oder durchgestrichen dargestellt
- [ ] Reparatur-Log: Wer hat wann die Reparatur vermerkt
- [ ] Filter-Toggle: "Nur aktive Schäden anzeigen" / "Alle anzeigen (inkl. reparierte)"
- [ ] API: PATCH /api/damages/:id/repair

**🧪 Test-Agent Phase 5:**
- Reparatur-Workflow komplett testen
- Filter-Logik verifizieren
- Reparatur-Log Integrität
- Undo-Prävention: Reparierte Schäden nicht erneut reparierbar

**🔒 Security-Agent Phase 5:**
- Autorisierung: Wer darf Schäden als repariert markieren?
- Audit-Trail Manipulation prüfen (Timestamps server-seitig)

---

### Phase 6: Formular-Einbettung
- [ ] Export-Funktion: Aktuelle Canvas-Ansicht als PNG oder SVG exportieren
- [ ] Embed-Komponente: `<DamageReport vehicleId="..." />` React-Komponente
- [ ] Zusammenfassungs-Ansicht: Alle 4 Seiten eines Fahrzeugs auf einer Seite mit Schadensliste
- [ ] Druck-optimiertes Layout (CSS @media print)
- [ ] Optional: PDF-Export mit allen 4 Ansichten + Schadensliste
- [ ] Die Grafik (aktueller Stand) lässt sich als Bild oder iFrame in externe Formulare einbetten

**🧪 Test-Agent Phase 6:**
- Export-Qualität und -Format prüfen
- Einbettung in Testformular verifizieren
- Druckansicht testen
- PDF-Generierung (falls implementiert)

**🔒 Security-Agent Phase 6:**
- Embed-Authentifizierung (Token-basiert für iFrames?)
- Export-Dateien auf Malware-Injektion prüfen
- CORS für Embed-Endpunkte konfigurieren

---

### Phase 7: Finale Härtung & Polish
- [ ] Error Handling global (API & Frontend)
- [ ] Loading States und Skeleton Screens
- [ ] Toast-Benachrichtigungen für Aktionen
- [ ] Mobile-Optimierung (Touch-Gesten für Canvas)
- [ ] Datenbank-Indexe optimieren
- [ ] API-Dokumentation (Swagger/OpenAPI)
- [ ] README mit Setup-Anleitung

**🧪 Test-Agent Phase 7:**
- Vollständiger E2E-Test aller Flows
- Performance-Test mit vielen Fahrzeugen/Schäden
- Error-Handling-Szenarien durchspielen

**🔒 Security-Agent Phase 7:**
- Finaler Security-Audit:
  - Dependency-Check (npm audit)
  - OWASP Top 10 Checklist durchgehen
  - Helmet.js / Security Headers prüfen
  - Content Security Policy konfigurieren
  - Rate Limiting auf allen Endpoints
  - Logging sensibler Daten ausschließen
- Penetration-Test-Report erstellen

---

### Phase F: Passwort-Zurücksetzen
- [x] "Passwort vergessen?" Link auf Login-Seite
- [x] POST /auth/forgot-password — sendet 6-stelligen Reset-Code per E-Mail
- [x] POST /auth/reset-password — setzt Passwort mit gültigem Code zurück
- [x] Prisma-Modell: PasswordResetCode (SHA-256 gehasht, 15 Min. Ablauf, max. 5 Versuche)
- [x] Frontend: ForgotPasswordPage (E-Mail-Eingabe) → ResetPasswordPage (Code + neues Passwort)
- [x] Session-Invalidierung nach Passwort-Reset (alle Refresh-Tokens gelöscht)
- [x] Unverifizierte User können kein Passwort zurücksetzen
- [x] Rate Limiting auf beiden Endpoints (authLimiter: 5 Req/15 Min)

**🧪 Test-Agent Phase F:**
- 14 Backend-Tests (forgot-password + reset-password Flows)
- 9 Frontend-Tests (ForgotPasswordPage + ResetPasswordPage)
- Alle Tests grün

**🔒 Security-Agent Phase F:**
- CSPRNG, SHA-256, Constant-Time-Vergleich, Attempt-Limiting: ✅
- Session-Invalidierung nach Reset: ✅
- Unverifizierte User blockiert: ✅ (Security-Fix)
- Email-Enumeration: Akzeptiertes Risiko (per Anforderung)

---

## Konventionen & Qualitätsstandards

### Code
- TypeScript strict mode überall
- ESLint + Prettier konfiguriert
- Alle Funktionen/Komponenten dokumentiert (JSDoc)
- Keine `any` Types
- Error Handling mit Custom Error Classes

### Git
- Conventional Commits (feat:, fix:, security:, test:)
- Ein Commit pro abgeschlossener Teilaufgabe

### Projektstruktur
```
/
├── backend/
│   ├── src/
│   │   ├── auth/
│   │   ├── vehicles/
│   │   ├── damages/
│   │   ├── middleware/
│   │   ├── utils/
│   │   └── app.ts
│   ├── prisma/
│   ├── tests/
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   ├── vehicles/
│   │   │   ├── damage-canvas/
│   │   │   └── ui/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── App.tsx
│   ├── tests/
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## Abschluss-Checkliste

Bevor das Projekt als fertig gilt, müssen alle drei Agents bestätigen:

- [ ] **Agent 1 (Planning):** Alle Features implementiert, alle Bugfixes eingespielt
- [ ] **Agent 2 (Testing):** Alle Tests grün, Testabdeckung > 80%, kein kritischer Bug offen
- [ ] **Agent 3 (Security):** Kein offenes Security-Issue mit Severity HIGH oder CRITICAL, Security-Report abgenommen

Erst wenn alle drei Agents ihr ✅ geben, ist das Projekt abgeschlossen.
