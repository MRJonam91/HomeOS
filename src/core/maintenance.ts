// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo <fbxmano@gmail.com> (MRJonam91)

import { addMonthsToIsoDate, computeDaysDifference } from "./warranty.ts";
import type { Item, MaintenanceLog, MaintenanceTask, Room, ScheduledTaskEvaluation } from "./types.ts";

export function evaluateMaintenanceTask(
  task: MaintenanceTask,
  item: Item,
  roomsMap: Map<string, Room>,
  referenceDate: string = new Date().toISOString().split("T")[0] ?? ""
): ScheduledTaskEvaluation {
  const room = roomsMap.get(item.roomId);
  const roomName = room ? room.name : "Unknown Room";
  const daysUntilDue = computeDaysDifference(referenceDate, task.nextDueDate);
  const isOverdue = daysUntilDue < 0;

  return {
    itemId: item.id,
    itemName: item.name,
    roomName,
    task,
    isOverdue,
    daysUntilDue,
  };
}

export function getMaintenanceSchedule(
  items: Item[],
  rooms: Room[],
  horizonDays: number = 60,
  referenceDate: string = new Date().toISOString().split("T")[0] ?? ""
): ScheduledTaskEvaluation[] {
  const roomsMap = new Map(rooms.map((r) => [r.id, r]));
  const evaluations: ScheduledTaskEvaluation[] = [];

  for (const item of items) {
    for (const task of item.maintenanceTasks) {
      const evaluation = evaluateMaintenanceTask(task, item, roomsMap, referenceDate);
      // Include overdue tasks and tasks due within the horizon window
      if (evaluation.daysUntilDue <= horizonDays) {
        evaluations.push(evaluation);
      }
    }
  }

  // Sort: overdue tasks first (most overdue first), then upcoming ascending
  return evaluations.sort((a, b) => a.daysUntilDue - b.daysUntilDue);
}

export function computeScheduledTasksCost(tasks: ScheduledTaskEvaluation[]): {
  totalEstimatedCostEur: number;
  diyEstimatedCostEur: number;
  contractorEstimatedCostEur: number;
} {
  let total = 0;
  let diy = 0;
  let contractor = 0;

  for (const t of tasks) {
    const cost = t.task.estimatedCostEur || 0;
    total += cost;
    if (t.task.diyFriendly) {
      diy += cost;
    } else {
      contractor += cost;
    }
  }

  return {
    totalEstimatedCostEur: Math.round(total * 100) / 100,
    diyEstimatedCostEur: Math.round(diy * 100) / 100,
    contractorEstimatedCostEur: Math.round(contractor * 100) / 100,
  };
}

export function recordMaintenanceCompletion(
  item: Item,
  taskId: string,
  logDetails: {
    performedDate: string;
    costEur: number;
    contractorOrDiy: string;
    invoiceRef?: string;
    notes?: string;
  }
): { updatedItem: Item; createdLog: MaintenanceLog } {
  const taskIndex = item.maintenanceTasks.findIndex((t) => t.id === taskId);
  if (taskIndex === -1) {
    throw new Error(`Maintenance task '${taskId}' not found on item '${item.name}' (${item.id})`);
  }

  const existingTask = item.maintenanceTasks[taskIndex]!;
  const nextDueDate = addMonthsToIsoDate(logDetails.performedDate, existingTask.frequencyMonths);

  const updatedTask: MaintenanceTask = {
    ...existingTask,
    lastPerformedDate: logDetails.performedDate,
    nextDueDate,
  };

  const createdLog: MaintenanceLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    taskId,
    performedDate: logDetails.performedDate,
    costEur: logDetails.costEur,
    contractorOrDiy: logDetails.contractorOrDiy,
    invoiceRef: logDetails.invoiceRef,
    notes: logDetails.notes,
  };

  const newTasks = [...item.maintenanceTasks];
  newTasks[taskIndex] = updatedTask;

  const updatedItem: Item = {
    ...item,
    maintenanceTasks: newTasks,
    maintenanceLogs: [...item.maintenanceLogs, createdLog],
  };

  return { updatedItem, createdLog };
}
