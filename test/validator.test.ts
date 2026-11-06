// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo <fbxmano@gmail.com> (MRJonam91)

import test from "node:test";
import assert from "node:assert/strict";
import { validateLedger } from "../src/core/validator.ts";
import { createSyntheticPilotHome } from "../src/core/fixtures.ts";
import { createEmptyLedger } from "../src/core/inventory.ts";

test("validator: accepts valid synthetic pilot ledger", () => {
  const ledger = createSyntheticPilotHome();
  const res = validateLedger(ledger);
  assert.equal(res.valid, true);
  assert.equal(res.errors.length, 0);
});

test("validator: accepts empty valid ledger", () => {
  const ledger = createEmptyLedger("Villa Test");
  const res = validateLedger(ledger);
  assert.equal(res.valid, true);
  assert.equal(res.errors.length, 0);
});

test("validator: detects missing root schema fields", () => {
  assert.equal(validateLedger(null).valid, false);
  assert.equal(validateLedger({}).valid, false);

  const missingRooms = {
    schemaVersion: "1.0.0",
    property: { id: "p1", name: "Prop" },
    items: [],
  };
  const res = validateLedger(missingRooms);
  assert.equal(res.valid, false);
  assert.ok(res.errors.some((e) => e.includes("'rooms' must be an array")));
});

test("validator: detects dangling room references and duplicate IDs", () => {
  const invalid = {
    schemaVersion: "1.0.0",
    property: { id: "p1", name: "Casa" },
    rooms: [
      { id: "room-1", name: "Salotto", category: "living_room" },
      { id: "room-1", name: "Doppione", category: "bedroom" },
    ],
    items: [
      {
        id: "item-1",
        roomId: "room-unknown-999", // Dangling!
        name: "TV OLED",
        category: "electronics",
      },
    ],
  };

  const res = validateLedger(invalid);
  assert.equal(res.valid, false);
  assert.ok(res.errors.some((e) => e.includes("Duplicate room id: 'room-1'")));
  assert.ok(res.errors.some((e) => e.includes("points to non-existent roomId 'room-unknown-999'")));
});

test("validator: detects negative prices and invalid ISO dates", () => {
  const invalid = {
    schemaVersion: "1.0.0",
    property: { id: "p1", name: "Casa" },
    rooms: [{ id: "r1", name: "Stanza", category: "bedroom" }],
    items: [
      {
        id: "i1",
        roomId: "r1",
        name: "Climatizzatore",
        category: "hvac",
        purchasePrice: -500, // Invalid negative price
        purchaseDate: "15-05-2024", // Invalid format (expected YYYY-MM-DD)
        warranty: {
          provider: "Daikin",
          startDate: "not-a-date",
        },
      },
    ],
  };

  const res = validateLedger(invalid);
  assert.equal(res.valid, false);
  assert.ok(res.errors.some((e) => e.includes("purchasePrice")));
  assert.ok(res.errors.some((e) => e.includes("purchaseDate")));
  assert.ok(res.errors.some((e) => e.includes("startDate")));
});

test("validator: emits warnings for high value items without serial numbers", () => {
  const validWithWarning = {
    schemaVersion: "1.0.0",
    property: { id: "p1", name: "Casa" },
    rooms: [{ id: "r1", name: "Stanza", category: "bedroom" }],
    items: [
      {
        id: "i1",
        roomId: "r1",
        name: "Divano Pelle Pregiata",
        category: "furniture",
        purchasePrice: 1200,
        // No serialNumber
      },
      {
        id: "i2",
        roomId: "r1",
        name: "Estintore 6kg",
        category: "safety",
        // No maintenanceTasks on safety device
      },
    ],
  };

  const res = validateLedger(validWithWarning);
  assert.equal(res.valid, true);
  assert.ok(res.warnings.some((w) => w.includes("exceeds €300 value but has no registered serialNumber")));
  assert.ok(res.warnings.some((w) => w.includes("Safety device 'Estintore 6kg' has no registered inspection")));
});
