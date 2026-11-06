// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo <fbxmano@gmail.com> (MRJonam91)

import { createHash } from "node:crypto";
import type { HomeLedger } from "../core/types.ts";

export interface LedgerBackupSnapshot {
  timestamp: string;
  sha256: string;
  payload: HomeLedger;
}

export function computeSha256(content: string): string {
  return createHash("sha256").update(content, "utf-8").digest("hex");
}

export function createLedgerBackup(ledger: HomeLedger): LedgerBackupSnapshot {
  const json = JSON.stringify(ledger, null, 2);
  const sha256 = computeSha256(json);
  return {
    timestamp: new Date().toISOString(),
    sha256,
    payload: ledger,
  };
}

export function verifyLedgerChecksum(rawJson: string, expectedSha256: string): boolean {
  const computed = computeSha256(rawJson);
  return computed.toLowerCase() === expectedSha256.toLowerCase();
}
