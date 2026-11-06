// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo <fbxmano@gmail.com> (MRJonam91)

import test from "node:test";
import assert from "node:assert/strict";
import {
  evaluateWarranty,
  addMonthsToIsoDate,
  computeDaysDifference,
  auditWarranties,
} from "../src/core/warranty.ts";
import type { Item, Room, Warranty } from "../src/core/types.ts";

test("warranty: date utilities compute offsets correctly", () => {
  assert.equal(addMonthsToIsoDate("2024-01-15", 12), "2025-01-15");
  assert.equal(addMonthsToIsoDate("2024-01-15", 24), "2026-01-15");
  assert.equal(computeDaysDifference("2026-01-01", "2026-01-11"), 10);
  assert.equal(computeDaysDifference("2026-01-11", "2026-01-01"), -10);
});

test("warranty: evaluates active, expiring_soon, expired, and lifetime", () => {
  const refDate = "2026-11-01";

  // Active (more than 60 days)
  const activeW: Warranty = {
    provider: "Produttore A",
    coverageMonths: 24,
    startDate: "2025-06-01", // Ends 2027-06-01
  };
  const resActive = evaluateWarranty(activeW, refDate);
  assert.equal(resActive.status, "active");
  assert.ok(resActive.daysRemaining > 60);

  // Expiring soon (less than 60 days)
  const expiringW: Warranty = {
    provider: "Produttore B",
    coverageMonths: 24,
    startDate: "2024-11-20", // Ends 2026-11-20 -> 19 days remaining
  };
  const resExpiring = evaluateWarranty(expiringW, refDate);
  assert.equal(resExpiring.status, "expiring_soon");
  assert.ok(resExpiring.daysRemaining > 0 && resExpiring.daysRemaining <= 60);

  // Expired
  const expiredW: Warranty = {
    provider: "Produttore C",
    coverageMonths: 12,
    startDate: "2024-01-01", // Ends 2025-01-01 -> expired
  };
  const resExpired = evaluateWarranty(expiredW, refDate);
  assert.equal(resExpired.status, "expired");
  assert.ok(resExpired.daysRemaining < 0);

  // Lifetime
  const lifetimeW: Warranty = {
    provider: "Produttore D",
    coverageMonths: 999,
    startDate: "2020-01-01",
  };
  const resLifetime = evaluateWarranty(lifetimeW, refDate);
  assert.equal(resLifetime.status, "lifetime");
});

test("warranty: audits and sorts warranties across multiple items", () => {
  const refDate = "2026-11-01";
  const rooms: Room[] = [
    { id: "r1", propertyId: "p1", name: "Cucina", category: "kitchen" },
  ];

  const items: Item[] = [
    {
      id: "i1",
      roomId: "r1",
      name: "Lavastoviglie",
      category: "appliance",
      documents: [],
      maintenanceTasks: [],
      maintenanceLogs: [],
      warranty: {
        provider: "Brand Expired",
        coverageMonths: 12,
        startDate: "2023-01-01",
      },
    },
    {
      id: "i2",
      roomId: "r1",
      name: "Forno",
      category: "appliance",
      documents: [],
      maintenanceTasks: [],
      maintenanceLogs: [],
      warranty: {
        provider: "Brand Expiring",
        coverageMonths: 24,
        startDate: "2024-11-15", // Ends 2026-11-15 -> 14 days
      },
    },
  ];

  const audit = auditWarranties(items, rooms, refDate);
  assert.equal(audit.length, 2);
  // Expired is most negative daysRemaining, so it comes first in sorted order
  assert.equal(audit[0]?.itemName, "Lavastoviglie");
  assert.equal(audit[0]?.status, "expired");
  assert.equal(audit[1]?.itemName, "Forno");
  assert.equal(audit[1]?.status, "expiring_soon");
});
