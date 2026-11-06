#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo <fbxmano@gmail.com> (MRJonam91)

import { writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  DEFAULT_LEDGER_FILENAME,
  HOMEOS_SCHEMA_VERSION,
  SPONSOR_URLS,
  formatSponsorNotice,
  shouldShowSponsorNotice,
} from "../core/constants.ts";
import {
  addRoom,
  addItem,
  createEmptyLedger,
  getRoom,
  loadLedger,
  saveLedger,
  searchItems,
} from "../core/inventory.ts";
import { auditWarranties } from "../core/warranty.ts";
import { computeScheduledTasksCost, getMaintenanceSchedule } from "../core/maintenance.ts";
import { analyzeHomeIntegrity } from "../core/audit.ts";
import { generateRoomDossierMarkdown } from "../core/exporter.ts";
import { createSyntheticPilotHome } from "../core/fixtures.ts";
import type { ItemCategory, RoomCategory } from "../core/types.ts";

function printUsage(): void {
  console.log(`
HomeOS v${HOMEOS_SCHEMA_VERSION} — Local-first home operating system & digital binder

Usage:
  homeos <command> [options]

Commands:
  init                  Initialize a new HomeOS ledger
                        Options: --sample (seed with pilot kitchen), --file <path>, --name <propName>
  room list             List all rooms and item counts
                        Options: --file <path>
  room add <name>       Add a new room
                        Options: --floor <floor>, --category <category>, --file <path>
  item add <roomId> <name>
                        Add an item to a room
                        Options: --brand <b>, --model <m>, --serial <s>, --price <p>, --category <c>
  list                  List inventory items
                        Options: --room <roomId>, --file <path>
  search <query>        Search items across brands, models, serial numbers, documents
                        Options: --file <path>
  schedule              Show upcoming & overdue maintenance tasks
                        Options: --days <n> (default: 60), --file <path>
  warranties            Audit warranty statuses and expiring equipment
                        Options: --days <n> (default: 60), --file <path>
  audit                 Run three-tier audit (observed facts, estimates, human decisions)
                        Options: --file <path>
  dossier <roomId>      Export structured Markdown Room Dossier / House Binder
                        Options: --lang <it|en> (default: it), --out <file>, --file <path>

Global flags:
  -h, --help            Show this help manual
  -v, --version         Print version

Sponsor:
  HomeOS is independent open-source. Support development: ${SPONSOR_URLS.kofi} | ${SPONSOR_URLS.github}
`);
}

function parseArgs(args: string[]) {
  const flags: Record<string, string | boolean> = {};
  const positional: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = args[i + 1];
      if (next && !next.startsWith("-")) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    } else if (arg.startsWith("-")) {
      const key = arg.slice(1);
      flags[key] = true;
    } else {
      positional.push(arg);
    }
  }

  return { positional, flags };
}

function getLedgerPath(flags: Record<string, string | boolean>): string {
  const custom = flags["file"] || flags["f"];
  if (typeof custom === "string" && custom.trim() !== "") {
    return resolve(process.cwd(), custom);
  }
  return resolve(process.cwd(), DEFAULT_LEDGER_FILENAME);
}

