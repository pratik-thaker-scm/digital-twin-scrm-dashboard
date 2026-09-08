import type {
  DisruptionScenario,
  MitigationOption,
  SimulationKpiSnapshot,
  SimulationResult,
} from '../models/types'
import { suppliersById, downstreamClosure } from '../data/network'
import { calculateREI, calculateTTS, classifyRisk, isResilient } from '../calculations/kpi'

// Rule-based Digital Twin scenario / stress-test model (thesis Kapitel 5.5).
// All figures are derived from the scenario inputs and the underlying supplier
// record — nothing here is a hardcoded UI number.

export const MITIGATION_OPTIONS: MitigationOption[] = [
  {
    id: 'A', label: 'Increase Safety Stock', levers: ['safetyStock'],
    safetyStockDaysAdded: 21, ttrReductionDays: 0, implementationTimeDays: 10, implementationCostEur: 550000,
  },
  {
    id: 'B', label: 'Activate Secondary Supplier', levers: ['backupSupplier'],
    safetyStockDaysAdded: 0, ttrReductionDays: 28, implementationTimeDays: 18, implementationCostEur: 750000,
  },
  {
    id: 'C', label: 'Safety Stock + Secondary Supplier (Dual Sourcing)', levers: ['safetyStock', 'backupSupplier', 'dualSourcing'],
    safetyStockDaysAdded: 24, ttrReductionDays: 34, implementationTimeDays: 20, implementationCostEur: 1050000,
  },
  {
    id: 'D', label: 'Alternative Logistics Route', levers: ['altTransport'],
    safetyStockDaysAdded: 0, ttrReductionDays: 10, implementationTimeDays: 5, implementationCostEur: 180000,
  },
]

export function defaultScenario(supplierId: string): DisruptionScenario {
  return {
    supplierId,
    disruptionType: 'Plant Outage',
    durationWeeks: 6,
    capacityReductionPct: 100,
    transportDelayDays: 5,
    inventoryReductionPct: 20,
    demandIncreasePct: 0,
  }
}

function affectedTiers(supplierId: string) {
  const closure = downstreamClosure(supplierId)
  const t2 = closure.filter((id) => suppliersById[id]?.tier === 'Tier-2')
  const t1 = closure.filter((id) => suppliersById[id]?.tier === 'Tier-1')
  const oem = closure.filter((id) => suppliersById[id]?.tier === 'OEM')
  return { t2, t1, oem }
}

export function simulateDisruption(scenario: DisruptionScenario): SimulationKpiSnapshot {
  const supplier = suppliersById[scenario.supplierId]
  const { t2, t1, oem } = affectedTiers(scenario.supplierId)

  const effectiveOnHand = supplier.onHandInventory * (1 - scenario.inventoryReductionPct / 100) * (1 - scenario.capacityReductionPct / 200)
  const effectivePipeline = supplier.pipelineInventory * (1 - scenario.inventoryReductionPct / 100)
  const effectiveConsumption = supplier.dailyConsumption * (1 + scenario.demandIncreasePct / 100)

  const tts = calculateTTS(Math.max(0, effectiveOnHand), Math.max(0, effectivePipeline), effectiveConsumption)

  const ttrRaw = supplier.recoveryTimeDays * (0.5 + scenario.capacityReductionPct / 200) + scenario.transportDelayDays
  const ttr = Math.max(scenario.durationWeeks * 7, ttrRaw)

  const financialImpactPerDay = supplier.financialImpactPerDay * (1 + scenario.demandIncreasePct / 200)
  const rei = calculateREI(ttr, financialImpactPerDay)

  const interruptionDate = new Date()
  interruptionDate.setDate(interruptionDate.getDate() + Math.floor(tts))

  return {
    tts, ttr, rei,
    resilient: isResilient(tts, ttr),
    riskLevel: classifyRisk(tts, ttr),
    expectedInterruptionDate: isFinite(tts) ? interruptionDate.toISOString().slice(0, 10) : null,
    affectedTier2: t2, affectedTier1: t1,
    oemImpactUnits: oem.length > 0 ? Math.round(financialImpactPerDay > 0 ? (rei / financialImpactPerDay) * (suppliersById['OEM-1']?.dailyConsumption ?? 0) : 0) : 0,
    financialImpactEur: rei,
  }
}

export function applyMitigations(
  scenario: DisruptionScenario,
  before: SimulationKpiSnapshot,
  mitigations: MitigationOption[]
): SimulationKpiSnapshot {
  const supplier = suppliersById[scenario.supplierId]
  const { t2, t1 } = affectedTiers(scenario.supplierId)

  const totalSafetyStockDays = mitigations.reduce((s, m) => s + m.safetyStockDaysAdded, 0)
  const totalTtrReduction = mitigations.reduce((s, m) => s + m.ttrReductionDays, 0)
  const hasAltTransport = mitigations.some((m) => m.levers.includes('altTransport'))

  const tts = before.tts + totalSafetyStockDays

  const transportDelay = hasAltTransport ? scenario.transportDelayDays * 0.4 : scenario.transportDelayDays
  const ttrRaw = supplier.recoveryTimeDays * (0.5 + scenario.capacityReductionPct / 200) + transportDelay - totalTtrReduction
  const ttr = Math.max(3, Math.min(before.ttr, Math.max(scenario.durationWeeks * 7 * 0.5, ttrRaw)))

  const financialImpactPerDay = supplier.financialImpactPerDay * (1 + scenario.demandIncreasePct / 200)
  const rei = calculateREI(ttr, financialImpactPerDay)

  const interruptionDate = new Date()
  interruptionDate.setDate(interruptionDate.getDate() + Math.floor(tts))

  return {
    tts, ttr, rei,
    resilient: isResilient(tts, ttr),
    riskLevel: classifyRisk(tts, ttr),
    expectedInterruptionDate: isFinite(tts) ? interruptionDate.toISOString().slice(0, 10) : null,
    affectedTier2: t2, affectedTier1: t1,
    oemImpactUnits: Math.round(before.oemImpactUnits * (rei / Math.max(1, before.financialImpactEur))),
    financialImpactEur: rei,
  }
}

export function runSimulation(scenario: DisruptionScenario, mitigations: MitigationOption[]): SimulationResult {
  const before = simulateDisruption(scenario)
  const after = mitigations.length > 0 ? applyMitigations(scenario, before, mitigations) : null
  return {
    scenario,
    before,
    after,
    appliedMitigations: mitigations,
    reiReductionEur: after ? before.rei - after.rei : 0,
  }
}

export function compareMitigationOptions(scenario: DisruptionScenario) {
  const before = simulateDisruption(scenario)
  return MITIGATION_OPTIONS.map((option) => {
    const after = applyMitigations(scenario, before, [option])
    return {
      option,
      before,
      after,
      reiReduction: before.rei - after.rei,
      riskReductionPct: Math.round(((before.rei - after.rei) / Math.max(1, before.rei)) * 100),
    }
  }).sort((a, b) => b.reiReduction / (a.option.implementationCostEur || 1) - a.reiReduction / (b.option.implementationCostEur || 1))
}
