// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo <fbxmano@gmail.com> (MRJonam91)

import { auditWarranties } from "../core/warranty.ts";
import { computeScheduledTasksCost, getMaintenanceSchedule } from "../core/maintenance.ts";
import { analyzeHomeIntegrity } from "../core/audit.ts";
import type { HomeLedger } from "../core/types.ts";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function generateHouseDashboardHtml(
  ledger: HomeLedger,
  options: { referenceDate?: string; lang?: "it" | "en" } = {}
): string {
  const isIt = (options.lang ?? "it") === "it";
  const refDate = options.referenceDate ?? new Date().toISOString().split("T")[0] ?? "";
  const warranties = auditWarranties(ledger.items, ledger.rooms, refDate);
  const schedule = getMaintenanceSchedule(ledger.items, ledger.rooms, 90, refDate);
  const costs = computeScheduledTasksCost(schedule);
  const audit = analyzeHomeIntegrity(ledger, refDate);

  const totalValue = ledger.items.reduce(
    (acc, i) => acc + (i.estimatedReplacementValueEur ?? i.purchasePrice ?? 0),
    0
  );
  let totalKWh = 0;
  for (const i of ledger.items) {
    if (i.consumption?.estimatedAnnualKWh) totalKWh += i.consumption.estimatedAnnualKWh;
  }

  const activeW = warranties.filter((w) => w.status === "active" || w.status === "lifetime").length;
  const overdueTasks = schedule.filter((s) => s.isOverdue).length;

  return `<!DOCTYPE html>
<html lang="${isIt ? "it" : "en"}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HomeOS — ${escapeHtml(ledger.property.name)}</title>
  <style>
    :root {
      --bg: #0f172a;
      --card-bg: #1e293b;
      --border: #334155;
      --text: #f8fafc;
      --text-dim: #94a3b8;
      --primary: #38bdf8;
      --accent: #4ade80;
      --warn: #fbbf24;
      --err: #f87171;
    }
    @media (prefers-color-scheme: light) {
      :root {
        --bg: #f8fafc;
        --card-bg: #ffffff;
        --border: #e2e8f0;
        --text: #0f172a;
        --text-dim: #64748b;
        --primary: #0284c7;
        --accent: #16a34a;
        --warn: #d97706;
        --err: #dc2626;
      }
    }
    body {
      margin: 0;
      padding: 24px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.5;
    }
    .container { max-width: 1100px; margin: 0 auto; }
    header { margin-bottom: 24px; border-bottom: 1px solid var(--border); padding-bottom: 16px; }
    h1 { margin: 0 0 8px 0; font-size: 28px; }
    .subtitle { color: var(--text-dim); margin: 0; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin: 24px 0; }
    .card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 8px; padding: 16px; }
    .card-title { font-size: 13px; color: var(--text-dim); text-transform: uppercase; margin-bottom: 4px; }
    .card-val { font-size: 24px; font-weight: bold; color: var(--primary); }
    section { margin: 32px 0; }
    h2 { font-size: 20px; border-bottom: 2px solid var(--primary); padding-bottom: 8px; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid var(--border); font-size: 14px; }
    th { background: rgba(56, 189, 248, 0.08); font-weight: 600; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
    .badge-ok { background: rgba(74, 222, 128, 0.15); color: var(--accent); }
    .badge-warn { background: rgba(251, 191, 36, 0.15); color: var(--warn); }
    .badge-err { background: rgba(248, 113, 113, 0.15); color: var(--err); }
    .audit-box { background: var(--card-bg); border-left: 4px solid var(--warn); padding: 16px; margin-top: 8px; border-radius: 0 8px 8px 0; }
    footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid var(--border); font-size: 13px; color: var(--text-dim); text-align: center; }
    @media print {
      body { background: white; color: black; padding: 0; }
      .card { border: 1px solid #ccc; }
      footer { display: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🏠 ${escapeHtml(ledger.property.name)}</h1>
      <p class="subtitle">${escapeHtml(ledger.property.address ?? "N/D")}${ledger.property.cadastralData ? ` &bull; ${escapeHtml(ledger.property.cadastralData)}` : ""} &bull; ${isIt ? "Data report:" : "Report date:"} ${escapeHtml(refDate)}</p>
    </header>

    <div class="grid">
      <div class="card">
        <div class="card-title">${isIt ? "Locali / Stanze" : "Rooms"}</div>
        <div class="card-val">${ledger.rooms.length}</div>
      </div>
      <div class="card">
        <div class="card-title">${isIt ? "Apparecchi Inventariati" : "Total Assets"}</div>
        <div class="card-val">${ledger.items.length}</div>
      </div>
      <div class="card">
        <div class="card-title">${isIt ? "Valore Sostituzione" : "Asset Valuation"}</div>
        <div class="card-val">€${totalValue.toLocaleString()}</div>
      </div>
      <div class="card">
        <div class="card-title">${isIt ? "Garanzie Attive" : "Active Warranties"}</div>
        <div class="card-val">${activeW} / ${warranties.length}</div>
      </div>
      <div class="card">
        <div class="card-title">${isIt ? "Manutenzioni Scadute" : "Overdue Tasks"}</div>
        <div class="card-val" style="color: ${overdueTasks > 0 ? "var(--err)" : "var(--accent)"}">${overdueTasks}</div>
      </div>
      <div class="card">
        <div class="card-title">${isIt ? "Consumo Teorico" : "Energy Estimate"}</div>
        <div class="card-val">${Math.round(totalKWh)} kWh/a</div>
      </div>
    </div>

    <section>
      <h2>📦 ${isIt ? "Inventario Apparecchiature per Locale" : "Asset Inventory by Room"}</h2>
      <table>
        <thead>
          <tr>
            <th>${isIt ? "Apparecchio" : "Item"}</th>
            <th>${isIt ? "Locale" : "Room"}</th>
            <th>${isIt ? "Marca / Modello" : "Brand / Model"}</th>
            <th>${isIt ? "Matricola Seriale" : "Serial Number"}</th>
            <th>${isIt ? "Garanzia" : "Warranty"}</th>
            <th>${isIt ? "Valore" : "Value"}</th>
          </tr>
        </thead>
        <tbody>
          ${ledger.items
            .map((item) => {
              const room = ledger.rooms.find((r) => r.id === item.roomId);
              const brandModel = [item.brand, item.model].filter(Boolean).join(" ") || "-";
              const serial = item.serialNumber ? `<code>${escapeHtml(item.serialNumber)}</code>` : "-";
              const val = item.estimatedReplacementValueEur ?? item.purchasePrice ?? 0;
              const wBadge = item.warranty
                ? `<span class="badge badge-ok">${escapeHtml(item.warranty.provider)}</span>`
                : `<span class="badge badge-warn">${isIt ? "Nessuna" : "None"}</span>`;
              return `<tr>
                <td><strong>${escapeHtml(item.name)}</strong></td>
                <td>${escapeHtml(room?.name ?? "-")}</td>
                <td>${escapeHtml(brandModel)}</td>
                <td>${serial}</td>
                <td>${wBadge}</td>
                <td>€${val.toLocaleString()}</td>
              </tr>`;
            })
            .join("")}
        </tbody>
      </table>
    </section>

    <section>
      <h2>🔧 ${isIt ? "Scadenziario Manutenzioni Programmate (Prossimi 90 giorni)" : "Maintenance Schedule (Next 90 Days)"}</h2>
      <table>
        <thead>
          <tr>
            <th>${isIt ? "Intervento" : "Routine"}</th>
            <th>${isIt ? "Apparecchio" : "Item"}</th>
            <th>${isIt ? "Locale" : "Room"}</th>
            <th>${isIt ? "Scadenza" : "Due Date"}</th>
            <th>${isIt ? "Tipo" : "Type"}</th>
            <th>${isIt ? "Costo Stimato" : "Est. Cost"}</th>
          </tr>
        </thead>
        <tbody>
          ${schedule
            .map((s) => {
              const badgeClass = s.isOverdue ? "badge-err" : "badge-ok";
              const statusText = s.isOverdue
                ? (isIt ? `Scaduto (${Math.abs(s.daysUntilDue)} gg)` : `Overdue (${Math.abs(s.daysUntilDue)} d)`)
                : (isIt ? `Tra ${s.daysUntilDue} gg` : `In ${s.daysUntilDue} d`);
              const typeText = s.task.diyFriendly ? (isIt ? "🛠️ Fai-da-te" : "🛠️ DIY") : (isIt ? "👷 Tecnico" : "👷 Pro");
              return `<tr>
                <td><strong>${escapeHtml(s.task.title)}</strong></td>
                <td>${escapeHtml(s.itemName)}</td>
                <td>${escapeHtml(s.roomName)}</td>
                <td><code>${escapeHtml(s.task.nextDueDate)}</code> <span class="badge ${badgeClass}">${statusText}</span></td>
                <td>${typeText}</td>
                <td>€${s.task.estimatedCostEur}</td>
              </tr>`;
            })
            .join("")}
        </tbody>
      </table>
    </section>

    <section>
      <h2>⚖️ ${isIt ? "Decisioni Richieste a una Persona" : "Pending Human Decisions & Action Items"}</h2>
      ${audit.humanDecisionsRequired
        .map(
          (d) => `<div class="audit-box">
            <strong>[${escapeHtml(d.urgency.toUpperCase())}] ${escapeHtml(d.issue)}</strong><br>
            <span class="subtitle">${isIt ? "Azione raccomandata:" : "Recommended action:"} ${escapeHtml(d.recommendedAction)}</span>
          </div>`
        )
        .join("")}
    </section>

    <footer>
      Generated with HomeOS (Local-First Home Operating System) &bull; <a href="https://github.com/MRJonam91/HomeOS" style="color: var(--primary);">github.com/MRJonam91/HomeOS</a>
    </footer>
  </div>
</body>
</html>`;
}
