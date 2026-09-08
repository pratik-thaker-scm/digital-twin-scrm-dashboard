import type { Recommendation, SupplierWithKpis } from '../models/types'
import { MITIGATION_OPTIONS, defaultScenario, simulateDisruption, applyMitigations } from './engine'
import { formatEur } from '../calculations/kpi'

// Rule-Based Prescriptive Recommendation Engine (thesis Kapitel 5.4.2 "Prescriptive
// Engine" / Kapitel 5.6 decision model). Not a trained AI model — a transparent,
// auditable rule set over the simulated Digital Twin state.

export function recommendationFor(supplier: SupplierWithKpis): Recommendation | null {
  if (supplier.riskLevel === 'healthy') return null

  const scenario = defaultScenario(supplier.id)
  // Use the node's own current state (not a hypothetical disruption) as the
  // "before" baseline when it is already in a warning/critical condition.
  const before = { tts: supplier.tts, ttr: supplier.ttr, rei: supplier.rei, resilient: supplier.resilient, riskLevel: supplier.riskLevel, expectedInterruptionDate: null, affectedTier2: [], affectedTier1: [], oemImpactUnits: 0, financialImpactEur: supplier.rei }

  const candidates = MITIGATION_OPTIONS.map((option) => {
    const after = applyMitigations(scenario, before, [option])
    const score = (before.rei - after.rei) / Math.max(1, option.implementationCostEur) - (after.resilient ? 0 : 1_000_000_000)
    return { option, after, score }
  }).sort((a, b) => b.score - a.score)

  const best = candidates[0]
  const priority = supplier.riskLevel === 'critical' ? 'P1' : supplier.rei > 3_000_000 ? 'P2' : 'P3'
  const urgency = supplier.riskLevel === 'critical' ? 'Immediate' : supplier.rei > 3_000_000 ? 'This Week' : 'This Month'

  return {
    id: `REC-${supplier.id}`,
    title: `${best.option.label} for ${supplier.name} (${supplier.component})`,
    rationale: `${supplier.name} shows TTS ${supplier.tts.toFixed(1)}d vs TTR ${supplier.ttr.toFixed(1)}d (${supplier.resilient ? 'approaching threshold' : 'TTS < TTR'}), exposing REI of ${formatEur(supplier.rei)}. Among the four evaluated levers, "${best.option.label}" restores the largest REI reduction per euro invested and ${best.after.resilient ? 'restores TTS >= TTR' : 'reduces exposure even though the resilience threshold is not fully restored'}.`,
    ttsBefore: supplier.tts, ttsAfter: best.after.tts,
    ttrBefore: supplier.ttr, ttrAfter: best.after.ttr,
    reiBefore: supplier.rei, reiAfter: best.after.rei,
    estimatedCostEur: best.option.implementationCostEur,
    residualRiskLevel: best.after.riskLevel,
    priority, urgency,
  }
}

export function networkWideRecommendations(suppliers: SupplierWithKpis[]): Recommendation[] {
  return suppliers
    .map(recommendationFor)
    .filter((r): r is Recommendation => r !== null)
    .sort((a, b) => b.reiBefore - a.reiBefore)
}

export function simulateBestForScenario(supplierId: string) {
  const scenario = defaultScenario(supplierId)
  const before = simulateDisruption(scenario)
  const candidates = MITIGATION_OPTIONS.map((option) => ({
    option,
    after: applyMitigations(scenario, before, [option]),
  }))
  const best = candidates.reduce((a, b) => (b.after.rei < a.after.rei ? b : a))
  return { before, best }
}
