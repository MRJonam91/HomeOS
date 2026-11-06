// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo <fbxmano@gmail.com> (MRJonam91)

import test from "node:test";
import assert from "node:assert/strict";
import { createSyntheticPilotHome } from "../src/core/fixtures.ts";
import { generateMaintenanceIcs } from "../src/adapters/ical.ts";

test("ical: generates RFC 5545 compliant calendar feed", () => {
  const ledger = createSyntheticPilotHome();
  const ics = generateMaintenanceIcs(ledger.items, ledger.rooms, {
    horizonDays: 180,
    referenceDate: "2026-11-06",
    propertyName: ledger.property.name,
  });

  assert.ok(ics.startsWith("BEGIN:VCALENDAR"));
  assert.ok(ics.includes("VERSION:2.0"));
  assert.ok(ics.includes("PRODID:-//MRJonam91//HomeOS Calendar//EN"));
  assert.ok(ics.includes("BEGIN:VEVENT"));
  assert.ok(ics.includes("SUMMARY:🔧 Pulizia filtro griglia aria"));
  assert.ok(ics.includes("CATEGORIES:HOMEOS,MAINTENANCE"));
  assert.ok(ics.includes("BEGIN:VALARM"));
  assert.ok(ics.includes("TRIGGER:-P7D"));
  assert.ok(ics.endsWith("END:VCALENDAR"));
});

test("ical: escapes special characters and handles empty tasks cleanly", () => {
  const ics = generateMaintenanceIcs([], [], { horizonDays: 30 });
  assert.ok(ics.includes("BEGIN:VCALENDAR"));
  assert.ok(ics.includes("END:VCALENDAR"));
  assert.equal(ics.includes("BEGIN:VEVENT"), false);
});
