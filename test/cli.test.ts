// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo <fbxmano@gmail.com> (MRJonam91)

import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runCli } from "../src/cli/index.ts";

test("cli: init with sample data and execute core inspection commands", () => {
  const tempDir = mkdtempSync(join(tmpdir(), "homeos-cli-test-"));
  const ledgerFile = join(tempDir, "ledger.json");

  const originalLog = console.log;
  const originalError = console.error;
  const logs: string[] = [];
  const errors: string[] = [];

  console.log = (...args: unknown[]) => logs.push(args.map(String).join(" "));
  console.error = (...args: unknown[]) => errors.push(args.map(String).join(" "));

  try {
    // 1. homeos init --sample --file <ledgerFile>
    runCli(["init", "--sample", "--file", ledgerFile]);
    assert.equal(existsSync(ledgerFile), true);
    assert.ok(logs.some((l) => l.includes("Initialized HomeOS ledger")));

    // 2. homeos room list
    logs.length = 0;
    runCli(["room", "list", "--file", ledgerFile]);
    assert.ok(logs.some((l) => l.includes("Cucina Principale")));

    // 3. homeos list
    logs.length = 0;
    runCli(["list", "--file", ledgerFile]);
    assert.ok(logs.some((l) => l.includes("Ariston Nuos Plus")));

    // 4. homeos search
    logs.length = 0;
    runCli(["search", "Bosch", "--file", ledgerFile]);
    assert.ok(logs.some((l) => l.includes("Piano Cottura")));
    assert.ok(logs.some((l) => l.includes("Lavastoviglie")));

    // 5. homeos schedule
    logs.length = 0;
    runCli(["schedule", "--days", "90", "--file", ledgerFile]);
    assert.ok(logs.some((l) => l.includes("Maintenance schedule")));

    // 6. homeos warranties
    logs.length = 0;
    runCli(["warranties", "--file", ledgerFile]);
    assert.ok(logs.some((l) => l.includes("Warranty Audit")));

    // 7. homeos audit
    logs.length = 0;
    runCli(["audit", "--file", ledgerFile]);
    assert.ok(logs.some((l) => l.includes("HomeOS Integrity Audit Report")));

    // 8. homeos dossier for a specific room
    logs.length = 0;
    const dossierOut = join(tempDir, "dossier.md");
    runCli(["dossier", "room-kitchen-pilot", "--out", dossierOut, "--file", ledgerFile]);
    assert.equal(existsSync(dossierOut), true);
    assert.ok(logs.some((l) => l.includes("Dossier exported")));

    // 9. homeos dossier for the whole house (omitting roomId)
    logs.length = 0;
    const houseOut = join(tempDir, "house-dossier.md");
    runCli(["dossier", "--out", houseOut, "--file", ledgerFile]);
    assert.equal(existsSync(houseOut), true);
    const houseContent = readFileSync(houseOut, "utf-8");
    assert.ok(houseContent.includes("Fascicolo Digitale Immobile"));

    assert.equal(errors.length, 0);
  } finally {
    console.log = originalLog;
    console.error = originalError;
    rmSync(tempDir, { recursive: true, force: true });
  }
});

test("cli: task completion, task adding, document attachment, and export commands", () => {
  const tempDir = mkdtempSync(join(tmpdir(), "homeos-cli-ops-"));
  const ledgerFile = join(tempDir, "ledger.json");

  const originalLog = console.log;
  const originalError = console.error;
  const logs: string[] = [];
  const errors: string[] = [];

  console.log = (...args: unknown[]) => logs.push(args.map(String).join(" "));
  console.error = (...args: unknown[]) => errors.push(args.map(String).join(" "));

  try {
    runCli(["init", "--sample", "--file", ledgerFile]);

    // 1. Add a routine task to an item
    logs.length = 0;
    runCli([
      "task",
      "add",
      "item-lg-fridge",
      "Sostituzione filtro acqua",
      "--freq",
      "6",
      "--due",
      "2026-12-01",
      "--cost",
      "35",
      "--file",
      ledgerFile,
    ]);
    assert.ok(logs.some((l) => l.includes("Task 'Sostituzione filtro acqua' added")));

    // 2. Complete a maintenance task
    logs.length = 0;
    runCli([
      "task",
      "done",
      "item-nuos-boiler",
      "task-nuos-filter",
      "--cost",
      "0",
      "--by",
      "Proprietario",
      "--date",
      "2026-11-06",
      "--file",
      ledgerFile,
    ]);
    assert.ok(logs.some((l) => l.includes("marked completed on 2026-11-06")));
    assert.ok(logs.some((l) => l.includes("Next due date recalculated")));

    // 3. Attach a document
    logs.length = 0;
    runCli([
      "doc",
      "add",
      "item-lg-fridge",
      "Fattura acquisto Unieuro",
      "invoice",
      "docs/fatture/unieuro-frigo.pdf",
      "--file",
      ledgerFile,
    ]);
    assert.ok(logs.some((l) => l.includes("linked to item 'item-lg-fridge'")));

    // 4. Export CSV inventory
    logs.length = 0;
    const csvInv = join(tempDir, "inv.csv");
    runCli(["export", "--csv-inventory", csvInv, "--file", ledgerFile]);
    assert.equal(existsSync(csvInv), true);
    assert.ok(logs.some((l) => l.includes("Inventory CSV exported")));

    // 5. Export CSV schedule
    logs.length = 0;
    const csvSched = join(tempDir, "sched.csv");
    runCli(["export", "--csv-schedule", csvSched, "--file", ledgerFile]);
    assert.equal(existsSync(csvSched), true);
    assert.ok(logs.some((l) => l.includes("Maintenance schedule CSV exported")));

    // 6. Export cryptographic backup
    logs.length = 0;
    const backupFile = join(tempDir, "backup.json");
    runCli(["export", "--backup", backupFile, "--file", ledgerFile]);
    assert.equal(existsSync(backupFile), true);
    assert.ok(logs.some((l) => l.includes("Cryptographic backup saved")));

    // 7. Export iCalendar feed
    logs.length = 0;
    const icalFile = join(tempDir, "calendar.ics");
    runCli(["export", "--ical", icalFile, "--file", ledgerFile]);
    assert.equal(existsSync(icalFile), true);
    assert.ok(logs.some((l) => l.includes("iCalendar maintenance feed exported")));

    // 8. Export Home Assistant package YAML
    logs.length = 0;
    const haFile = join(tempDir, "homeos_ha.yaml");
    runCli(["export", "--homeassistant", haFile, "--file", ledgerFile]);
    assert.equal(existsSync(haFile), true);
    assert.ok(logs.some((l) => l.includes("Home Assistant package YAML exported")));

    // 9. Export Standalone HTML Dashboard
    logs.length = 0;
    const htmlFile = join(tempDir, "dashboard.html");
    runCli(["export", "--html", htmlFile, "--file", ledgerFile]);
    assert.equal(existsSync(htmlFile), true);
    assert.ok(logs.some((l) => l.includes("Standalone HTML Dashboard exported")));

    // 10. Ledger Diff command
    logs.length = 0;
    runCli(["diff", ledgerFile, backupFile]);
    assert.ok(logs.some((l) => l.includes("HomeOS Ledger Comparison")));

    assert.equal(errors.length, 0);
  } finally {
    console.log = originalLog;
    console.error = originalError;
    rmSync(tempDir, { recursive: true, force: true });
  }
});
