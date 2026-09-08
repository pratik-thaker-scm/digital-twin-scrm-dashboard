import type { KpiHistoryPoint } from '../models/types'
import { suppliers } from './network'

// Deterministic seeded PRNG (mulberry32) — history is computed once at module
// load with a fixed seed, so it never changes across refreshes/sessions.
function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const DAYS = 75
const HISTORY_START = new Date()
HISTORY_START.setDate(HISTORY_START.getDate() - (DAYS - 1))

function seedFor(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  return h || 1
}

// Suppliers whose history shows a deliberate deteriorating trend (tells a
// believable early-warning story rather than static noise around the mean).
const DETERIORATING = new Set(['T3-07', 'T3-15', 'T2-09', 'T2-04'])

function buildSeries(supplierId: string): KpiHistoryPoint[] {
  const supplier = suppliers.find((s) => s.id === supplierId)!
  const rng = mulberry32(seedFor(supplierId))
  const deteriorating = DETERIORATING.has(supplierId)
  const points: KpiHistoryPoint[] = []

  for (let d = 0; d < DAYS; d++) {
    const progress = d / (DAYS - 1) // 0..1
    const date = new Date(HISTORY_START)
    date.setDate(date.getDate() + d)

    const noise = (rng() - 0.5)
    const trend = deteriorating ? progress : 0.15 * Math.sin(progress * Math.PI * 2)

    const tts = Math.max(2, supplier.tts * (1.18 - 0.18 * trend) + noise * supplier.tts * 0.05)
    const ttr = Math.max(2, supplier.ttr * (0.9 + 0.1 * trend) + noise * supplier.ttr * 0.03)
    const rei = ttr * supplier.financialImpactPerDay
    const inventoryCoverageDays = Math.max(1, tts * (0.85 + noise * 0.1))
    const leadTimeDays = Math.max(1, supplier.leadTimeDays * (1 + (deteriorating ? progress * 0.35 : 0) + noise * 0.05))
    const onTimeDelivery = Math.min(99, Math.max(55, supplier.onTimeDelivery - (deteriorating ? progress * 10 : 0) + noise * 3))
    const capacityUtilization = Math.min(99, Math.max(40, supplier.capacityUtilization + noise * 4 - (deteriorating ? progress * 6 : 0)))
    const attdDays = Math.max(0.5, supplier.attdDays * (1 - progress * 0.25) + noise * 0.3)
    const reactionLeadTimeDays = Math.max(0.5, supplier.reactionLeadTimeDays * (1 - progress * 0.2) + noise * 0.4)

    points.push({
      date: date.toISOString().slice(0, 10),
      supplierId,
      tts: Math.round(tts * 10) / 10,
      ttr: Math.round(ttr * 10) / 10,
      rei: Math.round(rei),
      inventoryCoverageDays: Math.round(inventoryCoverageDays * 10) / 10,
      leadTimeDays: Math.round(leadTimeDays * 10) / 10,
      onTimeDelivery: Math.round(onTimeDelivery * 10) / 10,
      capacityUtilization: Math.round(capacityUtilization * 10) / 10,
      attdDays: Math.round(attdDays * 10) / 10,
      reactionLeadTimeDays: Math.round(reactionLeadTimeDays * 10) / 10,
    })
  }
  return points
}

export const kpiHistoryBySupplier: Record<string, KpiHistoryPoint[]> = Object.fromEntries(
  suppliers.map((s) => [s.id, buildSeries(s.id)])
)

export const allHistory: KpiHistoryPoint[] = suppliers.flatMap((s) => kpiHistoryBySupplier[s.id])

export function networkAggregateHistory(): { date: string; avgTts: number; avgTtr: number; maxRei: number; violations: number }[] {
  const byDate = new Map<string, KpiHistoryPoint[]>()
  for (const p of allHistory) {
    const arr = byDate.get(p.date) ?? []
    arr.push(p)
    byDate.set(p.date, arr)
  }
  return Array.from(byDate.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, points]) => ({
      date,
      avgTts: Math.round((points.reduce((s, p) => s + p.tts, 0) / points.length) * 10) / 10,
      avgTtr: Math.round((points.reduce((s, p) => s + p.ttr, 0) / points.length) * 10) / 10,
      maxRei: Math.max(...points.map((p) => p.rei)),
      violations: points.filter((p) => p.tts < p.ttr).length,
    }))
}
