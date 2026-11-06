// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo <fbxmano@gmail.com> (MRJonam91)

import test from "node:test";
import assert from "node:assert/strict";
import { analyzeHomeIntegrity } from "../src/core/audit.ts";
import { createSyntheticPilotHome } from "../src/core/fixtures.ts";

test("audit: separates observed facts, estimates, and human decisions", () => {
  const ledger = createSyntheticPilotHome();
  const refDate = "2026-11-06";
  const report = analyzeHomeIntegrity(ledger, refDate);

  assert.equal(report.totalRooms, 1);
  assert.equal(report.totalItems, 5);
  assert.ok(report.totalEstimatedReplacementValueEur > 3000);

  // 1. Observed facts must contain serial numbers and documents
  const serialFacts = report.observedFacts.filter((f) => f.category === "serial_number");
  assert.equal(serialFacts.length, 5); // all 5 pilot appliances have real serials

  const manualFacts = report.observedFacts.filter((f) => f.category === "manual");
  assert.ok(manualFacts.length >= 4);

  // 2. Estimated indicators must contain power consumption
  const powerEstimates = report.estimatedIndicators.filter((e) => e.category === "power_consumption");
  assert.ok(powerEstimates.length >= 2);

  // 3. Human decisions required
  assert.ok(report.humanDecisionsRequired.length > 0);
  // Bosch induction was bought 2024-06-20 with 24m warranty -> expired in June 2026
  // Boiler anode maintenance nextDueDate was 2026-05-15 -> overdue on 2026-11-06
  const overdueDecisions = report.humanDecisionsRequired.filter(
    (d) => d.category === "overdue_maintenance" || d.category === "safety_inspection"
  );
  assert.ok(overdueDecisions.length >= 1);
});
