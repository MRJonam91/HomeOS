// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo <fbxmano@gmail.com> (MRJonam91)

import { DEFAULT_WARRANTY_EXPIRING_DAYS } from "./constants.ts";
import type { Item, Room, Warranty, WarrantyEvaluation, WarrantyStatus } from "./types.ts";

export function addMonthsToIsoDate(isoDate: string, months: number): string {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return isoDate;
  const currentMonth = d.getUTCMonth();
  d.setUTCMonth(currentMonth + months);
  return d.toISOString().split("T")[0] ?? isoDate;
}

export function computeDaysDifference(fromIsoDate: string, toIsoDate: string): number {
  const t1 = new Date(fromIsoDate).getTime();
  const t2 = new Date(toIsoDate).getTime();
  if (Number.isNaN(t1) || Number.isNaN(t2)) return 0;
  return Math.round((t2 - t1) / (1000 * 60 * 60 * 24));
}

export function computeWarrantyEndDate(warranty: Warranty): string {
  if (warranty.endDate && warranty.endDate.trim() !== "") {
    return warranty.endDate;
  }
  return addMonthsToIsoDate(warranty.startDate, warranty.coverageMonths);
}

export function evaluateWarranty(
  warranty: Warranty,
  referenceDate: string = new Date().toISOString().split("T")[0] ?? ""
): { status: WarrantyStatus; endDate: string; daysRemaining: number } {
  if (warranty.coverageMonths <= 0) {
    return { status: "none", endDate: warranty.startDate, daysRemaining: 0 };
  }
  if (warranty.coverageMonths >= 999) {
    return { status: "lifetime", endDate: "9999-12-31", daysRemaining: 99999 };
  }

  const endDate = computeWarrantyEndDate(warranty);
  const daysRemaining = computeDaysDifference(referenceDate, endDate);

  let status: WarrantyStatus = "active";
  if (daysRemaining < 0) {
    status = "expired";
  } else if (daysRemaining <= DEFAULT_WARRANTY_EXPIRING_DAYS) {
    status = "expiring_soon";
  }

  return { status, endDate, daysRemaining };
}

export function evaluateItemWarranty(
  item: Item,
  roomsMap: Map<string, Room>,
  referenceDate: string = new Date().toISOString().split("T")[0] ?? ""
): WarrantyEvaluation | null {
  if (!item.warranty) return null;
  const room = roomsMap.get(item.roomId);
  const roomName = room ? room.name : "Unknown Room";
  const { status, endDate, daysRemaining } = evaluateWarranty(item.warranty, referenceDate);

  return {
    itemId: item.id,
    itemName: item.name,
    roomName,
    provider: item.warranty.provider,
    status,
    startDate: item.warranty.startDate,
    endDate,
    daysRemaining,
    supportContact: item.warranty.supportContact,
  };
}

export function auditWarranties(
  items: Item[],
  rooms: Room[],
  referenceDate: string = new Date().toISOString().split("T")[0] ?? ""
): WarrantyEvaluation[] {
  const roomsMap = new Map(rooms.map((r) => [r.id, r]));
  const evaluations: WarrantyEvaluation[] = [];

  for (const item of items) {
    const evaluation = evaluateItemWarranty(item, roomsMap, referenceDate);
    if (evaluation) {
      evaluations.push(evaluation);
    }
  }

  // Sort: active/expiring first by remaining days ascending, expired last
  return evaluations.sort((a, b) => a.daysRemaining - b.daysRemaining);
}
