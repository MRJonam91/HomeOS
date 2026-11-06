# Architettura / Architecture — HomeOS

## 🇮🇹 Panoramica del Progetto

HomeOS è un sistema operativo per la gestione locale dell'abitazione ("Digital House Binder") progettato con un approccio **local-first, deterministico e privacy-by-design**.
Risolve la frammentazione tipica delle informazioni domestiche (manuali sparsi, scontrini sbiaditi, garanzie dimenticate, manutenzioni mancate) offrendo un unico registro ispezionabile e portabile in formato JSON standard.

### Principi Architetturali

1. **Local-First & Zero Telemetria**: Nessun account cloud obbligatorio, nessun tracking, zero dipendenze remote a runtime. I dati appartengono al proprietario o all'inquilino dell'immobile.
2. **Core compatto (< 1.500 LOC)**: Il motore essenziale risiede in `src/core/` ed è mantenuto volutamente snello, privo di framework pesanti, per consentire a chiunque di comprendere il codice e contribuire in meno di un'ora.
3. **Tripartizione dell'Integrità Dati**:
   - **Fatti Osservati**: Numeri di matricola registrati, documenti PDF allegati con data certa, fatture di intervento registrate.
   - **Valori Stimati**: Consumi energetici stimati (kWh/anno), potenza nominale, valore di sostituzione.
   - **Decisioni Umane Richieste**: Scadenze imminenti di garanzie, allerte su controlli obbligatori di sicurezza (fumo/gas/monossido), interventi tecnici con manodopera specializzata.

```
+-------------------------------------------------------------+
|                         CLI / UI                            |
|             (homeos init / list / search / audit)           |
+-------------------------------------------------------------+
                              |
+-------------------------------------------------------------+
|                         Core API                            |
|  +--------------------+  +-------------------------------+  |
|  |     Inventory      |  |           Warranty            |  |
|  | (Rooms & Items)    |  | (Lifecycle & Alert Engine)    |  |
|  +--------------------+  +-------------------------------+  |
|  +--------------------+  +-------------------------------+  |
|  |    Maintenance     |  |             Audit             |  |
|  | (Schedule & Costs) |  | (Tripartite Integrity Engine) |  |
|  +--------------------+  +-------------------------------+  |
|  +--------------------+  +-------------------------------+  |
|  |      Exporter      |  |           Fixtures            |  |
|  | (Markdown Dossier) |  |  (Synthetic Master Kitchen)   |  |
|  +--------------------+  +-------------------------------+  |
+-------------------------------------------------------------+
                              |
+-------------------------------------------------------------+
|                 Local JSON Storage Engine                   |
|               (homeos-ledger.json / schemas)                |
+-------------------------------------------------------------+
```

---

## 🛠️ Come Estendere / How to Extend

Aggiungere una nuova categoria, un nuovo controllo o un esportatore è immediato:

### 1. Aggiungere una nuova categoria o proprietà di consumo
1. Modifica `src/core/types.ts` aggiungendo i tipi desiderati all'interno di `ItemCategory`, `RoomCategory` o `ConsumptionProfile`.
2. Aggiungi il controllo nel calcolo `analyzeHomeIntegrity` in `src/core/audit.ts`.
3. Esegui `npm run typecheck` per verificare la coerenza dei tipi.

### 2. Aggiungere un nuovo esportatore (es. PDF, CSV, Home Assistant YAML)
1. Crea la funzione di export in `src/core/exporter.ts` (oppure in un modulo adapter dedicato sotto `src/adapters/`).
2. Scrivi un test mirato in `test/exporter.test.ts`.
3. Esponi il nuovo formato nella CLI in `src/cli/index.ts` con `--format <type>`.

---

## 🇬🇧 English Architecture Summary

HomeOS is a local-first, zero-telemetry household management engine and verifiable digital binder.
It organizes residential spaces around properties, rooms, appliances, warranties, documents, and recurring maintenance routines.
The architecture enforces strict separation between verifiable facts, model estimations, and pending human decisions.
All core components remain modular and strictly under 1,500 lines of clean TypeScript.
