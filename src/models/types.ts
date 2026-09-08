export type Tier = 'OEM' | 'Tier-1' | 'Tier-2' | 'Tier-3'

export type RiskLevel = 'healthy' | 'warning' | 'critical'

export type ComponentCategory =
  | 'Semiconductor'
  | 'Battery Cell'
  | 'Wiring Harness'
  | 'Electronic Control Unit'
  | 'Steel'
  | 'Aluminium'
  | 'Rare-Earth Materials'
  | 'Braking Components'
  | 'Sensors'
  | 'Plastics'
  | 'Electric Motor Components'
  | 'Charging Electronics'
  | 'PCB Assembly'
  | 'Connectors'
  | 'Friction Material'
  | 'OEM Assembly'

export interface SupplierNode {
  id: string
  name: string
  tier: Tier
  country: string
  city: string
  component: ComponentCategory
  capacity: number
  capacityUtilization: number // %
  onHandInventory: number // units
  pipelineInventory: number // units in transit, usable
  dailyConsumption: number // units/day
  leadTimeDays: number
  onTimeDelivery: number // %
  recoveryTimeDays: number // baseline recovery duration input for TTR model
  altSourceActivationDays: number // time to switch to alternative supplier
  financialImpactPerDay: number // EUR / day of outage
  alternativeSupplierIds: string[]
  spof: boolean
  attdDays: number // Average Time to Detection, days
  reactionLeadTimeDays: number
  notes?: string
}

export interface DerivedKpis {
  tts: number
  ttr: number
  rei: number
  riskLevel: RiskLevel
  resilient: boolean
}

export type SupplierWithKpis = SupplierNode & DerivedKpis

export interface SupplyEdge {
  id: string
  source: string
  target: string
  component: ComponentCategory
  criticality: 'high' | 'medium' | 'low'
}

export interface KpiHistoryPoint {
  date: string // YYYY-MM-DD
  supplierId: string
  tts: number
  ttr: number
  rei: number
  inventoryCoverageDays: number
  leadTimeDays: number
  onTimeDelivery: number
  capacityUtilization: number
  attdDays: number
  reactionLeadTimeDays: number
}

export type AlertSeverity = 'Critical' | 'High' | 'Medium' | 'Low'

export type AlertTriggerType =
  | 'TTS < TTR'
  | 'TTS approaching TTR'
  | 'Lead time increase'
  | 'Inventory below threshold'
  | 'Capacity decrease'
  | 'Shipment delay'
  | 'Plant outage'
  | 'Weather disruption'
  | 'Cyber incident'
  | 'Geopolitical disruption'
  | 'Supplier insolvency warning'
  | 'Quality deterioration'
  | 'Transport-route interruption'

export interface RiskAlert {
  id: string
  supplierId: string
  severity: AlertSeverity
  trigger: AlertTriggerType
  what: string
  where: string
  tier: Tier
  component: ComponentCategory
  why: string
  downstreamAffected: string[]
  oemImpact: string
  tts: number
  ttr: number
  rei: number
  recommendedAction: string
  detectedDate: string
  acknowledged: boolean
}

export type DisruptionType =
  | 'Plant Outage'
  | 'Natural Disaster'
  | 'Cyber Incident'
  | 'Geopolitical Conflict'
  | 'Insolvency'
  | 'Logistics Disruption'
  | 'Quality Recall'

export interface DisruptionScenario {
  supplierId: string
  disruptionType: DisruptionType
  durationWeeks: number
  capacityReductionPct: number
  transportDelayDays: number
  inventoryReductionPct: number
  demandIncreasePct: number
}

export type MitigationLever =
  | 'safetyStock'
  | 'backupSupplier'
  | 'dualSourcing'
  | 'altTransport'
  | 'shiftCapacity'
  | 'regionalSourcing'
  | 'pipelineInventory'

export interface MitigationOption {
  id: string
  label: string
  levers: MitigationLever[]
  safetyStockDaysAdded: number
  ttrReductionDays: number
  implementationTimeDays: number
  implementationCostEur: number
}

export interface SimulationKpiSnapshot {
  tts: number
  ttr: number
  rei: number
  resilient: boolean
  riskLevel: RiskLevel
  expectedInterruptionDate: string | null
  affectedTier2: string[]
  affectedTier1: string[]
  oemImpactUnits: number
  financialImpactEur: number
}

export interface SimulationResult {
  scenario: DisruptionScenario
  before: SimulationKpiSnapshot
  after: SimulationKpiSnapshot | null
  appliedMitigations: MitigationOption[]
  reiReductionEur: number
}

export interface Recommendation {
  id: string
  title: string
  rationale: string
  ttsBefore: number
  ttsAfter: number
  ttrBefore: number
  ttrAfter: number
  reiBefore: number
  reiAfter: number
  estimatedCostEur: number
  residualRiskLevel: RiskLevel
  priority: 'P1' | 'P2' | 'P3'
  urgency: 'Immediate' | 'This Week' | 'This Month'
}
