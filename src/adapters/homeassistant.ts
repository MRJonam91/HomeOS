// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo <fbxmano@gmail.com> (MRJonam91)

import { auditWarranties } from "../core/warranty.ts";
import { computeScheduledTasksCost, getMaintenanceSchedule } from "../core/maintenance.ts";
import type { HomeLedger } from "../core/types.ts";

export function generateHomeAssistantYaml(
  ledger: HomeLedger,
  options: { referenceDate?: string } = {}
): string {
  const refDate = options.referenceDate ?? new Date().toISOString().split("T")[0] ?? "";
  const warranties = auditWarranties(ledger.items, ledger.rooms, refDate);
  const activeW = warranties.filter((w) => w.status === "active" || w.status === "lifetime").length;
  const expiringW = warranties.filter((w) => w.status === "expiring_soon");
  const expiredW = warranties.filter((w) => w.status === "expired").length;

  const schedule = getMaintenanceSchedule(ledger.items, ledger.rooms, 60, refDate);
  const overdueTasks = schedule.filter((s) => s.isOverdue);
  const costs = computeScheduledTasksCost(schedule);

  let totalKWh = 0;
  for (const item of ledger.items) {
    if (item.consumption?.estimatedAnnualKWh) {
      totalKWh += item.consumption.estimatedAnnualKWh;
    }
  }

  const lines: string[] = [
    `# ==============================================================================`,
    `# HomeOS - Home Assistant Integration Package`,
    `# Generated for Property: ${ledger.property.name}`,
    `# Export Date: ${refDate}`,
    `# Put this file into your homeassistant/packages/homeos.yaml directory`,
    `# ==============================================================================`,
    ``,
    `template:`,
    `  - sensor:`,
    `      - name: "HomeOS Total Items"`,
    `        unique_id: homeos_${ledger.property.id}_total_items`,
    `        icon: "mdi:home-analytics"`,
    `        state: "${ledger.items.length}"`,
    `        attributes:`,
    `          rooms_count: ${ledger.rooms.length}`,
    `          property_name: "${ledger.property.name}"`,
    ``,
    `      - name: "HomeOS Active Warranties"`,
    `        unique_id: homeos_${ledger.property.id}_active_warranties`,
    `        icon: "mdi:shield-check"`,
    `        state: "${activeW}"`,
    `        attributes:`,
    `          expired_count: ${expiredW}`,
    ``,
    `      - name: "HomeOS Expiring Warranties"`,
    `        unique_id: homeos_${ledger.property.id}_expiring_warranties`,
    `        icon: "mdi:shield-alert"`,
    `        state: "${expiringW.length}"`,
    `        attributes:`,
    `          expiring_items: >-`,
    `            [${expiringW.map((w) => `"${w.itemName} (${w.daysRemaining} days)"`).join(", ")}]`,
    ``,
    `      - name: "HomeOS Overdue Tasks"`,
    `        unique_id: homeos_${ledger.property.id}_overdue_tasks`,
    `        icon: "mdi:wrench-clock"`,
    `        state: "${overdueTasks.length}"`,
    `        attributes:`,
    `          overdue_list: >-`,
    `            [${overdueTasks.map((t) => `"${t.itemName} - ${t.task.title}"`).join(", ")}]`,
    ``,
    `      - name: "HomeOS Scheduled Maintenance Cost"`,
    `        unique_id: homeos_${ledger.property.id}_maintenance_cost`,
    `        icon: "mdi:currency-eur"`,
    `        unit_of_measurement: "EUR"`,
    `        state: "${costs.totalEstimatedCostEur}"`,
    `        attributes:`,
    `          diy_cost: ${costs.diyEstimatedCostEur}`,
    `          contractor_cost: ${costs.contractorEstimatedCostEur}`,
    ``,
    `      - name: "HomeOS Annual Energy Estimate"`,
    `        unique_id: homeos_${ledger.property.id}_annual_energy`,
    `        icon: "mdi:lightning-bolt"`,
    `        unit_of_measurement: "kWh"`,
    `        device_class: "energy"`,
    `        state: "${Math.round(totalKWh)}"`,
    ``,
    `automation:`,
    `  - alias: "HomeOS Overdue Maintenance Alert"`,
    `    id: homeos_alert_overdue_${ledger.property.id}`,
    `    trigger:`,
    `      - platform: numeric_state`,
    `        entity_id: sensor.homeos_overdue_tasks`,
    `        above: 0`,
    `    action:`,
    `      - service: persistent_notification.create`,
    `        data:`,
    `          title: "⚠️ HomeOS: Manutenzioni Scadute"`,
    `          message: "Ci sono {{ states('sensor.homeos_overdue_tasks') }} interventi di manutenzione scaduti nell'immobile ${ledger.property.name}."`,
  ];

  return lines.join("\n");
}
