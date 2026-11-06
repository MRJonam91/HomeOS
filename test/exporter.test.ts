// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo <fbxmano@gmail.com> (MRJonam91)

import test from "node:test";
import assert from "node:assert/strict";
import { generateRoomDossierMarkdown } from "../src/core/exporter.ts";
import { createSyntheticPilotHome } from "../src/core/fixtures.ts";

test("exporter: generates bilingual markdown room dossier", () => {
  const ledger = createSyntheticPilotHome();
  const kitchen = ledger.rooms[0]!;

  // Italian export
  const mdIt = generateRoomDossierMarkdown(ledger, kitchen.id, {
    lang: "it",
    referenceDate: "2026-11-06",
  });

  assert.ok(mdIt.includes("# Dossier Stanza: Cucina Principale"));
  assert.ok(mdIt.includes("Pompa di Calore ACS Ariston Nuos Plus 250"));
  assert.ok(mdIt.includes("SN-ARISTON-839210"));
  assert.ok(mdIt.includes("## 📦 Inventario Apparecchiature"));
  assert.ok(mdIt.includes("## 🛡️ Garanzie e Assistenza"));
  assert.ok(mdIt.includes("## 🔧 Manutenzioni Programmate e Controlli"));
  assert.ok(mdIt.includes("## ⚖️ Audit di Integrità Dati"));
  assert.ok(mdIt.includes("1. Fatti Osservati e Verificabili"));

  // English export
  const mdEn = generateRoomDossierMarkdown(ledger, kitchen.id, {
    lang: "en",
    referenceDate: "2026-11-06",
  });

  assert.ok(mdEn.includes("# Room Dossier: Cucina Principale"));
  assert.ok(mdEn.includes("## 📦 Item Inventory"));
  assert.ok(mdEn.includes("## 🛡️ Warranties & Support"));
  assert.ok(mdEn.includes("## 🔧 Planned Maintenance & Checks"));
  assert.ok(mdEn.includes("## ⚖️ Data Integrity Audit"));
});
