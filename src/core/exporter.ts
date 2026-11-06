// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo <fbxmano@gmail.com> (MRJonam91)

import { analyzeHomeIntegrity } from "./audit.ts";
import { evaluateWarranty } from "./warranty.ts";
import type { HomeLedger, Item, Room } from "./types.ts";

export interface DossierExportOptions {
  lang?: "it" | "en";
  referenceDate?: string;
}

export function generateRoomDossierMarkdown(
  ledger: HomeLedger,
  roomId: string,
  options: DossierExportOptions = {}
): string {
  const lang = options.lang ?? "it";
  const refDate = options.referenceDate ?? new Date().toISOString().split("T")[0] ?? "";
  const room = ledger.rooms.find((r) => r.id === roomId);
  if (!room) {
    throw new Error(`Room '${roomId}' not found in ledger.`);
  }

  const roomItems = ledger.items.filter((i) => i.roomId === roomId);
  const totalValue = roomItems.reduce(
    (acc, item) => acc + (item.estimatedReplacementValueEur ?? item.purchasePrice ?? 0),
    0
  );

  const isIt = lang === "it";
  const lines: string[] = [];

  // Title & Header
  lines.push(`# ${isIt ? "Dossier Stanza" : "Room Dossier"}: ${room.name}`);
  lines.push("");
  lines.push(`> **${isIt ? "Immobile" : "Property"}:** ${ledger.property.name}${ledger.property.address ? ` (${ledger.property.address})` : ""}`);
  lines.push(`> **${isIt ? "Piano / Categoria" : "Floor / Category"}:** ${room.floor ?? "N/D"} | ${room.category}`);
  lines.push(`> **${isIt ? "Apparecchi censiti" : "Registered items"}:** ${roomItems.length} | **${isIt ? "Valore stimato" : "Estimated value"}:** €${totalValue.toLocaleString()}`);
  lines.push(`> **${isIt ? "Data report" : "Report date"}:** ${refDate}`);
  lines.push("");

  // 1. Inventory table
  lines.push(`## 📦 ${isIt ? "Inventario Apparecchiature" : "Item Inventory"}`);
  lines.push("");
  lines.push(
    isIt
      ? "| Apparecchio | Marca / Modello | Seriale | Categoria | Acquisto | Valore (€) |"
      : "| Item | Brand / Model | Serial Number | Category | Purchased | Value (€) |"
  );
  lines.push("|---|---|---|---|---|---|");

  for (const item of roomItems) {
    const brandModel = [item.brand, item.model].filter(Boolean).join(" ") || "-";
    const serial = item.serialNumber || "-";
    const purchase = item.purchaseDate || "-";
    const val = (item.estimatedReplacementValueEur ?? item.purchasePrice ?? 0).toString();
    lines.push(`| **${item.name}** | ${brandModel} | \`${serial}\` | ${item.category} | ${purchase} | €${val} |`);
  }
  lines.push("");

  // 2. Warranties table
  lines.push(`## 🛡️ ${isIt ? "Garanzie e Assistenza" : "Warranties & Support"}`);
  lines.push("");
  lines.push(
    isIt
      ? "| Apparecchio | Fornitore / Polizza | Scadenza | Stato | Contatto Assistenza |"
      : "| Item | Provider / Policy | Expiry | Status | Support Contact |"
  );
  lines.push("|---|---|---|---|---|");

  let hasWarranties = false;
  for (const item of roomItems) {
    if (item.warranty) {
      hasWarranties = true;
      const evalW = evaluateWarranty(item.warranty, refDate);
      const statusBadge =
        evalW.status === "active"
          ? (isIt ? "🟢 Attiva" : "🟢 Active")
          : evalW.status === "expiring_soon"
            ? (isIt ? `🟡 Scade a breve (${evalW.daysRemaining} gg)` : `🟡 Expiring soon (${evalW.daysRemaining} d)`)
            : evalW.status === "lifetime"
              ? (isIt ? "⭐ A vita" : "⭐ Lifetime")
              : (isIt ? "🔴 Scaduta" : "🔴 Expired");

      const provider = [item.warranty.provider, item.warranty.policyNumber ? `#${item.warranty.policyNumber}` : ""].filter(Boolean).join(" ");
      const contact = item.warranty.supportContact || "-";
      lines.push(`| ${item.name} | ${provider} | ${evalW.endDate} | ${statusBadge} | ${contact} |`);
    }
  }
  if (!hasWarranties) {
    lines.push(`| *${isIt ? "Nessuna garanzia registrata" : "No warranties recorded"}* | - | - | - | - |`);
  }
  lines.push("");

  // 3. Maintenance schedules
  lines.push(`## 🔧 ${isIt ? "Manutenzioni Programmate e Controlli" : "Planned Maintenance & Checks"}`);
  lines.push("");
  lines.push(
    isIt
      ? "| Apparecchio | Intervento | Frequenza | Prossima Scadenza | Priorità | Tipo | Checklist |"
      : "| Item | Routine | Frequency | Next Due | Priority | Type | Checklist |"
  );
  lines.push("|---|---|---|---|---|---|---|");

  let hasTasks = false;
  for (const item of roomItems) {
    for (const task of item.maintenanceTasks) {
      hasTasks = true;
      const freq = isIt ? `Ogni ${task.frequencyMonths} mesi` : `Every ${task.frequencyMonths} mo`;
      const type = task.diyFriendly ? (isIt ? "🛠️ Fai-da-te" : "🛠️ DIY") : (isIt ? "👷 Tecnico" : "👷 Pro");
      const checklistStr = task.checklist && task.checklist.length > 0 ? task.checklist.join("; ") : "-";
      lines.push(`| ${item.name} | **${task.title}** | ${freq} | \`${task.nextDueDate}\` | ${task.priority.toUpperCase()} | ${type} | ${checklistStr} |`);
    }
  }
  if (!hasTasks) {
    lines.push(`| *${isIt ? "Nessun intervento pianificato" : "No scheduled tasks"}* | - | - | - | - | - | - |`);
  }
  lines.push("");

  // 4. Documents & Manuals
  lines.push(`## 📄 ${isIt ? "Manuali e Documenti Collegati" : "Manuals & Attached Documents"}`);
  lines.push("");
  lines.push(
    isIt
      ? "| Apparecchio | Titolo Documento | Tipologia | Percorso / Riferimento |"
      : "| Item | Document Title | Type | Path / Link |"
  );
  lines.push("|---|---|---|---|");

  let hasDocs = false;
  for (const item of roomItems) {
    for (const doc of item.documents) {
      hasDocs = true;
      lines.push(`| ${item.name} | ${doc.title} | \`${doc.type}\` | ${doc.pathOrUrl} |`);
    }
  }
  if (!hasDocs) {
    lines.push(`| *${isIt ? "Nessun documento collegato" : "No documents attached"}* | - | - | - |`);
  }
  lines.push("");

  // 5. Verification & Integrity Section (Tripartite)
  const audit = analyzeHomeIntegrity(
    { ...ledger, items: roomItems },
    refDate
  );

  lines.push(`## ⚖️ ${isIt ? "Audit di Integrità Dati (Tripartizione)" : "Data Integrity Audit"}`);
  lines.push("");
  lines.push(isIt ? "### 1. Fatti Osservati e Verificabili" : "### 1. Observed & Verifiable Facts");
  for (const fact of audit.observedFacts) {
    lines.push(`- [x] ${fact.summary}`);
  }
  if (audit.observedFacts.length === 0) {
    lines.push(isIt ? "- *Nessun fatto accertato con fonte.*" : "- *No verified facts with sources.*");
  }
  lines.push("");

  lines.push(isIt ? "### 2. Valori Stimati" : "### 2. Estimated Values");
  for (const est of audit.estimatedIndicators) {
    lines.push(`- **${est.summary}:** ${est.value}`);
  }
  if (audit.estimatedIndicators.length === 0) {
    lines.push(isIt ? "- *Nessuna stima registrata.*" : "- *No estimates recorded.*");
  }
  lines.push("");

  lines.push(isIt ? "### 3. Decisioni Richieste a una Persona" : "### 3. Decisions Requiring Human Action");
  for (const dec of audit.humanDecisionsRequired) {
    lines.push(`- **[${dec.urgency.toUpperCase()}]** ${dec.issue} -> *${dec.recommendedAction}*`);
  }
  if (audit.humanDecisionsRequired.length === 0) {
    lines.push(isIt ? "- *Nessuna azione urgente in sospeso.*" : "- *No pending urgent actions.*");
  }
  lines.push("");

  lines.push("---");
  lines.push(`*Generated by [HomeOS](https://github.com/MRJonam91/HomeOS) — Local-First Home Operating System*`);

  return lines.join("\n");
}
