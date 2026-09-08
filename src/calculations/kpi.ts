import type { DerivedKpis, RiskLevel, SupplierNode } from '../models/types'

/**
 * Prototype implementations of the thesis KPI model (Kapitel 5.3, Tabelle 5.3).
 * TTS = (on-hand inventory + usable pipeline inventory) / daily consumption
 * TTR = recovery duration under optimal use of available recovery options
 *       (baseline recovery time, reduced by alternative-source activation speed)
 * REI = TTR_i * FI_i  (financial impact per day of the node's outage)
 * Resilience Rule: TTS >= TTR -> resilient; TTS < TTR -> critical supply gap
 */

export function calculateTTS(onHandInventory: number, pipelineInventory: number, dailyConsumption: number): number {
  if (dailyConsumption <= 0) return Infinity
  return (onHandInventory + pipelineInventory) / dailyConsumption
}

export function calculateTTR(recoveryTimeDays: number, altSourceActivationDays: number): number {
  // Optimal recovery = the faster of "restore own capacity" or "activate alternative source"
  return Math.min(recoveryTimeDays, altSourceActivationDays)
}

export function calculateREI(ttr: number, financialImpactPerDay: number): number {
  return ttr * financialImpactPerDay
}

export function classifyRisk(tts: number, ttr: number): RiskLevel {
  if (tts < ttr) return 'critical'
  if (tts <= ttr * 1.25) return 'warning'
  return 'healthy'
}

export function isResilient(tts: number, ttr: number): boolean {
  return tts >= ttr
}

export function deriveKpis(supplier: SupplierNode): DerivedKpis {
  const tts = calculateTTS(supplier.onHandInventory, supplier.pipelineInventory, supplier.dailyConsumption)
  const ttr = calculateTTR(supplier.recoveryTimeDays, supplier.altSourceActivationDays)
  const rei = calculateREI(ttr, supplier.financialImpactPerDay)
  const riskLevel = classifyRisk(tts, ttr)
  return { tts, ttr, rei, riskLevel, resilient: isResilient(tts, ttr) }
}

export function inventoryCoverageDays(onHandInventory: number, dailyConsumption: number): number {
  if (dailyConsumption <= 0) return Infinity
  return onHandInventory / dailyConsumption
}

export function formatDays(value: number): string {
  if (!isFinite(value)) return '—'
  return `${Math.round(value * 10) / 10}d`
}

export function formatEur(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `€${(value / 1_000_000).toFixed(1)}M`
  if (Math.abs(value) >= 1_000) return `€${(value / 1_000).toFixed(0)}k`
  return `€${value.toFixed(0)}`
}
