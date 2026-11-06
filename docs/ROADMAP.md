# Piano di Sviluppo / Roadmap — HomeOS

[Italiano](docs/ROADMAP.md) · [English](docs/ROADMAP.md) · [Architettura](docs/ARCHITECTURE.md) · [Checklist Lancio](docs/LAUNCH.md)

---

## 🇮🇹 Piano di Sviluppo

### ✅ Versione 1.0.0 — Rilascio Stabile Ufficiale (Corrente)
- **Modello Dati Gerarchico**: Immobile, Locali/Stanze, Apparati/Elettrodomestici, Garanzie, Libretti e Schede Tecniche.
- **Registro Locale Deterministico**: Storage JSON atomico con validazione rigorosa dei tipi e referenze (`src/core/validator.ts`).
- **Warranty Guardian**: Monitoraggio del ciclo di vita delle coperture (`attiva`, `in scadenza`, `scaduta`, `a vita`), giorni rimanenti e contatti assistenza.
- **Scadenziario Manutenzioni & Stima Costi**: Gestione routine preventive, calcolo automatico della data successiva al completamento, distinzione fai-da-te / tecnico specializzato e checklist.
- **Audit di Integrità Tripartito**: Netta separazione tra fatti osservati/verificati, indicatori stimati e decisioni umane richieste.
- **Fascicoli Digitali Bilingui**: Generazione dossier stanza e fascicolo generale dell'immobile in formato Markdown strutturato (IT/EN).
- **Dashboard HTML Autonoma**: Pagina interattiva responsive a zero CDN con supporto dark/light e foglio di stile ottimizzato per stampa PDF.
- **Ecosistema & Integrazioni Aperte**:
  - Feed iCalendar (`.ics`) conforme RFC 5545 con allarmi anticipati a 7 giorni per calendari personali.
  - Pacchetto integrazione YAML per Home Assistant (template sensors e automazioni di allerta).
  - Esportatore CSV conforme RFC per fogli di calcolo (inventario e calendario interventi).
  - Snapshot crittografico con digest SHA-256 e motore di comparazione/diff tra versioni del registro (`homeos diff`).

---

### 🔮 Versione 1.1.0 — Gestione Multi-Immobile & Vault Ricevute
- **Portafoglio Multi-Immobile**: Gestione centralizzata di prima casa, seconde case ed immobili a reddito con commutazione rapida di contesto.
- **Vault Documentale Locale con Hashing**: Verifica dell'integrità dei file PDF (manuali, scontrini, certificati APE/conformità) tramite calcolo hash SHA-256 locale.
- **OCR Locale da Riga di Comando**: Estrazione automatica di data, matricola e importo da scontrini fotografati o scansionati in locale via WebAssembly/Tesseract offline.

---

### 🔮 Versione 1.2.0 — Connettività IoT Locale & Storico Consumi
- **Bridge MQTT Locale**: Sottoscrizione passiva a broker MQTT locali (senza cloud) per acquisire misurazioni di potenza da contatori smart (Shelly EM, Sonoff POW, Tuya local).
- **Storico Prestazioni Energetiche**: Confronto tra consumi nominali stimati dei libretti e consumo reale registrato dai meter.
- **Registro Apparati Matter/Thread**: Mappatura delle credenziali di pairing locale e calendario aggiornamenti firmware.

---

## 🇬🇧 Roadmap Overview

### ✅ Version 1.0.0 — Official Stable Release (Current)
- Hierarchical property, room, item, warranty, document, and maintenance schema.
- Local-first deterministic JSON storage with rigorous schema validation.
- Warranty tracking with lifecycle states, expiration alarms, and support hotlines.
- Preventative maintenance scheduler with cost forecasting and task logging.
- Tripartite integrity audit: observed facts vs model estimates vs human decisions.
- Bilingual Markdown Room Dossiers and Master House Binders.
- Zero-CDN standalone HTML dashboard and printable PDF report.
- Ecosystem adapters: RFC 5545 iCalendar feeds, Home Assistant YAML packages, CSV exports, SHA-256 backups, and ledger diffs.

### 🔮 Version 1.1.0 — Multi-Property & Document Vault
- Portfolio switcher for multiple homes, rentals, and vacation properties.
- Local document hashing & tamper detection for attached manuals and warranties.
- Offline WebAssembly OCR for appliance labels and paper receipts.

### 🔮 Version 1.2.0 — Local IoT & Energy Tracking
- Local MQTT listener for smart power plugs and clamp energy meters (Shelly, Sonoff).
- Real vs estimated annual energy consumption analytics.
- Matter/Thread device pairing records and maintenance schedule.
