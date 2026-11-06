// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo <fbxmano@gmail.com> (MRJonam91)

import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  createEmptyLedger,
  addRoom,
  addItem,
  updateItem,
  removeItem,
  removeRoom,
  getRoom,
  getItem,
  searchItems,
  saveLedger,
  loadLedger,
} from "../src/core/inventory.ts";

test("inventory: creates empty ledger with valid metadata", () => {
  const ledger = createEmptyLedger("Villa dei Cedri", "Corso Francia 40, Torino");
  assert.equal(ledger.property.name, "Villa dei Cedri");
  assert.equal(ledger.property.address, "Corso Francia 40, Torino");
  assert.equal(ledger.rooms.length, 0);
  assert.equal(ledger.items.length, 0);
});

test("inventory: manages rooms and items lifecycle", () => {
  const ledger = createEmptyLedger("Test House");
  const room = addRoom(ledger, {
    name: "Cucina",
    floor: "Piano Terra",
    category: "kitchen",
  });

  assert.ok(room.id);
  assert.equal(ledger.rooms.length, 1);
  assert.equal(getRoom(ledger, room.id)?.name, "Cucina");

  const item = addItem(ledger, {
    roomId: room.id,
    name: "Frigorifero Samsung",
    brand: "Samsung",
    model: "RB38",
    serialNumber: "SN-SAM-9921",
    category: "appliance",
    purchasePrice: 799,
  });

  assert.ok(item.id);
  assert.equal(ledger.items.length, 1);
  assert.equal(getItem(ledger, item.id)?.name, "Frigorifero Samsung");

  // Update item
  const updated = updateItem(ledger, item.id, { purchasePrice: 749 });
  assert.equal(updated.purchasePrice, 749);
  assert.equal(getItem(ledger, item.id)?.purchasePrice, 749);

  // Search
  assert.equal(searchItems(ledger, "Samsung").length, 1);
  assert.equal(searchItems(ledger, "RB38").length, 1);
  assert.equal(searchItems(ledger, "SN-SAM").length, 1);
  assert.equal(searchItems(ledger, "Inesistente").length, 0);

  // Remove item
  assert.equal(removeItem(ledger, item.id), true);
  assert.equal(ledger.items.length, 0);

  // Remove room
  assert.equal(removeRoom(ledger, room.id), true);
  assert.equal(ledger.rooms.length, 0);
});

test("inventory: rejects adding item to non-existent room", () => {
  const ledger = createEmptyLedger("Test House");
  assert.throws(() => {
    addItem(ledger, {
      roomId: "non-existent-room-id",
      name: "Lavatrice",
      category: "appliance",
    });
  }, /does not exist/);
});

test("inventory: saves and loads ledger deterministically", () => {
  const tempDir = mkdtempSync(join(tmpdir(), "homeos-test-"));
  const tempFile = join(tempDir, "ledger.json");

  try {
    const ledger = createEmptyLedger("Casa Test", "Via Roma 1");
    const room = addRoom(ledger, { name: "Bagno", category: "bathroom" });
    addItem(ledger, { roomId: room.id, name: "Scaldabagno", category: "plumbing" });

    saveLedger(ledger, tempFile);
    const loaded = loadLedger(tempFile);

    assert.equal(loaded.property.name, "Casa Test");
    assert.equal(loaded.rooms.length, 1);
    assert.equal(loaded.items.length, 1);
    assert.equal(loaded.items[0]?.name, "Scaldabagno");
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});
