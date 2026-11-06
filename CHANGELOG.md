# Changelog — HomeOS

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-11-06

### Added
- **Core Architecture & Data Model**: Hierarchical property, room, item, warranty, maintenance schedule, maintenance log, and consumption profile (`src/core/types.ts`).
- **Local-First Ledger Engine**: Deterministic local JSON storage with atomic file persistence (`src/core/inventory.ts`).
- **Schema Validation & Integrity Guard**: Deep validation with ISO date checks, non-negative monetary constraints, reference integrity, and equipment alerts (`src/core/validator.ts`).
- **Warranty Guardian**: Lifecycle state engine (`active`, `expiring_soon`, `expired`, `lifetime`), remaining day computations, policy references, and customer care hotlines (`src/core/warranty.ts`).
- **Preventative Maintenance Scheduler**: Recurring maintenance tracker with DIY/pro categorization, step-by-step checklists, overdue tracking, horizon filtering, and cost projections (`src/core/maintenance.ts`).
- **Three-Tier Data Audit Engine**: Tripartite separation of observed facts, estimated indicators (power/replacement value), and pending human decisions (`src/core/audit.ts`).
- **Bilingual Markdown Binder Exporters**: Instant generation of structured room dossiers and whole-estate binders in Italian and English (`src/core/exporter.ts`).
- **Ecosystem Adapters**:
  - **iCalendar (.ics)**: RFC 5545 calendar feed with 7-day advance reminder alarms (`src/adapters/ical.ts`).
  - **Home Assistant**: Turnkey YAML package with template sensors and automated notification alerts (`src/adapters/homeassistant.ts`).
  - **Interactive HTML Dashboard**: Standalone zero-CDN responsive dashboard and printable PDF report (`src/adapters/html.ts`).
  - **Spreadsheet CSV**: RFC-compliant CSV exporters for asset inventories and maintenance schedules (`src/adapters/csv.ts`).
  - **Cryptographic Backups & Diff**: SHA-256 tamper-evident snapshots and visual ledger diff engine (`src/adapters/backup.ts`, `src/adapters/diff.ts`).
- **Official JSON Schema**: Canonical Draft 2020-12 schema definition (`schema/homeos-ledger.schema.json`).
- **Interactive CLI**: Fast terminal commands for `init`, `room`, `item`, `task`, `doc`, `list`, `search`, `schedule`, `warranties`, `audit`, `dossier`, `export`, and `diff` (`src/cli/index.ts`).
- **Synthetic Kitchen Pilot Fixture**: Ready-to-test master kitchen with heat pump water heater, induction hob, dishwasher, smart fridge, and smoke/CO monitor (`src/core/fixtures.ts`).
- **Governance & Legal Standards**: Dual-licensing (AGPL-3.0-only + Commercial), Contributor License Agreement (`CLA.md`), Security Policy (`SECURITY.md`), and Funding metadata (`.github/FUNDING.yml`).
