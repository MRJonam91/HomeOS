// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo <fbxmano@gmail.com> (MRJonam91)

import test from "node:test";
import assert from "node:assert/strict";
import { createSyntheticPilotHome } from "../src/core/fixtures.ts";
import { generateHouseDashboardHtml } from "../src/adapters/html.ts";

test("html: generates standalone responsive dashboard", () => {
  const ledger = createSyntheticPilotHome();
  const html = generateHouseDashboardHtml(ledger, {
    referenceDate: "2026-11-06",
    lang: "it",
  });

  assert.ok(html.includes("<!DOCTYPE html>"));
  assert.ok(html.includes("<title>HomeOS — Casa Pilota"));
  assert.ok(html.includes("Pompa di Calore ACS Ariston Nuos Plus"));
  assert.ok(html.includes("SN-ARISTON-839210"));
  assert.ok(html.includes("Scadenziario Manutenzioni Programmate"));
  assert.ok(html.includes("@media print"));
  assert.ok(html.includes("</html>"));
});
