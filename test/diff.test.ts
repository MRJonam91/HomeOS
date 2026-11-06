// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo <fbxmano@gmail.com> (MRJonam91)

import test from "node:test";
import assert from "node:assert/strict";
import { createSyntheticPilotHome } from "../src/core/fixtures.ts";
import { diffLedgers, formatLedgerDiffText } from "../src/adapters/diff.ts";
import { addRoom, addItem, updateItem } from "../src/core/inventory.ts";

test("diff: detects identical ledgers", () => {
  const l1 = createSyntheticPilotHome();
  const l2 = createSyntheticPilotHome();

  const diff = diffLedgers(l1, l2);
  assert.equal(diff.propertyChanged, false);
  assert.equal(diff.roomsAdded.length, 0);
  assert.equal(diff.itemsAdded.length, 0);
  assert.equal(diff.itemsModified.length, 0);

  const text = formatLedgerDiffText(diff);
  assert.ok(text.includes("No structural changes detected"));
});

test("diff: detects room and item additions, removals, and modifications", () => {
  const base = createSyntheticPilotHome();
  const target = createSyntheticPilotHome();

  // Add room
  const newRoom = addRoom(target, { name: "Garage", category: "garage" });
  // Add item
  addItem(target, {
    roomId: newRoom.id,
    name: "Caricatore Wallbox",
    category: "electrical",
  });
  // Modify item
  updateItem(target, "item-nuos-boiler", { purchasePrice: 1750 });

  const diff = diffLedgers(base, target);
  assert.equal(diff.roomsAdded.length, 1);
  assert.equal(diff.roomsAdded[0]?.name, "Garage");
  assert.equal(diff.itemsAdded.length, 1);
  assert.equal(diff.itemsAdded[0]?.name, "Caricatore Wallbox");
  assert.equal(diff.itemsModified.length, 1);
  assert.ok(diff.itemsModified[0]?.changes.some((c) => c.includes("1750")));

  const text = formatLedgerDiffText(diff);
  assert.ok(text.includes("Added Rooms (1): Garage"));
  assert.ok(text.includes("Added Items (1): Caricatore Wallbox"));
  assert.ok(text.includes("Modified Items (1)"));
});
