// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo <fbxmano@gmail.com> (MRJonam91)

import test from "node:test";
import assert from "node:assert/strict";
import { createSyntheticPilotHome } from "../src/core/fixtures.ts";
import { generateHomeAssistantYaml } from "../src/adapters/homeassistant.ts";

test("homeassistant: generates valid YAML package with template sensors and automations", () => {
  const ledger = createSyntheticPilotHome();
  const yaml = generateHomeAssistantYaml(ledger, { referenceDate: "2026-11-06" });

  assert.ok(yaml.includes("HomeOS - Home Assistant Integration Package"));
  assert.ok(yaml.includes("template:"));
  assert.ok(yaml.includes("name: \"HomeOS Total Items\""));
  assert.ok(yaml.includes("name: \"HomeOS Active Warranties\""));
  assert.ok(yaml.includes("name: \"HomeOS Expiring Warranties\""));
  assert.ok(yaml.includes("name: \"HomeOS Overdue Tasks\""));
  assert.ok(yaml.includes("name: \"HomeOS Scheduled Maintenance Cost\""));
  assert.ok(yaml.includes("name: \"HomeOS Annual Energy Estimate\""));
  assert.ok(yaml.includes("automation:"));
  assert.ok(yaml.includes("alias: \"HomeOS Overdue Maintenance Alert\""));
});
