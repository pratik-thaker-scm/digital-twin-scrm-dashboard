import type { AlertSeverity, RiskAlert } from '../models/types'
import { suppliers, suppliersById, downstreamClosure } from './network'
import { formatEur } from '../calculations/kpi'

function severityFor(tts: number, ttr: number, rei: number): AlertSeverity {
  if (tts < ttr && rei > 5_000_000) return 'Critical'
  if (tts < ttr) return 'High'
  if (tts <= ttr * 1.25) return 'Medium'
  return 'Low'
}

function downstreamNames(id: string): string[] {
  return downstreamClosure(id)
    .map((n) => suppliersById[n]?.name)
    .filter(Boolean) as string[]
}

const generated: RiskAlert[] = suppliers
  .filter((s) => s.riskLevel !== 'healthy')
  .map((s) => {
    const severity = severityFor(s.tts, s.ttr, s.rei)
    const downstream = downstreamNames(s.id)
    const trigger = s.tts < s.ttr ? 'TTS < TTR' : 'TTS approaching TTR'
    return {
      id: `AL-${s.id}`,
      supplierId: s.id,
      severity,
      trigger,
      what: s.tts < s.ttr
        ? `Time-to-Survive (${s.tts.toFixed(1)}d) has fallen below Time-to-Recovery (${s.ttr.toFixed(1)}d).`
        : `Time-to-Survive (${s.tts.toFixed(1)}d) is converging on Time-to-Recovery (${s.ttr.toFixed(1)}d) — resilience buffer eroding.`,
      where: `${s.city}, ${s.country}`,
      tier: s.tier,
      component: s.component,
      why: s.notes ?? `Inventory + pipeline buffer of ${(s.onHandInventory + s.pipelineInventory).toLocaleString()} units against daily consumption of ${s.dailyConsumption.toLocaleString()} units yields a shrinking survival window relative to this node's ${s.ttr.toFixed(0)}-day recovery time.`,
      downstreamAffected: downstream,
      oemImpact: downstream.includes('Vantoria Motors AG')
        ? `Direct exposure to OEM final assembly — potential line stoppage if unresolved before day ${Math.ceil(s.tts)}.`
        : `Indirect exposure via ${downstream.length} downstream node(s); OEM impact depends on buffer at intermediate tiers.`,
      tts: s.tts,
      ttr: s.ttr,
      rei: s.rei,
      recommendedAction: s.tts < s.ttr
        ? `Activate alternative source / dual sourcing for ${s.component} and increase safety stock to close the ${(s.ttr - s.tts).toFixed(1)}-day gap (REI exposure ${formatEur(s.rei)}).`
        : `Pre-qualify a backup source and add safety-stock coverage before the TTS/TTR margin closes further.`,
      detectedDate: new Date().toISOString().slice(0, 10),
      acknowledged: false,
    } satisfies RiskAlert
  })