export function runCli(argv: string[] = process.argv.slice(2)): void {
  const { positional, flags } = parseArgs(argv);
  const command = positional[0]?.toLowerCase();

  if (!command || flags["help"] || flags["h"]) {
    printUsage();
    return;
  }

  if (flags["version"] || flags["v"]) {
    console.log(`HomeOS v${HOMEOS_SCHEMA_VERSION}`);
    return;
  }

  const ledgerPath = getLedgerPath(flags);

  try {
    switch (command) {
      case "init": {
        if (existsSync(ledgerPath) && !flags["force"]) {
          console.error(`Ledger already exists at ${ledgerPath}. Use --force to overwrite.`);
          process.exitCode = 1;
          return;
        }

        const sample = flags["sample"] === true;
        const name = typeof flags["name"] === "string" ? flags["name"] : "Mia Casa";
        const ledger = sample ? createSyntheticPilotHome() : createEmptyLedger(name);

        saveLedger(ledger, ledgerPath);
        console.log(`Initialized HomeOS ledger at: ${ledgerPath}`);
        if (sample) {
          console.log(`Seeded with synthetic pilot room: '${ledger.rooms[0]?.name}' (${ledger.items.length} appliances, warranties & routines).`);
        }
        break;
      }

      case "room": {
        const sub = positional[1]?.toLowerCase();
        const ledger = loadLedger(ledgerPath);

        if (sub === "list" || !sub) {
          console.log(`\nRooms in '${ledger.property.name}' (${ledger.rooms.length}):`);
          console.log("-".repeat(70));
          for (const room of ledger.rooms) {
            const itemCount = ledger.items.filter((i) => i.roomId === room.id).length;
            console.log(`- [${room.id}] ${room.name} (${room.floor ?? "Piano N/D"}) | Cat: ${room.category} | ${itemCount} items`);
          }
          console.log("-".repeat(70));
        } else if (sub === "add") {
          const roomName = positional[2];
          if (!roomName) {
            console.error("Error: Missing room name. Usage: homeos room add <name> [--floor <floor>] [--category <cat>]");
            process.exitCode = 1;
            return;
          }
          const floor = typeof flags["floor"] === "string" ? flags["floor"] : undefined;
          const category = (typeof flags["category"] === "string" ? flags["category"] : "other") as RoomCategory;
          const added = addRoom(ledger, { name: roomName, floor, category });
          saveLedger(ledger, ledgerPath);
          console.log(`Room '${added.name}' created with ID: ${added.id}`);
        } else {
          console.error(`Unknown room subcommand: ${sub}`);
          process.exitCode = 1;
        }
        break;
      }

      case "item": {
        const sub = positional[1]?.toLowerCase();
        const ledger = loadLedger(ledgerPath);

        if (sub === "add") {
          const roomId = positional[2];
          const itemName = positional[3];
          if (!roomId || !itemName) {
            console.error("Error: Usage: homeos item add <roomId> <name> [--brand <b>] [--model <m>] [--serial <s>] [--price <p>]");
            process.exitCode = 1;
            return;
          }
          const brand = typeof flags["brand"] === "string" ? flags["brand"] : undefined;
          const model = typeof flags["model"] === "string" ? flags["model"] : undefined;
          const serialNumber = typeof flags["serial"] === "string" ? flags["serial"] : undefined;
          const priceStr = typeof flags["price"] === "string" ? flags["price"] : undefined;
          const category = (typeof flags["category"] === "string" ? flags["category"] : "appliance") as ItemCategory;

          const purchasePrice = priceStr ? parseFloat(priceStr) : undefined;
          const added = addItem(ledger, {
            roomId,
            name: itemName,
            brand,
            model,
            serialNumber,
            category,
            purchasePrice,
          });
          saveLedger(ledger, ledgerPath);
          console.log(`Item '${added.name}' added to room '${roomId}' with ID: ${added.id}`);
        } else {
          console.error(`Unknown item subcommand: ${sub}`);
          process.exitCode = 1;
        }
        break;
      }

      case "list": {
        const ledger = loadLedger(ledgerPath);
        const filterRoom = typeof flags["room"] === "string" ? flags["room"] : undefined;
        const items = filterRoom ? ledger.items.filter((i) => i.roomId === filterRoom) : ledger.items;

        console.log(`\nInventory items (${items.length}):`);
        console.log("-".repeat(85));
        for (const item of items) {
          const room = getRoom(ledger, item.roomId);
          const brandModel = [item.brand, item.model].filter(Boolean).join(" ") || "-";
          const serial = item.serialNumber ? `SN: ${item.serialNumber}` : "No SN";
          const warrantyStatus = item.warranty ? "Warranty: YES" : "No warranty";
          console.log(`- [${item.id}] ${item.name} | ${brandModel} | ${room?.name ?? item.roomId} | ${serial} | ${warrantyStatus}`);
        }
        console.log("-".repeat(85));
        break;
      }

      case "search": {
        const query = positional.slice(1).join(" ");
        if (!query) {
          console.error("Error: Please provide search query. Example: homeos search Bosch");
          process.exitCode = 1;
          return;
        }
        const ledger = loadLedger(ledgerPath);
        const results = searchItems(ledger, query);
        console.log(`\nSearch results for '${query}' (${results.length} found):`);
        console.log("-".repeat(85));
        for (const item of results) {
          const room = getRoom(ledger, item.roomId);
          console.log(`- ${item.name} (${item.brand ?? "N/D"} ${item.model ?? ""}) in [${room?.name ?? item.roomId}]`);
          if (item.serialNumber) console.log(`  Serial: ${item.serialNumber}`);
          if (item.documents.length) console.log(`  Documents: ${item.documents.map((d) => d.title).join(", ")}`);
        }
        console.log("-".repeat(85));
        break;
      }

      case "schedule": {
        const days = typeof flags["days"] === "string" ? parseInt(flags["days"], 10) : 60;
        const ledger = loadLedger(ledgerPath);
        const tasks = getMaintenanceSchedule(ledger.items, ledger.rooms, days);
        const costStats = computeScheduledTasksCost(tasks);

        console.log(`\nMaintenance schedule (horizon: ${days} days, ${tasks.length} tasks):`);
        console.log("-".repeat(85));
        for (const t of tasks) {
          const badge = t.isOverdue
            ? `\x1b[31m[SCADUTO ${Math.abs(t.daysUntilDue)} gg]\x1b[0m`
            : `\x1b[32m[Tra ${t.daysUntilDue} gg]\x1b[0m`;
          const type = t.task.diyFriendly ? "🛠️ DIY" : "👷 Tecnico";
          console.log(`${badge} ${t.itemName} (${t.roomName}) -> ${t.task.title} | ${type} | Scadenza: ${t.task.nextDueDate}`);
        }
        console.log("-".repeat(85));
        console.log(`Stima costi periodo: Totale: €${costStats.totalEstimatedCostEur} (Fai-da-te: €${costStats.diyEstimatedCostEur}, Tecnico: €${costStats.contractorEstimatedCostEur})`);
        break;
      }

      case "warranties": {
        const ledger = loadLedger(ledgerPath);
        const evaluations = auditWarranties(ledger.items, ledger.rooms);

        console.log(`\nWarranty Audit (${evaluations.length} items covered):`);
        console.log("-".repeat(85));
        for (const ev of evaluations) {
          const badge =
            ev.status === "active"
              ? "🟢 ATTIVA"
              : ev.status === "expiring_soon"
                ? `🟡 SCADE A BREVE (${ev.daysRemaining} gg)`
                : ev.status === "lifetime"
                  ? "⭐ A VITA"
                  : "🔴 SCADUTA";

          console.log(`[${badge}] ${ev.itemName} (${ev.roomName}) | Fornitore: ${ev.provider} | Scadenza: ${ev.endDate}`);
        }
        console.log("-".repeat(85));
        break;
      }

      case "audit": {
        const ledger = loadLedger(ledgerPath);
        const report = analyzeHomeIntegrity(ledger);

        console.log(`\nHomeOS Integrity Audit Report — ${ledger.property.name}`);
        console.log(`Valore complessivo inventario stimato: €${report.totalEstimatedReplacementValueEur}`);
        console.log("=".repeat(85));

        console.log(`\n1. FATTI ACCERTATI E VERIFICABILI (${report.observedFacts.length}):`);
        for (const fact of report.observedFacts) {
          console.log(`  ✓ ${fact.summary}`);
        }

        console.log(`\n2. VALORI STIMATI (${report.estimatedIndicators.length}):`);
        for (const est of report.estimatedIndicators) {
          console.log(`  ~ ${est.summary}: ${est.value}`);
        }

        console.log(`\n3. DECISIONI RICHIESTE A UNA PERSONA (${report.humanDecisionsRequired.length}):`);
        for (const dec of report.humanDecisionsRequired) {
          console.log(`  ! [${dec.urgency.toUpperCase()}] ${dec.issue}`);
          console.log(`    Azione: ${dec.recommendedAction}`);
        }
        console.log("=".repeat(85));
        break;
      }

      case "dossier": {
        const roomId = positional[1];
        if (!roomId) {
          console.error("Error: Missing roomId. Usage: homeos dossier <roomId> [--lang it|en] [--out <path>]");
          process.exitCode = 1;
          return;
        }
        const ledger = loadLedger(ledgerPath);
        const lang = flags["lang"] === "en" ? "en" : "it";
        const markdown = generateRoomDossierMarkdown(ledger, roomId, { lang });

        const outFile = typeof flags["out"] === "string" ? flags["out"] : undefined;
        if (outFile) {
          writeFileSync(resolve(process.cwd(), outFile), markdown, "utf-8");
          console.log(`Dossier exported to ${outFile}`);
        } else {
          console.log(markdown);
        }
        break;
      }

      default: {
        console.error(`Unknown command: '${command}'. Run 'homeos --help' for commands.`);
        process.exitCode = 1;
        return;
      }
    }

    if (shouldShowSponsorNotice()) {
      console.log(formatSponsorNotice());
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Error: ${msg}`);
    process.exitCode = 1;
  }
}

// Run CLI directly when executed as entry point
const isDirectRun =
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith("homeos") ||
  process.argv[1]?.endsWith("index.js") ||
  process.argv[1]?.endsWith("index.ts");

if (isDirectRun) {
  runCli();
}
