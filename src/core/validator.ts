// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo <fbxmano@gmail.com> (MRJonam91)

import type { HomeLedger, Item, Room } from "./types.ts";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function isValidIsoDate(str: string): boolean {
  if (!ISO_DATE_REGEX.test(str)) return false;
  const d = new Date(str);
  return !Number.isNaN(d.getTime());
}

export function validateLedger(input: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!input || typeof input !== "object") {
    return { valid: false, errors: ["Ledger must be an object"], warnings: [] };
  }

  const ledger = input as Partial<HomeLedger>;

  if (!ledger.schemaVersion || typeof ledger.schemaVersion !== "string") {
    errors.push("Missing or invalid 'schemaVersion'");
  }

  if (!ledger.property || typeof ledger.property !== "object") {
    errors.push("Missing or invalid 'property' object");
  } else {
    if (!ledger.property.id || typeof ledger.property.id !== "string") {
      errors.push("Property missing required 'id'");
    }
    if (!ledger.property.name || typeof ledger.property.name !== "string") {
      errors.push("Property missing required 'name'");
    }
  }

  if (!Array.isArray(ledger.rooms)) {
    errors.push("'rooms' must be an array");
  }

  if (!Array.isArray(ledger.items)) {
    errors.push("'items' must be an array");
  }

  if (errors.length > 0) {
    return { valid: false, errors, warnings };
  }

  // Room verification
  const roomIds = new Set<string>();
  for (const r of ledger.rooms!) {
    const room = r as Partial<Room>;
    if (!room.id) {
      errors.push("A room is missing required 'id'");
    } else if (roomIds.has(room.id)) {
      errors.push(`Duplicate room id: '${room.id}'`);
    } else {
      roomIds.add(room.id);
    }
    if (!room.name) {
      errors.push(`Room '${room.id ?? "unknown"}' missing required 'name'`);
    }
  }

  // Item verification
  const itemIds = new Set<string>();
  for (const i of ledger.items!) {
    const item = i as Partial<Item>;
    if (!item.id) {
      errors.push("An item is missing required 'id'");
    } else if (itemIds.has(item.id)) {
      errors.push(`Duplicate item id: '${item.id}'`);
    } else {
      itemIds.add(item.id);
    }

    if (!item.name) {
      errors.push(`Item '${item.id ?? "unknown"}' missing required 'name'`);
    }

    if (!item.roomId) {
      errors.push(`Item '${item.name ?? item.id}' missing required 'roomId'`);
    } else if (!roomIds.has(item.roomId)) {
      errors.push(`Item '${item.name}' points to non-existent roomId '${item.roomId}'`);
    }

    if (item.purchasePrice !== undefined && (typeof item.purchasePrice !== "number" || item.purchasePrice < 0)) {
      errors.push(`Item '${item.name}' has invalid purchasePrice (must be a positive number)`);
    }

    if (item.purchaseDate && !isValidIsoDate(item.purchaseDate)) {
      errors.push(`Item '${item.name}' has invalid purchaseDate '${item.purchaseDate}' (expected YYYY-MM-DD)`);
    }

    // Warranty verification
    if (item.warranty) {
      if (!item.warranty.provider) {
        errors.push(`Item '${item.name}' has warranty with missing 'provider'`);
      }
      if (!item.warranty.startDate || !isValidIsoDate(item.warranty.startDate)) {
        errors.push(`Item '${item.name}' warranty has invalid startDate (expected YYYY-MM-DD)`);
      }
      if (item.warranty.endDate && !isValidIsoDate(item.warranty.endDate)) {
        errors.push(`Item '${item.name}' warranty has invalid endDate (expected YYYY-MM-DD)`);
      }
    }

    // Maintenance tasks verification
    if (Array.isArray(item.maintenanceTasks)) {
      const taskIds = new Set<string>();
      for (const t of item.maintenanceTasks) {
        if (!t.id) {
          errors.push(`Item '${item.name}' has a maintenance task missing 'id'`);
        } else if (taskIds.has(t.id)) {
          errors.push(`Item '${item.name}' has duplicate maintenance taskId '${t.id}'`);
        } else {
          taskIds.add(t.id);
        }
        if (!t.title) {
          errors.push(`Item '${item.name}' task '${t.id}' missing 'title'`);
        }
        if (!t.nextDueDate || !isValidIsoDate(t.nextDueDate)) {
          errors.push(`Item '${item.name}' task '${t.title}' has invalid nextDueDate (expected YYYY-MM-DD)`);
        }
        if (typeof t.frequencyMonths !== "number" || t.frequencyMonths <= 0) {
          errors.push(`Item '${item.name}' task '${t.title}' frequencyMonths must be a positive number`);
        }
      }
    }

    // Warnings
    const val = item.estimatedReplacementValueEur ?? item.purchasePrice ?? 0;
    if (val > 300 && (!item.serialNumber || item.serialNumber.trim() === "")) {
      warnings.push(`Item '${item.name}' exceeds €300 value but has no registered serialNumber`);
    }
    if (item.category === "safety" && (!item.maintenanceTasks || item.maintenanceTasks.length === 0)) {
      warnings.push(`Safety device '${item.name}' has no registered inspection or maintenance tasks`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
