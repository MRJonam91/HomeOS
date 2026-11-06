// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo <fbxmano@gmail.com> (MRJonam91)

import { computeDaysDifference, evaluateWarranty } from "./warranty.ts";
import type { AuditReport, HomeLedger } from "./types.ts";

export function analyzeHomeIntegrity(
  ledger: HomeLedger,
  referenceDate: string = new Date().toISOString().split("T")[0] ?? ""
): AuditReport {
  const observedFacts: AuditReport["observedFacts"] = [];
  const estimatedIndicators: AuditReport["estimatedIndicators"] = [];
  const humanDecisionsRequired: AuditReport["humanDecisionsRequired"] = [];

  let totalReplacementVal = 0;
  let totalAnnualKWh = 0;

  for (const item of ledger.items) {
    // 1. Replacement value estimation
    const replacementVal = item.estimatedReplacementValueEur ?? item.purchasePrice ?? 0;
    totalReplacementVal += replacementVal;

    // 2. Observed verifiable facts
    if (item.serialNumber && item.serialNumber.trim() !== "") {
      observedFacts.push({
        category: "serial_number",
        summary: `Fatto accertato: matricola verificata per '${item.name}' (${item.brand ?? "N/D"} ${item.model ?? ""}) -> ${item.serialNumber}`,
        itemId: item.id,
        verifiedAt: item.purchaseDate ?? ledger.property.createdAt,
      });
    }

    for (const doc of item.documents) {
      observedFacts.push({
        category: doc.type === "receipt" || doc.type === "invoice" ? "receipt" : "manual",
        summary: `Documento registrato: [${doc.type}] ${doc.title} (${doc.pathOrUrl})`,
        itemId: item.id,
        verifiedAt: doc.dateAdded,
      });
    }

    for (const log of item.maintenanceLogs) {
      observedFacts.push({
        category: "log",
        summary: `Intervento eseguito: '${log.contractorOrDiy}' il ${log.performedDate} (€${log.costEur})${log.invoiceRef ? ` [Fatt. ${log.invoiceRef}]` : ""}`,
        itemId: item.id,
        verifiedAt: log.performedDate,
      });
    }

    // 3. Estimated indicators
    if (item.consumption) {
      if (item.consumption.estimatedAnnualKWh) {
        totalAnnualKWh += item.consumption.estimatedAnnualKWh;
        estimatedIndicators.push({
          category: "power_consumption",
          summary: `Stima consumo annuo: ${item.name} (${item.consumption.energyClass ?? "classe N/D"})`,
          value: `~${item.consumption.estimatedAnnualKWh} kWh/anno (potenza nominale ${item.consumption.ratedPowerWatts ?? "?"} W)`,
          itemId: item.id,
        });
      }
    }

    // 4. Human decisions required
    if (item.warranty) {
      const evalW = evaluateWarranty(item.warranty, referenceDate);
      if (evalW.status === "expiring_soon") {
        humanDecisionsRequired.push({
          category: "warranty_claim",
          urgency: "high",
          issue: `Garanzia in scadenza tra ${evalW.daysRemaining} giorni per '${item.name}' (${item.warranty.provider})`,
          recommendedAction: "Verificare integrità e funzionamento dell'apparecchio per eventuale estensione o intervento in garanzia prima del termine.",
          itemId: item.id,
        });
      }
    }

    for (const task of item.maintenanceTasks) {
      const diffDays = computeDaysDifference(referenceDate, task.nextDueDate);
      if (diffDays < 0) {
        const isUrgent = task.priority === "critical" || task.priority === "high";
        humanDecisionsRequired.push({
          category: task.priority === "critical" ? "safety_inspection" : "overdue_maintenance",
          urgency: isUrgent ? "high" : "medium",
          issue: `Manutenzione SCADUTA da ${Math.abs(diffDays)} giorni: '${task.title}' su '${item.name}'`,
          recommendedAction: task.diyFriendly
            ? "Eseguire controllo fai-da-te secondo la checklist del libretto."
            : "Contattare un tecnico specializzato per revisione programmata.",
          itemId: item.id,
        });
      }
    }

    // Missing critical documents
    if (replacementVal > 300 && !item.serialNumber) {
      humanDecisionsRequired.push({
        category: "missing_document",
        urgency: "medium",
        issue: `Dispositivo di valore rilevante (€${replacementVal}) privo di matricola seriale registrata: '${item.name}'`,
        recommendedAction: "Fotografare la targhetta dati per la copertura assicurativa e registrare il seriale.",
        itemId: item.id,
      });
    }
  }

  if (totalAnnualKWh > 0) {
    estimatedIndicators.unshift({
      category: "power_consumption",
      summary: "Stima consumo elettrico complessivo apparecchi inventariati",
      value: `~${Math.round(totalAnnualKWh)} kWh/anno`,
    });
  }

  return {
    timestamp: new Date().toISOString(),
    totalRooms: ledger.rooms.length,
    totalItems: ledger.items.length,
    totalEstimatedReplacementValueEur: Math.round(totalReplacementVal * 100) / 100,
    observedFacts,
    estimatedIndicators,
    humanDecisionsRequired,
  };
}
