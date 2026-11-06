// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo <fbxmano@gmail.com> (MRJonam91)

import test from "node:test";
import assert from "node:assert/strict";
import {
  evaluateMaintenanceTask,
  getMaintenanceSchedule,
  computeScheduledTasksCost,
  recordMaintenanceCompletion,
} from "../src/core/maintenance.ts";
import type { Item, Room, MaintenanceTask } from "../src/core/types.ts";

test("maintenance: identifies overdue vs upcoming tasks", () => {
  const refDate = "2026-11-01";
  const roomsMap = new Map<string, Room>([
    ["r1", { id: "r1", propertyId: "p1", name: "Cucina", category: "kitchen" }],
  ]);

  const overdueTask: MaintenanceTask = {
    id: "t-overdue",
    title: "Pulizia filtro",
    frequencyMonths: 6,
    nextDueDate: "2026-10-15",
    priority: "high",
    estimatedCostEur: 20,
    diyFriendly: true,
  };

  const item: Item = {
    id: "item1",
    roomId: "r1",
    name: "Cappa aspirante",
    category: "appliance",
    documents: [],
    maintenanceTasks: [overdueTask],
    maintenanceLogs: [],
  };

  const evalTask = evaluateMaintenanceTask(overdueTask, item, roomsMap, refDate);
  assert.equal(evalTask.isOverdue, true);
  assert.ok(evalTask.daysUntilDue < 0);
  assert.equal(evalTask.daysUntilDue, -17);
});

test("maintenance: filters horizon and computes cost breakdown", () => {
  const refDate = "2026-11-01";
  const rooms: Room[] = [
    { id: "r1", propertyId: "p1", name: "Cucina", category: "kitchen" },
  ];

  const items: Item[] = [
    {
      id: "i1",
      roomId: "r1",
      name: "Caldaia",
      category: "hvac",
      documents: [],
      maintenanceTasks: [
        {
          id: "t1",
          title: "Revisione Fumi",
          frequencyMonths: 24,
          nextDueDate: "2026-11-20", // 19 days -> within 60 days
          priority: "critical",
          estimatedCostEur: 120,
          diyFriendly: false,
        },
        {
          id: "t2",
          title: "Controllo pressione",
          frequencyMonths: 1,
          nextDueDate: "2026-11-05", // 4 days -> within 60 days
          priority: "low",
          estimatedCostEur: 0,
          diyFriendly: true,
        },
        {
          id: "t3",
          title: "Sostituzione pompa",
          frequencyMonths: 60,
          nextDueDate: "2028-01-01", // beyond 60 days
          priority: "low",
          estimatedCostEur: 300,
          diyFriendly: false,
        },
      ],
      maintenanceLogs: [],
    },
  ];

  const schedule = getMaintenanceSchedule(items, rooms, 60, refDate);
  assert.equal(schedule.length, 2); // t2 and t1

  const costs = computeScheduledTasksCost(schedule);
  assert.equal(costs.totalEstimatedCostEur, 120);
  assert.equal(costs.contractorEstimatedCostEur, 120);
  assert.equal(costs.diyEstimatedCostEur, 0);
});

test("maintenance: records completion, recalculates next due date and logs history", () => {
  const item: Item = {
    id: "i1",
    roomId: "r1",
    name: "Bollitore",
    category: "plumbing",
    documents: [],
    maintenanceTasks: [
      {
        id: "t-anode",
        title: "Sostituzione anodo",
        frequencyMonths: 24,
        nextDueDate: "2026-05-01",
        priority: "high",
        estimatedCostEur: 130,
        diyFriendly: false,
      },
    ],
    maintenanceLogs: [],
  };

  const { updatedItem, createdLog } = recordMaintenanceCompletion(item, "t-anode", {
    performedDate: "2026-05-10",
    costEur: 125,
    contractorOrDiy: "Idraulico Mario Rossi",
    invoiceRef: "FATT-102",
    notes: "Anodo sostituito con successo, tenuta guarnizione ok.",
  });

  assert.equal(updatedItem.maintenanceLogs.length, 1);
  assert.equal(updatedItem.maintenanceLogs[0]?.costEur, 125);
  assert.equal(updatedItem.maintenanceLogs[0]?.invoiceRef, "FATT-102");
  assert.equal(updatedItem.maintenanceTasks[0]?.lastPerformedDate, "2026-05-10");
  assert.equal(updatedItem.maintenanceTasks[0]?.nextDueDate, "2028-05-10");
  assert.equal(createdLog.contractorOrDiy, "Idraulico Mario Rossi");
});
