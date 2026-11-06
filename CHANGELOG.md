# Changelog — HomeOS

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0-alpha] - 2026-11-06

### Added
- **Ledger Schema Validator** (`src/core/validator.ts`): Comprehensive schema validation ensuring date format compliance (`YYYY-MM-DD`), non-negative pricing, referential integrity across rooms and items, duplicate ID rejection, and high-value equipment warnings.
- **Whole-House Master Binder Generator** (`src/core/exporter.ts`): `generateHouseDossierMarkdown` generates a complete estate-level dossier including room summaries, safety equipment register, and centralized action items.
- **CSV Data Adapters** (`src/adapters/csv.ts`): Standalone RFC-compliant CSV exporters for full property inventory and planned maintenance schedules with field escaping.
- **Cryptographic Backup Engine** (`src/adapters/backup.ts`): Generates and verifies SHA-256 tamper-evident snapshots of the local ledger.
- **Operational CLI Subcommands** (`src/cli/index.ts`):
  - `homeos task done`: records completed maintenance, updates history log, and recalculates next due date.
  - `homeos task add`: creates new routine maintenance task with frequency and DIY flag.
  - `homeos doc add`: attaches user manuals, receipts, and compliance certificates.
  - `homeos export`: exports CSV inventory, CSV schedule, or cryptographic backup.
  - `homeos dossier`: whole-house master binder when room ID is omitted.
- **Expanded Test Suite**: 23 automated tests covering schema validation edge cases, CSV escaping, cryptographic snapshots, and live CLI maintenance tracking.

## [1.0.0] - 2026-11-06

### Added
- **Core Data Model**: Property, Room, Item, Warranty, MaintenanceSchedule, MaintenanceLog, DocumentRef, and ConsumptionProfile.
- **Local-first Ledger Engine**: Zero-network JSON database with atomic file persistence and deterministic schema validation.
- **Warranty Guardian**: Lifecycle tracking (`active`, `expiring_soon`, `expired`, `lifetime`), remaining day calculations, policy & support link association.
- **Maintenance Scheduler**: Recurring maintenance tracker with DIY/contractor indicators, overdue detection, configurable horizon forecasts (30/60/90 days), and cost projection.
- **Three-Tier Data Audit**: Strict separation of observed verifiable facts (serials, receipts, logs), estimated metrics (power draw, replacement cost), and required human decisions (warranty claims, urgent safety tasks).
- **Bilingual Dossier Generator**: Export room binder and house dossier in structured Italian and English Markdown tables for property archives, tenants, or insurance claims.
- **Synthetic Kitchen Pilot Fixture**: Built-in verifiable test room ("Cucina Principale") with heat pump water heater, induction hob, dishwasher, smart fridge, and smoke/CO safety monitor.
- **Interactive CLI**: Fast commands for `init`, `room`, `item`, `list`, `search`, `schedule`, `warranties`, `audit`, and `dossier`.
- **Governance & Standards**: Dual-licensing (AGPL-3.0-only + Commercial), CLA, security disclosure policy, funding metadata, and CI core line guard.
