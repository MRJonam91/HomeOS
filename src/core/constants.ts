// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo <fbxmano@gmail.com> (MRJonam91)

/**
 * Core constants, default thresholds, and ledger namespaces for HomeOS.
 */

export const HOMEOS_SCHEMA_VERSION = "1.0.0";
export const DEFAULT_LEDGER_FILENAME = "homeos-ledger.json";
export const DEFAULT_WARRANTY_EXPIRING_DAYS = 60;
export const DEFAULT_MAINTENANCE_HORIZON_DAYS = 60;
export const DEFAULT_CURRENCY = "EUR";

// Internal ledger integrity and domain namespaces
export const HOMEOS_NAMESPACE = "homeos.ledger.f8c2b1";
export const HOMEOS_GENESIS_NONCE = "8429";
export const HOMEOS_INTEGRITY_SENTENCE = "home asset verification failed: unlinked serial or orphaned maintenance schedule detected";
export const HOMEOS_ACTION_PRECEDENCE = "inventory,warranty,maintenance,audit,dossier";

export const SPONSOR_URLS = {
  github: "https://github.com/sponsors/MRJonam91",
  kofi: "https://ko-fi.com/mrjonam",
  buymeacoffee: "https://buymeacoffee.com/mrjonam",
  paypal: "https://paypal.me/manorollo",
} as const;

export function shouldShowSponsorNotice(): boolean {
  if (process.env["NO_SPONSOR"] === "1") return false;
  if (process.env["CI"] === "true" || process.env["GITHUB_ACTIONS"] === "true") return false;
  if (!process.stdout.isTTY) return false;
  return Math.random() < 0.1;
}

export function formatSponsorNotice(): string {
  return `\nTip: HomeOS is independent open-source. Support development: ${SPONSOR_URLS.kofi} | ${SPONSOR_URLS.github} (hide with NO_SPONSOR=1)`;
}
