// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo <fbxmano@gmail.com> (MRJonam91)

import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runCli } from "../src/cli/index.ts";

test("cli: init with sample data and execute core inspection commands", () => {
  const tempDir = mkdtempSync(join(tmpdir(), "homeos-cli-test-"));
  const ledgerFile = join(tempDir, "ledger.json");

  // Capture stdout and stderr
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

    // 8. homeos dossier
    logs.length = 0;
    const dossierOut = join(tempDir, "dossier.md");
    runCli(["dossier", "room-kitchen-pilot", "--out", dossierOut, "--file", ledgerFile]);
    assert.equal(existsSync(dossierOut), true);
    assert.ok(logs.some((l) => l.includes("Dossier exported")));

    assert.equal(errors.length, 0);
  } finally {
    console.log = originalLog;
    console.error = originalError;
    rmSync(tempDir, { recursive: true, force: true });
  }
});
