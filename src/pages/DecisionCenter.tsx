import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Radar, LineChart as LineChartIcon, FlaskConical, Rocket, ArrowRight, Cpu } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import StatusPill from '../components/StatusPill'
import { suppliers } from '../data/network'
import { networkWideRecommendations } from '../simulation/recommendation'
import { formatEur } from '../calculations/kpi'

const PHASES = [
  {
    icon: Radar, title: '1. Monitoring', goal: 'Continuous monitoring of weak signals and thresholds.',
    dtOutput: 'Real-time KPIs (inventory, lead times, capacity, TTS, TTR); ATTD; Tier-N status; alerts on significant deviation (e.g. lead time +50%).',
    actions: 'Daily risk reviews; data plausibility checks.',
  },
  {
    icon: LineChartIcon, title: '2. Prediction', goal: 'Assess potential risk and its financial impact.',
    dtOutput: 'AI anomaly detection; forecast of bottleneck timing; dynamic REI calculation; identification of critical nodes (TTR > TTS).',
    actions: 'Prioritize cases by highest REI; initiate escalation process.',
  },
  {
    icon: FlaskConical, title: '3. Simulation', goal: 'Test and optimize countermeasures in the virtual space.',
    dtOutput: 'What-if simulation of failures; quantification of TTR reduction achievable via different measures.',
    actions: 'Evaluate redundancies (e.g. secondary supplier); inventory adjustment; supplier relocation in simulation.',
  },
  {
    icon: Rocket, title: '4. Prescription & Reaction', goal: 'Implement the optimal, prioritized strategy in the physical world.',
    dtOutput: 'Decision support: proposes the most cost-efficient plan to restore TTS ≥ TTR.',
    actions: 'Activate backup suppliers; adjust orders; build additional safety stock.',
  },
]

export default function DecisionCenter() {
  const recs = networkWideRecommendations(suppliers)
  const [expanded, setExpanded] = useState<string | null>(recs[0]?.id ?? null)

  return (
    <div>
      <PageHeader title="Decision Center" subtitle="DT-supported proactive decision model — Kapitel 5.6 Tabelle 5.4" />
      <div className="p-6 space-y-6">
        <div className="panel p-5">
          <h2 className="text-[13px] font-bold mb-4">Four-Phase Decision Workflow</h2>
          <div className="grid grid-cols-4 gap-3 relative">
            {PHASES.map((p, i) => (
              <div key={p.title} className="flex items-center">
                <div className="panel p-3.5 flex-1" style={{ background: 'var(--surface-alt)' }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <p.icon size={16} style={{ color: 'var(--accent)' }} />
                    <h3 className="text-[12px] font-bold">{p.title}</h3>
                  </div>
                  <p className="text-[11px] font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>{p.goal}</p>
                  <p className="text-[10.5px] mb-1.5" style={{ color: 'var(--text-muted)' }}><strong>DT Output:</strong> {p.dtOutput}</p>
                  <p className="text-[10.5px]" style={{ color: 'var(--text-muted)' }}><strong>Actions:</strong> {p.actions}</p>
                </div>
                {i < PHASES.length - 1 && <ArrowRight size={16} className="mx-1 shrink-0" style={{ color: 'var(--text-muted)' }} />}
              </div>
            ))}
          </div>
          <p className="text-[11px] text-center mt-3" style={{ color: 'var(--text-muted)' }}>
            Closed loop: Sense → Analyze → Simulate → Act → Learn → Sense (repeats continuously as the network state changes)
          </p>
        </div>

        <div className="panel p-5">
          <div className="flex items-center gap-2 mb-1">
            <Cpu size={16} style={{ color: 'var(--accent)' }} />
            <h2 className="text-[13px] font-bold">Digital Twin Recommendation Engine</h2>
            <span className="chip chip-neutral">Rule-Based Prescriptive Recommendation — not a trained AI model</span>
          </div>
          <p className="text-[11.5px] mb-4" style={{ color: 'var(--text-secondary)' }}>
            For every non-healthy node, the engine evaluates all four mitigation levers and prescribes the one with the best REI reduction per euro invested.
          </p>

          <div className="space-y-2.5">
            {recs.map((r) => (
              <div key={r.id} className="panel">
                <button onClick={() => setExpanded(expanded === r.id ? null : r.id)} className="w-full text-left p-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`chip ${r.priority === 'P1' ? 'chip-critical' : r.priority === 'P2' ? 'chip-warning' : 'chip-neutral'}`}>{r.priority}</span>
                      <span className="text-[12.5px] font-bold">{r.title}</span>
                    </div>
                    <div className="text-[10.5px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Urgency: {r.urgency} · Est. cost {formatEur(r.estimatedCostEur)}</div>
                  </div>
                  <StatusPill level={r.residualRiskLevel} />
                </button>
                {expanded === r.id && (
                  <div className="px-3 pb-3">
                    <p className="text-[11.5px] mb-3" style={{ color: 'var(--text-secondary)' }}>{r.rationale}</p>
                    <div className="grid grid-cols-3 gap-3">
                      <DeltaMetric label="TTS" before={`${r.ttsBefore.toFixed(1)}d`} after={`${r.ttsAfter.toFixed(1)}d`} good={r.ttsAfter > r.ttsBefore} />
                      <DeltaMetric label="TTR" before={`${r.ttrBefore.toFixed(1)}d`} after={`${r.ttrAfter.toFixed(1)}d`} good={r.ttrAfter < r.ttrBefore} />
                      <DeltaMetric label="REI" before={formatEur(r.reiBefore)} after={formatEur(r.reiAfter)} good={r.reiAfter < r.reiBefore} />
                    </div>
                    <p className="text-[11px] mt-2" style={{ color: 'var(--text-muted)' }}>
                      Result: {r.ttsAfter >= r.ttrAfter ? 'TTS ≥ TTR restored.' : 'Exposure reduced; resilience threshold not fully restored — consider a combined strategy.'}
                    </p>
                  </div>
                )}
              </div>
            ))}
            {recs.length === 0 && <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>No non-healthy nodes currently require a prescriptive recommendation.</p>}
          </div>
        </div>

        <div className="text-center">
          <Link to="/simulation" className="text-[12px] font-semibold" style={{ color: 'var(--accent)' }}>Test these recommendations in Scenario Simulation →</Link>
        </div>
      </div>
    </div>
  )
}

function DeltaMetric({ label, before, after, good }: { label: string; before: string; after: string; good: boolean }) {
  return (
    <div className="rounded p-2.5" style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)' }}>
      <div className="text-[9.5px] uppercase font-semibold" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="flex items-center gap-1.5 font-mono text-[12.5px]">
        <span style={{ color: 'var(--text-muted)' }}>{before}</span>
        <ArrowRight size={11} />
        <span className="font-bold" style={{ color: good ? 'var(--healthy)' : 'var(--critical)' }}>{after}</span>
      </div>
    </div>
  )
}
