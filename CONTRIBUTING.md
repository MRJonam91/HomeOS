# Contribuire / Contributing — HomeOS

## 🇮🇹 Italiano

Grazie per l'interesse a contribuire a HomeOS! Il progetto è strutturato per essere compreso e modificato rapidamente:
il **core** (`src/core/`) è compatto e rispetta rigorosamente il limite di **1.500 righe di codice**, mentre CLI, parser e connettori vivono separatamente.

1. Apri una issue prima di intraprendere modifiche architetturali rilevanti.
2. `npm run typecheck` e `npm test` devono essere entrambi verdi (Node ≥ 22.18).
3. Aggiungi test mirati in `test/` per ogni bug corretto o nuova funzionalità.
4. Includi l'header SPDX in ogni nuovo file sorgente (`// SPDX-License-Identifier: AGPL-3.0-only`).
5. Usa messaggi di commit convenzionali ([Conventional Commits](https://www.conventionalcommits.org/it/)).
6. Firma il [CLA](CLA.md) inserendo nella PR il commento: `I have read the CLA and I hereby sign it.`

Per linee guida su architettura ed estensioni, consulta [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## 🇬🇧 English

Thank you for contributing to HomeOS! The project is designed for rapid onboarding:
the **core** (`src/core/`) remains clean and strictly under **1,500 lines of code**, while adapters and CLI tools remain decoupled.

1. Open an issue before undertaking substantial structural changes.
2. `npm run typecheck` and `npm test` must pass (Node ≥ 22.18).
3. Provide unit tests under `test/` for every fix or new feature.
4. Include the SPDX license identifier header on all new source files (`// SPDX-License-Identifier: AGPL-3.0-only`).
5. Format commit messages according to [Conventional Commits](https://www.conventionalcommits.org/).
6. Sign the [CLA](CLA.md) by commenting on your pull request: `I have read the CLA and I hereby sign it.`

For architecture and data extension details, refer to [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
