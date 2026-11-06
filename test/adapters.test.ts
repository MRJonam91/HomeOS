// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo <fbxmano@gmail.com> (MRJonam91)

import test from "node:test";
import assert from "node:assert/strict";
import { createSyntheticPilotHome } from "../src/core/fixtures.ts";
import { exportInventoryToCsv, exportMaintenanceScheduleToCsv } from "../src/adapters/csv.ts";
import { createLedgerBackup, verifyLedgerChecksum } from "../src/adapters/backup.ts";

test("adapters/csv: exports inventory to valid CSV format with escaping", () => {
  const ledger = createSyntheticPilotHome();
  const csv = exportInventoryToCsv(ledger);

  const lines = csv.split("\n");
  assert.ok(lines.length > 5);
  assert.ok(lines[0]?.includes("Item ID,Item Name,Room ID,Room Name"));
  assert.ok(csv.includes("Pompa di Calore ACS Ariston Nuos Plus 250"));
  assert.ok(csv.includes("SN-ARISTON-839210"));
  assert.ok(csv.includes("Cucina Principale"));
});

test("adapters/csv: exports maintenance schedule to valid CSV format", () => {
  const ledger = createSyntheticPilotHome();
  const csv = exportMaintenanceScheduleToCsv(ledger.items, ledger.rooms, 90, "2026-11-06");

  const lines = csv.split("\n");
  assert.ok(lines.length >= 2);
  assert.ok(lines[0]?.includes("Item ID,Item Name,Room Name,Task ID"));
  assert.ok(csv.includes("Pulizia filtro griglia aria e ispezione scarico condensa"));
});

test("adapters/backup: generates and verifies cryptographic SHA-256 backup", () => {
  const ledger = createSyntheticPilotHome();
  const backup = createLedgerBackup(ledger);

  assert.ok(backup.sha256);
  assert.equal(backup.sha256.length, 64);
  assert.equal(backup.payload.property.name, ledger.property.name);

  const rawJson = JSON.stringify(ledger, null, 2);
  assert.equal(verifyLedgerChecksum(rawJson, backup.sha256), true);
  assert.equal(verifyLedgerChecksum(rawJson + "tampered", backup.sha256), false);
});
