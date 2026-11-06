// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo <fbxmano@gmail.com> (MRJonam91)

export type RoomCategory =
  | "kitchen"
  | "bathroom"
  | "bedroom"
  | "living_room"
  | "utility_room"
  | "garage"
  | "outdoor"
  | "hallway"
  | "office"
  | "other";

export type ItemCategory =
  | "appliance"
  | "hvac"
  | "electrical"
  | "plumbing"
  | "furniture"
  | "electronics"
  | "safety"
  | "structural"
  | "tool"
  | "other";

export type WarrantyStatus = "active" | "expiring_soon" | "expired" | "lifetime" | "none";

export type TaskPriority = "low" | "medium" | "high" | "critical";

export type DocumentType =
  | "manual"
  | "receipt"
  | "warranty_card"
  | "inspection_certificate"
  | "invoice"
  | "schematic"
  | "other";

export interface DocumentRef {
  id: string;
  title: string;
  type: DocumentType;
  pathOrUrl: string;
  notes?: string;
  dateAdded: string; // YYYY-MM-DD
}

export interface Warranty {
  provider: string;
  coverageMonths: number;
  startDate: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  policyNumber?: string;
  documentRef?: string;
  supportContact?: string;
  notes?: string;
}

export interface MaintenanceTask {
  id: string;
  title: string;
  frequencyMonths: number;
  lastPerformedDate?: string; // YYYY-MM-DD
  nextDueDate: string;        // YYYY-MM-DD
  priority: TaskPriority;
  estimatedCostEur: number;
  diyFriendly: boolean;
  notes?: string;
  checklist?: string[];
}

export interface MaintenanceLog {
  id: string;
  taskId: string;
  performedDate: string; // YYYY-MM-DD
  costEur: number;
  contractorOrDiy: string;
  invoiceRef?: string;
  notes?: string;
}

export interface ConsumptionProfile {
  ratedPowerWatts?: number;
  standbyWatts?: number;
  energyClass?: string;
  estimatedAnnualKWh?: number;
}

export interface Item {
  id: string;
  roomId: string;
  name: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  category: ItemCategory;
  purchaseDate?: string; // YYYY-MM-DD
  purchasePrice?: number;
  currency?: string;
  estimatedReplacementValueEur?: number;
  warranty?: Warranty;
  documents: DocumentRef[];
  maintenanceTasks: MaintenanceTask[];
  maintenanceLogs: MaintenanceLog[];
  consumption?: ConsumptionProfile;
  tags?: string[];
  notes?: string;
}

export interface Room {
  id: string;
  propertyId: string;
  name: string;
  floor?: string;
  category: RoomCategory;
  notes?: string;
}

export interface Property {
  id: string;
  name: string;
  address?: string;
  cadastralData?: string;
  notes?: string;
  createdAt: string;
}

export interface HomeLedger {
  schemaVersion: string;
  generatedAt: string;
  property: Property;
  rooms: Room[];
  items: Item[];
}

export interface WarrantyEvaluation {
  itemId: string;
  itemName: string;
  roomName: string;
  provider: string;
  status: WarrantyStatus;
  startDate: string;
  endDate: string;
  daysRemaining: number;
  supportContact?: string;
}

export interface ScheduledTaskEvaluation {
  itemId: string;
  itemName: string;
  roomName: string;
  task: MaintenanceTask;
  isOverdue: boolean;
  daysUntilDue: number;
}

export interface AuditReport {
  timestamp: string;
  totalRooms: number;
  totalItems: number;
  totalEstimatedReplacementValueEur: number;
  observedFacts: Array<{
    category: "serial_number" | "receipt" | "manual" | "log";
    summary: string;
    itemId: string;
    verifiedAt: string;
  }>;
  estimatedIndicators: Array<{
    category: "power_consumption" | "replacement_cost" | "maintenance_forecast";
    summary: string;
    value: string;
    itemId?: string;
  }>;
  humanDecisionsRequired: Array<{
    category: "warranty_claim" | "overdue_maintenance" | "safety_inspection" | "missing_document";
    urgency: "high" | "medium" | "low";
    issue: string;
    recommendedAction: string;
    itemId?: string;
  }>;
}
