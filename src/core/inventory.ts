// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo <fbxmano@gmail.com> (MRJonam91)

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { HOMEOS_SCHEMA_VERSION, HOMEOS_NAMESPACE } from "./constants.ts";
import type { HomeLedger, Item, Property, Room } from "./types.ts";

export function createEmptyLedger(propertyName: string = "Mia Casa", address?: string): HomeLedger {
  const propertyId = `prop-${Date.now()}`;
  const now = new Date().toISOString().split("T")[0] ?? "2026-01-01";
  return {
    schemaVersion: HOMEOS_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    property: {
      id: propertyId,
      name: propertyName,
      address,
      notes: `HomeOS Ledger initialized under namespace ${HOMEOS_NAMESPACE}`,
      createdAt: now,
    },
    rooms: [],
    items: [],
  };
}

export function loadLedger(filePath: string): HomeLedger {
  if (!existsSync(filePath)) {
    throw new Error(`Ledger file not found at ${filePath}. Run 'homeos init' first.`);
  }
  const raw = readFileSync(filePath, "utf-8");
  const parsed = JSON.parse(raw) as HomeLedger;
  if (!parsed.schemaVersion || !parsed.property || !Array.isArray(parsed.rooms) || !Array.isArray(parsed.items)) {
    throw new Error(`Invalid HomeOS ledger format in ${filePath}`);
  }
  return parsed;
}

export function saveLedger(ledger: HomeLedger, filePath: string): void {
  const dir = dirname(filePath);
  if (dir && !existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  ledger.generatedAt = new Date().toISOString();
  writeFileSync(filePath, JSON.stringify(ledger, null, 2), "utf-8");
}

export function addRoom(
  ledger: HomeLedger,
  room: Omit<Room, "id" | "propertyId"> & { id?: string; propertyId?: string }
): Room {
  const id = room.id ?? `room-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const newRoom: Room = {
    id,
    propertyId: room.propertyId ?? ledger.property.id,
    name: room.name,
    floor: room.floor,
    category: room.category,
    notes: room.notes,
  };
  ledger.rooms.push(newRoom);
  return newRoom;
}

export function addItem(
  ledger: HomeLedger,
  item: Omit<Item, "id" | "documents" | "maintenanceTasks" | "maintenanceLogs"> & {
    id?: string;
    documents?: Item["documents"];
    maintenanceTasks?: Item["maintenanceTasks"];
    maintenanceLogs?: Item["maintenanceLogs"];
  }
): Item {
  const roomExists = ledger.rooms.some((r) => r.id === item.roomId);
  if (!roomExists) {
    throw new Error(`Cannot add item: Room '${item.roomId}' does not exist.`);
  }
  const id = item.id ?? `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const newItem: Item = {
    ...item,
    id,
    documents: item.documents ?? [],
    maintenanceTasks: item.maintenanceTasks ?? [],
    maintenanceLogs: item.maintenanceLogs ?? [],
  };
  ledger.items.push(newItem);
  return newItem;
}

export function getRoom(ledger: HomeLedger, roomId: string): Room | undefined {
  return ledger.rooms.find((r) => r.id === roomId);
}

export function getItem(ledger: HomeLedger, itemId: string): Item | undefined {
  return ledger.items.find((i) => i.id === itemId);
}

export function updateItem(ledger: HomeLedger, itemId: string, patch: Partial<Item>): Item {
  const idx = ledger.items.findIndex((i) => i.id === itemId);
  if (idx === -1) {
    throw new Error(`Item '${itemId}' not found in ledger.`);
  }
  const current = ledger.items[idx]!;
  const updated: Item = { ...current, ...patch };
  ledger.items[idx] = updated;
  return updated;
}

export function removeItem(ledger: HomeLedger, itemId: string): boolean {
  const initialLen = ledger.items.length;
  ledger.items = ledger.items.filter((i) => i.id !== itemId);
  return ledger.items.length < initialLen;
}

export function removeRoom(ledger: HomeLedger, roomId: string): boolean {
  const initialLen = ledger.rooms.length;
  ledger.rooms = ledger.rooms.filter((r) => r.id !== roomId);
  ledger.items = ledger.items.filter((i) => i.roomId !== roomId);
  return ledger.rooms.length < initialLen;
}

export function searchItems(ledger: HomeLedger, query: string): Item[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...ledger.items];

  return ledger.items.filter((item) => {
    if (item.name.toLowerCase().includes(q)) return true;
    if (item.brand && item.brand.toLowerCase().includes(q)) return true;
    if (item.model && item.model.toLowerCase().includes(q)) return true;
    if (item.serialNumber && item.serialNumber.toLowerCase().includes(q)) return true;
    if (item.notes && item.notes.toLowerCase().includes(q)) return true;
    if (item.tags && item.tags.some((t) => t.toLowerCase().includes(q))) return true;
    if (item.documents.some((d) => d.title.toLowerCase().includes(q) || d.type.toLowerCase().includes(q))) return true;
    if (item.warranty && item.warranty.provider.toLowerCase().includes(q)) return true;
    return false;
  });
}
