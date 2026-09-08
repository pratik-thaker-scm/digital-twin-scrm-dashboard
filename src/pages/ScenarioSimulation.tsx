import { useMemo, useState } from 'react'
import { Play, RotateCcw, TrendingDown, TrendingUp } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import StatusPill from '../components/StatusPill'
import { suppliers, suppliersById } from '../data/network'
import { defaultScenario, runSimulation, compareMitigationOptions, MITIGATION_OPTIONS } from '../simulation/engine'
import { formatEur } from '../calculations/kpi'
import type { DisruptionScenario, DisruptionType } from '../models/types'

const DISRUPTION_TYPES: DisruptionType[] = ['Plant Outage', 'Natural Disaster', 'Cyber Incident', 'Geopolitical Conflict', 'Insolvency', 'Logistics Disruption', 'Quality Recall']

const candidateSuppliers = suppliers.filter((s) => s.tier === 'Tier-2' || s.tier === 'Tier-3').sort((a, b) => b.rei - a.rei)

export default function ScenarioSimulation() {
  const [scenario, setScenario] = useState<DisruptionScenario>(defaultScenario('T3-07'))
  const [selectedMitigationIds, setSelectedMitigationIds] = useState<string[]>([])
  const [hasRun, setHasRun] = useState(false)

  const supplier = suppliersById[scenario.supplierId]
  const selectedMitigations = MITIGATION_OPTIONS.filter((m) => selectedMitigationIds.includes(m.id))
  const result = useMemo(() => runSimulation(scenario, selectedMitigations), [scenario, selectedMitigationIds])
  const comparison = useMemo(() => compareMitigationOptions(scenario), [scenario])

  const update = <K extends keyof DisruptionScenario>(key: K, value: DisruptionScenario[K]) =>
    setScenario((s) => ({ ...s, [key]: value }))

  const toggleMitigation = (id: string) =>
    setSelectedMitigationIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]))

  const reset = () => { setScenario(defaultScenario('T3-07')); setSelectedMitigationIds([]); setHasRun(false) }

  return (
    <div>
      <PageHeader
        title="What-If Scenario Simulation"
        subtitle="Digital stress test — Kapitel 5.5 Szenario-Simulation"
        actions={<button onClick={reset} className="flex items-center gap-1 text-[11.5px] font-semibold px-2.5 py-1.5 rounded border" style={{ borderColor: 'var(--border)' }}><RotateCcw size={12} /> Reset</button>}
      />
      <div className="p-6 grid grid-cols-[340px_1fr] gap-5">
        <div className="space-y-4">
          <div className="panel p-4">
            <h2 className="text-[12.5px] font-bold mb-3">Disruption Scenario</h2>
            <FieldLabel label="Supplier">
              <select value={scenario.supplierId} onChange={(e) => update('supplierId', e.target.value)} className="w-full text-[12px] py-1.5 px-2 rounded border" style={{ borderColor: 'var(--border)' }}>
                {candidateSuppliers.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.tier})</option>)}
              </select>
            </FieldLabel>
            <FieldLabel label="Disruption Type">
              <select value={scenario.disruptionType} onChange={(e) => update('disruptionType', e.target.value as DisruptionType)} className="w-full text-[12px] py-1.5 px-2 rounded border" style={{ borderColor: 'var(--border)' }}>
                {DISRUPTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </FieldLabel>
            <Slider label="Disruption Duration" value={scenario.durationWeeks} min={1} max={16} unit="weeks" onChange={(v) => update('durationWeeks', v)} />
            <Slider label="Capacity Reduction" value={scenario.capacityReductionPct} min={0} max={100} unit="%" onChange={(v) => update('capacityReductionPct', v)} />
            <Slider label="Transportation Delay" value={scenario.transportDelayDays} min={0} max={30} unit="days" onChange={(v) => update('transportDelayDays', v)} />
            <Slider label="Inventory Reduction" value={scenario.inventoryReductionPct} min={0} max={100} unit="%" onChange={(v) => update('inventoryReductionPct', v)} />
            <Slider label="Demand Increase" value={scenario.demandIncreasePct} min={0} max={50} unit="%" onChange={(v) => update('demandIncreasePct', v)} />
          </div>

          <div className="panel p-4">
            <h2 className="text-[12.5px] font-bold mb-3">Mitigation Controls</h2>
            <div className="space-y-2">
              {MITIGATION_OPTIONS.map((m) => (
                <label key={m.id} className="flex items-start gap-2 text-[11.5px] cursor-pointer">
                  <input type="checkbox" checked={selectedMitigationIds.includes(m.id)} onChange={() => toggleMitigation(m.id)} className="mt-0.5" />
                  <span>
                    <span className="font-semibold">{m.label}</span>
                    <span className="block" style={{ color: 'var(--text-muted)' }}>
                      {m.safetyStockDaysAdded > 0 && `+${m.safetyStockDaysAdded}d stock `}
                      {m.ttrReductionDays > 0 && `-${m.ttrReductionDays}d TTR `}
                      · {m.implementationTimeDays}d to implement · {formatEur(m.implementationCostEur)}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={() => setHasRun(true)}
            className="w-full flex items-center justify-center gap-2 text-[13px] font-bold py-2.5 rounded text-white"
            style={{ background: 'var(--accent)' }}
          >
            <Play size={14} /> Run Digital Twin Simulation
          </button>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <SnapshotCard title="BEFORE" scenario={scenario} snapshot={result.before} tone="critical" />
            {hasRun && selectedMitigations.length > 0 && result.after ? (
              <SnapshotCard title="AFTER MITIGATION" scenario={scenario} snapshot={result.after} tone={result.after.resilient ? 'healthy' : 'warning'} />
            ) : (
              <div className="panel p-4 flex items-center justify-center text-center text-[12px]" style={{ color: 'var(--text-muted)' }}>
                Select one or more mitigation controls and click "Run Digital Twin Simulation" to see the AFTER comparison.
              </div>
            )}
          </div>

          {hasRun && selectedMitigations.length > 0 && result.after && (
            <div className="panel p-4" style={{ borderLeft: `3px solid ${result.reiReductionEur >= 0 ? 'var(--healthy)' : 'var(--critical)'}` }}>
              <div className="flex items-center gap-2">
                {result.reiReductionEur >= 0 ? <TrendingDown size={16} style={{ color: 'var(--healthy)' }} /> : <TrendingUp size={16} style={{ color: 'var(--critical)' }} />}
                <span className="text-[13px] font-bold">REI Reduction: {formatEur(result.reiReductionEur)}</span>
                <span className="text-[11.5px]" style={{ color: 'var(--text-muted)' }}>
                  ({supplier.name}, {scenario.durationWeeks}-week {scenario.disruptionType.toLowerCase()})
                </span>
              </div>
            </div>
          )}

          <div className="panel p-4">
            <h2 className="text-[12.5px] font-bold mb-1">Mitigation Comparison</h2>
            <p className="text-[11px] mb-3" style={{ color: 'var(--text-muted)' }}>Ranked by REI reduction per euro of implementation cost, for the current scenario.</p>
            <table className="w-full text-[11.5px]">
              <thead>
                <tr className="text-left border-b" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                  <th className="py-1.5">Rank</th><th>Option</th><th>TTS</th><th>TTR</th><th>REI</th><th>REI Reduction</th><th>Risk ↓</th><th>Impl. Time</th><th>Cost</th><th>Residual</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row, i) => (
                  <tr key={row.option.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                    <td className="py-1.5 font-bold">#{i + 1}</td>
                    <td className="font-medium">{row.option.label}</td>
                    <td className="font-mono">{row.after.tts.toFixed(1)}d</td>
                    <td className="font-mono">{row.after.ttr.toFixed(1)}d</td>
                    <td className="font-mono">{formatEur(row.after.rei)}</td>
                    <td className="font-mono" style={{ color: 'var(--healthy)' }}>{formatEur(row.reiReduction)}</td>
                    <td className="font-mono">{row.riskReductionPct}%</td>
                    <td>{row.option.implementationTimeDays}d</td>
                    <td>{formatEur(row.option.implementationCostEur)}</td>
                    <td><StatusPill level={row.after.riskLevel} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-[11.5px] mt-3 p-2.5 rounded" style={{ background: 'var(--surface-alt)' }}>
              <strong>#{1} {comparison[0].option.label}</strong> ranks highest: it delivers the largest REI reduction relative to implementation cost
              {comparison[0].after.resilient ? ', and restores the TTS ≥ TTR resilience condition' : ''}, within {comparison[0].option.implementationTimeDays} days.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function SnapshotCard({ title, scenario, snapshot, tone }: { title: string; scenario: DisruptionScenario; snapshot: ReturnType<typeof runSimulation>['before']; tone: 'critical' | 'warning' | 'healthy' }) {
  return (
    <div className="panel p-4" style={{ borderLeft: `3px solid var(--${tone})` }}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[12.5px] font-bold">{title}</h3>
        <StatusPill level={snapshot.riskLevel} />
      </div>
      <div className="grid grid-cols-2 gap-2 text-[12px]">
        <Metric label="TTS" value={`${snapshot.tts.toFixed(1)}d`} />
        <Metric label="TTR" value={`${snapshot.ttr.toFixed(1)}d`} />
        <Metric label="REI" value={formatEur(snapshot.rei)} />
        <Metric label="Condition" value={snapshot.resilient ? 'TTS ≥ TTR' : 'TTS < TTR'} />
        <Metric label="Expected Interruption" value={snapshot.expectedInterruptionDate ?? '—'} />
        <Metric label="Status" value={snapshot.resilient ? 'RESILIENT' : 'CRITICAL'} />
      </div>
      <div className="mt-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>
        Affects {snapshot.affectedTier2.length} Tier-2 · {snapshot.affectedTier1.length} Tier-1 supplier(s){snapshot.affectedTier2.length + snapshot.affectedTier1.length > 0 ? ', ' + (scenario.durationWeeks) + '-week outage' : ''}
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[9.5px] uppercase font-semibold" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="font-mono font-semibold">{value}</div>
    </div>
  )
}

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <div className="text-[10.5px] font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>{label}</div>
      {children}
    </div>
  )
}

function Slider({ label, value, min, max, unit, onChange }: { label: string; value: number; min: number; max: number; unit: string; onChange: (v: number) => void }) {
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between text-[10.5px] font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
        <span>{label}</span><span className="font-mono">{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full" />
    </div>
  )
}
