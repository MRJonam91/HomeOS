// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo <fbxmano@gmail.com> (MRJonam91)

import { getMaintenanceSchedule } from "../core/maintenance.ts";
import { evaluateWarranty } from "../core/warranty.ts";
import type { HomeLedger, Item, Room } from "../core/types.ts";

function escapeCsvField(field: unknown): string {
  if (field === undefined || field === null) return "";
  const str = String(field);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportInventoryToCsv(ledger: HomeLedger): string {
  const roomsMap = new Map(ledger.rooms.map((r) => [r.id, r]));
  const headers = [
    "Item ID",
    "Item Name",
    "Room ID",
    "Room Name",
    "Brand",
    "Model",
    "Serial Number",
    "Category",
    "Purchase Date",
    "Purchase Price EUR",
    "Replacement Value EUR",
    "Warranty Status",
    "Warranty Expiry Date",
    "Documents Count",
    "Tasks Count",
  ];

  const rows: string[] = [headers.join(",")];

  for (const item of ledger.items) {
    const room = roomsMap.get(item.roomId);
    let warrantyStatus = "none";
    let warrantyEnd = "";

    if (item.warranty) {
      const evalW = evaluateWarranty(item.warranty);
      warrantyStatus = evalW.status;
      warrantyEnd = evalW.endDate;
    }

    const row = [
      escapeCsvField(item.id),
      escapeCsvField(item.name),
      escapeCsvField(item.roomId),
      escapeCsvField(room?.name ?? "Unknown"),
      escapeCsvField(item.brand ?? ""),
      escapeCsvField(item.model ?? ""),
      escapeCsvField(item.serialNumber ?? ""),
      escapeCsvField(item.category),
      escapeCsvField(item.purchaseDate ?? ""),
      escapeCsvField(item.purchasePrice ?? ""),
      escapeCsvField(item.estimatedReplacementValueEur ?? item.purchasePrice ?? ""),
      escapeCsvField(warrantyStatus),
      escapeCsvField(warrantyEnd),
      escapeCsvField(item.documents.length),
      escapeCsvField(item.maintenanceTasks.length),
    ];

    rows.push(row.join(","));
  }

  return rows.join("\n");
}

export function exportMaintenanceScheduleToCsv(
  items: Item[],
  rooms: Room[],
  horizonDays: number = 90,
  referenceDate?: string
): string {
  const schedule = getMaintenanceSchedule(items, rooms, horizonDays, referenceDate);
  const headers = [
    "Item ID",
    "Item Name",
    "Room Name",
    "Task ID",
    "Task Title",
    "Frequency Months",
    "Next Due Date",
    "Days Until Due",
    "Is Overdue",
    "Priority",
    "Estimated Cost EUR",
    "DIY Friendly",
  ];

  const rows: string[] = [headers.join(",")];

  for (const s of schedule) {
    const row = [
      escapeCsvField(s.itemId),
      escapeCsvField(s.itemName),
      escapeCsvField(s.roomName),
      escapeCsvField(s.task.id),
      escapeCsvField(s.task.title),
      escapeCsvField(s.task.frequencyMonths),
      escapeCsvField(s.task.nextDueDate),
      escapeCsvField(s.daysUntilDue),
      escapeCsvField(s.isOverdue ? "YES" : "NO"),
      escapeCsvField(s.task.priority),
      escapeCsvField(s.task.estimatedCostEur),
      escapeCsvField(s.task.diyFriendly ? "YES" : "NO"),
    ];

    rows.push(row.join(","));
  }

  return rows.join("\n");
}
