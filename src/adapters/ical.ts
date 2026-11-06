// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo <fbxmano@gmail.com> (MRJonam91)

import { getMaintenanceSchedule } from "../core/maintenance.ts";
import type { Item, Room, ScheduledTaskEvaluation } from "../core/types.ts";

function formatIcsDate(isoDate: string): string {
  // YYYY-MM-DD -> YYYYMMDD
  return isoDate.replace(/-/g, "");
}

function addDaysToIsoDate(isoDate: string, days: number): string {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return isoDate;
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split("T")[0] ?? isoDate;
}

function escapeIcsText(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

export function generateMaintenanceIcs(
  items: Item[],
  rooms: Room[],
  options: {
    horizonDays?: number;
    referenceDate?: string;
    propertyName?: string;
  } = {}
): string {
  const horizon = options.horizonDays ?? 365;
  const refDate = options.referenceDate ?? new Date().toISOString().split("T")[0] ?? "";
  const propName = options.propertyName ?? "HomeOS Property";
  const tasks = getMaintenanceSchedule(items, rooms, horizon, refDate);

  const nowStamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MRJonam91//HomeOS Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcsText(`Manutenzioni Casa — ${propName}`)}`,
    "X-WR-TIMEZONE:UTC",
  ];

  for (const t of tasks) {
    const task = t.task;
    const startStr = formatIcsDate(task.nextDueDate);
    const endStr = formatIcsDate(addDaysToIsoDate(task.nextDueDate, 1));
    const uid = `homeos-${t.itemId}-${task.id}@homeos.local`;

    const summary = `🔧 ${task.title} [${t.itemName}]`;
    const typeLabel = task.diyFriendly ? "Fai-da-te" : "Tecnico specializzato";
    const descParts = [
      `Locale: ${t.roomName}`,
      `Apparecchio: ${t.itemName}`,
      `Tipo intervento: ${typeLabel}`,
      `Priorità: ${task.priority.toUpperCase()}`,
      `Costo stimato: €${task.estimatedCostEur}`,
    ];

    if (task.notes) {
      descParts.push(`Note: ${task.notes}`);
    }
    if (task.checklist && task.checklist.length > 0) {
      descParts.push("Checklist:\n- " + task.checklist.join("\n- "));
    }

    const description = escapeIcsText(descParts.join("\n"));

    let icsPriority = 5;
    if (task.priority === "critical") icsPriority = 1;
    else if (task.priority === "high") icsPriority = 3;
    else if (task.priority === "low") icsPriority = 9;

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${nowStamp}`);
    lines.push(`DTSTART;VALUE=DATE:${startStr}`);
    lines.push(`DTEND;VALUE=DATE:${endStr}`);
    lines.push(`SUMMARY:${escapeIcsText(summary)}`);
    lines.push(`DESCRIPTION:${description}`);
    lines.push(`CATEGORIES:HOMEOS,MAINTENANCE,${task.priority.toUpperCase()}`);
    lines.push(`PRIORITY:${icsPriority}`);

    // Alarm reminder 7 days prior
    lines.push("BEGIN:VALARM");
    lines.push("ACTION:DISPLAY");
    lines.push(`DESCRIPTION:${escapeIcsText(`Promemoria: ${summary} in scadenza tra 7 giorni`)}`);
    lines.push("TRIGGER:-P7D");
    lines.push("END:VALARM");

    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
