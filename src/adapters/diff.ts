// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo <fbxmano@gmail.com> (MRJonam91)

import type { HomeLedger, Item, Room } from "../core/types.ts";

export interface LedgerDiff {
  propertyChanged: boolean;
  roomsAdded: Room[];
  roomsRemoved: Room[];
  itemsAdded: Item[];
  itemsRemoved: Item[];
  itemsModified: Array<{
    id: string;
    name: string;
    changes: string[];
  }>;
  newMaintenanceLogsCount: number;
}

export function diffLedgers(base: HomeLedger, target: HomeLedger): LedgerDiff {
  const propertyChanged =
    base.property.name !== target.property.name ||
    base.property.address !== target.property.address ||
    base.property.cadastralData !== target.property.cadastralData;

  const baseRoomIds = new Set(base.rooms.map((r) => r.id));
  const targetRoomIds = new Set(target.rooms.map((r) => r.id));

  const roomsAdded = target.rooms.filter((r) => !baseRoomIds.has(r.id));
  const roomsRemoved = base.rooms.filter((r) => !targetRoomIds.has(r.id));

  const baseItemsMap = new Map(base.items.map((i) => [i.id, i]));
  const targetItemsMap = new Map(target.items.map((i) => [i.id, i]));

  const itemsAdded = target.items.filter((i) => !baseItemsMap.has(i.id));
  const itemsRemoved = base.items.filter((i) => !targetItemsMap.has(i.id));

  const itemsModified: LedgerDiff["itemsModified"] = [];
  let newLogs = 0;

  for (const [id, targetItem] of targetItemsMap) {
    const baseItem = baseItemsMap.get(id);
    if (!baseItem) continue;

    const changes: string[] = [];
    if (baseItem.name !== targetItem.name) changes.push(`Name: '${baseItem.name}' -> '${targetItem.name}'`);
    if (baseItem.roomId !== targetItem.roomId) changes.push(`Room: '${baseItem.roomId}' -> '${targetItem.roomId}'`);
    if (baseItem.serialNumber !== targetItem.serialNumber) {
      changes.push(`Serial: '${baseItem.serialNumber ?? "N/D"}' -> '${targetItem.serialNumber ?? "N/D"}'`);
    }
    if (baseItem.purchasePrice !== targetItem.purchasePrice) {
      changes.push(`Price: €${baseItem.purchasePrice ?? 0} -> €${targetItem.purchasePrice ?? 0}`);
    }

    if (targetItem.maintenanceLogs.length > baseItem.maintenanceLogs.length) {
      const addedLogs = targetItem.maintenanceLogs.length - baseItem.maintenanceLogs.length;
      changes.push(`${addedLogs} new maintenance log(s) recorded`);
      newLogs += addedLogs;
    }

    if (changes.length > 0) {
      itemsModified.push({ id, name: targetItem.name, changes });
    }
  }

  return {
    propertyChanged,
    roomsAdded,
    roomsRemoved,
    itemsAdded,
    itemsRemoved,
    itemsModified,
    newMaintenanceLogsCount: newLogs,
  };
}

export function formatLedgerDiffText(diff: LedgerDiff): string {
  const lines: string[] = ["=== HomeOS Ledger Comparison ==="];
  if (diff.propertyChanged) lines.push("- Property metadata has changed");

  if (diff.roomsAdded.length > 0) {
    lines.push(`+ Added Rooms (${diff.roomsAdded.length}): ${diff.roomsAdded.map((r) => r.name).join(", ")}`);
  }
  if (diff.roomsRemoved.length > 0) {
    lines.push(`- Removed Rooms (${diff.roomsRemoved.length}): ${diff.roomsRemoved.map((r) => r.name).join(", ")}`);
  }
  if (diff.itemsAdded.length > 0) {
    lines.push(`+ Added Items (${diff.itemsAdded.length}): ${diff.itemsAdded.map((i) => i.name).join(", ")}`);
  }
  if (diff.itemsRemoved.length > 0) {
    lines.push(`- Removed Items (${diff.itemsRemoved.length}): ${diff.itemsRemoved.map((i) => i.name).join(", ")}`);
  }
  if (diff.itemsModified.length > 0) {
    lines.push(`* Modified Items (${diff.itemsModified.length}):`);
    for (const m of diff.itemsModified) {
      lines.push(`  - ${m.name} [${m.id}]: ${m.changes.join("; ")}`);
    }
  }
  if (diff.newMaintenanceLogsCount > 0) {
    lines.push(`✓ ${diff.newMaintenanceLogsCount} new maintenance interventions logged`);
  }

  if (
    !diff.propertyChanged &&
    diff.roomsAdded.length === 0 &&
    diff.roomsRemoved.length === 0 &&
    diff.itemsAdded.length === 0 &&
    diff.itemsRemoved.length === 0 &&
    diff.itemsModified.length === 0
  ) {
    lines.push("No structural changes detected between the two ledgers.");
  }

  return lines.join("\n");
}