// Curated external / weak-signal alerts that broaden trigger-type coverage
// beyond pure inventory-threshold breaches (Kapitel 5.4 — external risk feeds).
const curated: RiskAlert[] = [
  {
    id: 'AL-EXT-01', supplierId: 'T3-15', severity: 'High', trigger: 'Geopolitical disruption',
    what: 'Export licensing tightening reported for rare-earth magnet shipments from the Baotou region.',
    where: 'Baotou, China', tier: 'Tier-3', component: 'Rare-Earth Materials',
    why: 'External risk-intelligence feed flags new export control measures affecting rare-earth magnet exports; TerraRare Magnetics is single-sourced for two downstream Tier-2 paths.',
    downstreamAffected: downstreamNames('T3-15'),
    oemImpact: 'Potential ADAS sensor and motor component shortfall within 4-6 weeks if licensing delays materialize.',
    tts: suppliersById['T3-15'].tts, ttr: suppliersById['T3-15'].ttr, rei: suppliersById['T3-15'].rei,
    recommendedAction: 'Initiate regional sourcing qualification outside the affected export region; expedite existing pipeline shipments.',
    detectedDate: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10), acknowledged: false,
  },
  {
    id: 'AL-EXT-02', supplierId: 'T3-07', severity: 'Critical', trigger: 'Geopolitical disruption',
    what: 'Regional political tension near Tainan flagged by external risk-intelligence feed as a potential trade-route disruption.',
    where: 'Tainan, Taiwan', tier: 'Tier-3', component: 'Semiconductor',
    why: 'Apex Wafer Foundry is the sole qualified wafer source for two Tier-2 paths (ECU and ADAS sensor chips) — a single event here fans out to two Tier-1 suppliers and the OEM.',
    downstreamAffected: downstreamNames('T3-07'),
    oemImpact: 'Highest REI node in the network; unresolved disruption propagates to ECU and ADAS lines within the fab requalification window.',
    tts: suppliersById['T3-07'].tts, ttr: suppliersById['T3-07'].ttr, rei: suppliersById['T3-07'].rei,
    recommendedAction: 'Run scenario simulation immediately and pre-approve dual-sourcing budget for wafer capacity.',
    detectedDate: new Date(Date.now() - 1 * 86400000).toISOString().slice(0, 10), acknowledged: false,
  },
  {
    id: 'AL-EXT-03', supplierId: 'T2-07', severity: 'Medium', trigger: 'Weather disruption',
    what: 'Typhoon warning issued for the South Korean west coast, affecting port operations near Cheonan.',
    where: 'Cheonan, South Korea', tier: 'Tier-2', component: 'Battery Cell',
    why: 'Weather feed indicates a 3-5 day port closure risk; PowerCell Modules ships cell modules through the affected port.',
    downstreamAffected: downstreamNames('T2-07'),
    oemImpact: 'Minor schedule slip expected if resolved within the forecast window; escalates if closure exceeds 5 days.',
    tts: suppliersById['T2-07'].tts, ttr: suppliersById['T2-07'].ttr, rei: suppliersById['T2-07'].rei,
    recommendedAction: 'Monitor port status; pre-position air-freight contingency for critical cell shipments.',
    detectedDate: new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10), acknowledged: false,
  },
  {
    id: 'AL-EXT-04', supplierId: 'T2-04', severity: 'Medium', trigger: 'Shipment delay',
    what: 'Three consecutive inbound shipments from ConnectPro Systems arrived 6-9 days late.',
    where: 'Nitra, Slovakia', tier: 'Tier-2', component: 'Connectors',
    why: 'On-time delivery has dropped to 87% over the trailing 30 days; lead time trending toward the 25-day recovery-time threshold.',
    downstreamAffected: downstreamNames('T2-04'),
    oemImpact: 'Wiring harness assembly buffer at PolyWire Systems absorbs current delays; further slippage risks Tier-1 schedule.',
    tts: suppliersById['T2-04'].tts, ttr: suppliersById['T2-04'].ttr, rei: suppliersById['T2-04'].rei,
    recommendedAction: 'Engage supplier on root cause; activate alternate connector source (T2-03) as contingency.',
    detectedDate: new Date(Date.now() - 4 * 86400000).toISOString().slice(0, 10), acknowledged: false,
  },
  {
    id: 'AL-EXT-05', supplierId: 'T3-13', severity: 'Low', trigger: 'Quality deterioration',
    what: 'Incoming lithium concentrate batches show a mild purity variance outside the standard tolerance band.',
    where: 'Perth, Australia', tier: 'Tier-3', component: 'Battery Cell',
    why: 'Quality control feed reports a 0.4% increase in rejected batches over the last two weeks — early signal, not yet capacity-affecting.',
    downstreamAffected: downstreamNames('T3-13'),
    oemImpact: 'No immediate impact; monitored to prevent escalation into a cell-quality recall.',
    tts: suppliersById['T3-13'].tts, ttr: suppliersById['T3-13'].ttr, rei: suppliersById['T3-13'].rei,
    recommendedAction: 'Request supplier corrective-action report; increase incoming inspection sampling rate.',
    detectedDate: new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10), acknowledged: true,
  },
  {
    id: 'AL-EXT-06', supplierId: 'T2-01', severity: 'Medium', trigger: 'Cyber incident',
    what: 'Ransomware activity detected on a logistics partner network used by SilChip Packaging for shipment tracking.',
    where: 'Hsinchu, Taiwan', tier: 'Tier-2', component: 'Semiconductor',
    why: 'Third-party security feed reports a confirmed intrusion at a shared logistics provider; order-tracking visibility temporarily degraded.',
    downstreamAffected: downstreamNames('T2-01'),
    oemImpact: 'No production impact yet; visibility gap increases detection latency (ATTD) for any concurrent supply issue.',
    tts: suppliersById['T2-01'].tts, ttr: suppliersById['T2-01'].ttr, rei: suppliersById['T2-01'].rei,
    recommendedAction: 'Switch to manual shipment confirmation until logistics partner confirms remediation.',
    detectedDate: new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10), acknowledged: false,
  },
  {
    id: 'AL-EXT-07', supplierId: 'T3-03', severity: 'Medium', trigger: 'Supplier insolvency warning',
    what: 'Credit-rating feed downgraded PureCopper Refining\'s bond rating amid rising input costs.',
    where: 'Antofagasta, Chile', tier: 'Tier-3', component: 'Wiring Harness',
    why: 'External financial risk-intelligence flags deteriorating credit metrics as an early insolvency indicator for a single-region copper refiner.',
    downstreamAffected: downstreamNames('T3-03'),
    oemImpact: 'No near-term impact; flagged for financial-health monitoring and contingency-sourcing review.',
    tts: suppliersById['T3-03'].tts, ttr: suppliersById['T3-03'].ttr, rei: suppliersById['T3-03'].rei,
    recommendedAction: 'Open dialogue on supply continuity assurances; identify alternative copper refining sources.',
    detectedDate: new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10), acknowledged: false,
  },
  {
    id: 'AL-EXT-08', supplierId: 'T3-01', severity: 'Low', trigger: 'Transport-route interruption',
    what: 'Rail freight congestion reported on the Duisburg inland corridor used for steel forgings.',
    where: 'Duisburg, Germany', tier: 'Tier-3', component: 'Steel',
    why: 'Logistics feed reports a 2-day average delay increase on the affected rail corridor.',
    downstreamAffected: downstreamNames('T3-01'),
    oemImpact: 'Negligible at current buffer levels; watched in case congestion persists beyond 10 days.',
    tts: suppliersById['T3-01'].tts, ttr: suppliersById['T3-01'].ttr, rei: suppliersById['T3-01'].rei,
    recommendedAction: 'No action required; continue monitoring corridor status.',
    detectedDate: new Date(Date.now() - 8 * 86400000).toISOString().slice(0, 10), acknowledged: true,
  },
]

export const alerts: RiskAlert[] = [...generated, ...curated].sort((a, b) => b.rei - a.rei)

export const severityWeight: Record<AlertSeverity, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 }
