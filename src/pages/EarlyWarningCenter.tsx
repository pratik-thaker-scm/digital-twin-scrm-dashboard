import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, MapPin, Layers, Package, CheckCircle2 } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import StatusPill from '../components/StatusPill'
import { alerts as allAlerts, severityWeight } from '../data/alerts'
import { suppliersById } from '../data/network'
import { formatEur } from '../calculations/kpi'
import type { AlertSeverity, AlertTriggerType } from '../models/types'

const SEVERITIES: (AlertSeverity | 'All')[] = ['All', 'Critical', 'High', 'Medium', 'Low']

export default function EarlyWarningCenter() {
  const [severity, setSeverity] = useState<AlertSeverity | 'All'>('All')
  const [trigger, setTrigger] = useState<AlertTriggerType | 'All'>('All')
  const sortedAlerts = [...allAlerts].sort((a, b) => severityWeight[b.severity] - severityWeight[a.severity] || b.rei - a.rei)
  const [selectedId, setSelectedId] = useState(sortedAlerts[0]?.id)

  const triggers = useMemo(() => Array.from(new Set(allAlerts.map((a) => a.trigger))).sort(), [])

  const filtered = useMemo(() => allAlerts
    .filter((a) => severity === 'All' || a.severity === severity)
    .filter((a) => trigger === 'All' || a.trigger === trigger)
    .sort((a, b) => severityWeight[b.severity] - severityWeight[a.severity] || b.rei - a.rei), [severity, trigger])

  const selected = filtered.find((a) => a.id === selectedId) ?? filtered[0]

  const counts = { Critical: allAlerts.filter((a) => a.severity === 'Critical').length, High: allAlerts.filter((a) => a.severity === 'High').length, Medium: allAlerts.filter((a) => a.severity === 'Medium').length, Low: allAlerts.filter((a) => a.severity === 'Low').length }

  return (
    <div>
      <PageHeader title="Early Warning Center" subtitle="DT-supported weak-signal detection — Kapitel 5.4" />
      <div className="p-6">
        <div className="grid grid-cols-4 gap-3 mb-4">
          <SeverityCard label="Critical" count={counts.Critical} tone="critical" />
          <SeverityCard label="High" count={counts.High} tone="warning" />
          <SeverityCard label="Medium" count={counts.Medium} tone="warning" />
          <SeverityCard label="Low" count={counts.Low} tone="healthy" />
        </div>

        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {SEVERITIES.map((s) => (
            <button key={s} onClick={() => setSeverity(s)} className="text-[11.5px] font-semibold px-2.5 py-1 rounded border" style={{ borderColor: 'var(--border)', background: severity === s ? 'var(--accent-soft)' : 'transparent' }}>{s}</button>
          ))}
          <select value={trigger} onChange={(e) => setTrigger(e.target.value as AlertTriggerType | 'All')} className="text-[11.5px] py-1 px-2 rounded border ml-2" style={{ borderColor: 'var(--border)' }}>
            <option value="All">All trigger types</option>
            {triggers.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <span className="ml-auto text-[11px]" style={{ color: 'var(--text-muted)' }}>Sorted by severity, then REI priority</span>
        </div>

        <div className="flex gap-4">
          <div className="w-[400px] shrink-0 space-y-2 max-h-[calc(100vh-260px)] overflow-y-auto pr-1">
            {filtered.map((a) => (
              <button
                key={a.id} onClick={() => setSelectedId(a.id)}
                className="w-full text-left panel p-3"
                style={{ borderLeft: `3px solid var(--${a.severity === 'Critical' ? 'critical' : a.severity === 'High' ? 'warning' : a.severity === 'Medium' ? 'warning' : 'healthy'})`, background: a.id === selected?.id ? 'var(--accent-soft)' : 'var(--surface)' }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11.5px] font-bold">{a.trigger}</span>
                  <StatusPill level={a.severity === 'Critical' ? 'critical' : a.severity === 'Low' ? 'healthy' : 'warning'} />
                </div>
                <div className="text-[11.5px] font-medium mt-0.5">{suppliersById[a.supplierId]?.name}</div>
                <div className="text-[10.5px]" style={{ color: 'var(--text-muted)' }}>{a.where} · REI {formatEur(a.rei)}</div>
              </button>
            ))}
          </div>

          {selected && (
            <div className="flex-1 panel p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={16} style={{ color: 'var(--critical)' }} />
                    <h2 className="text-[14px] font-bold">{selected.trigger}</h2>
                    <StatusPill level={selected.severity === 'Critical' ? 'critical' : selected.severity === 'Low' ? 'healthy' : 'warning'} />
                    {selected.acknowledged && <span className="chip chip-neutral"><CheckCircle2 size={10} /> Acknowledged</span>}
                  </div>
                  <p className="text-[12.5px] mt-1" style={{ color: 'var(--text-secondary)' }}>{selected.what}</p>
                </div>
                <Link to={`/network?focus=${selected.supplierId}`} className="text-[11.5px] font-semibold shrink-0" style={{ color: 'var(--accent)' }}>View node →</Link>
              </div>

              <div className="grid grid-cols-4 gap-3 my-4">
                <MetaField icon={<MapPin size={12} />} label="Where" value={selected.where} />
                <MetaField icon={<Layers size={12} />} label="Tier" value={selected.tier} />
                <MetaField icon={<Package size={12} />} label="Component" value={selected.component} />
                <MetaField label="Supplier" value={suppliersById[selected.supplierId]?.name ?? '—'} />
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <Metric label="TTS" value={`${selected.tts.toFixed(1)}d`} />
                <Metric label="TTR" value={`${selected.ttr.toFixed(1)}d`} />
                <Metric label="REI" value={formatEur(selected.rei)} />
              </div>

              <Section title="Why this alert was generated">{selected.why}</Section>
              <Section title="Downstream supply nodes affected">
                {selected.downstreamAffected.length ? selected.downstreamAffected.join(', ') : 'None identified.'}
              </Section>
              <Section title="Potential OEM impact">{selected.oemImpact}</Section>
              <Section title="Recommended action" accent>{selected.recommendedAction}</Section>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SeverityCard({ label, count, tone }: { label: string; count: number; tone: 'critical' | 'warning' | 'healthy' }) {
  return (
    <div className="panel p-3 flex items-center justify-between" style={{ borderLeft: `3px solid var(--${tone})` }}>
      <span className="text-[12px] font-semibold" style={{ color: 'var(--text-secondary)' }}>{label} Alerts</span>
      <span className="text-xl font-bold font-mono">{count}</span>
    </div>
  )
}

function MetaField({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <div className="text-[9.5px] uppercase font-semibold flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>{icon}{label}</div>
      <div className="text-[12px] font-medium">{value}</div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded p-2.5 text-center" style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)' }}>
      <div className="text-[10px] uppercase font-semibold" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="text-[16px] font-bold font-mono">{value}</div>
    </div>
  )
}

function Section({ title, children, accent }: { title: string; children: React.ReactNode; accent?: boolean }) {
  return (
    <div className="mb-3">
      <h4 className="text-[10.5px] uppercase font-bold mb-1" style={{ color: accent ? 'var(--accent)' : 'var(--text-muted)' }}>{title}</h4>
      <p className="text-[12px]" style={{ color: accent ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: accent ? 600 : 400 }}>{children}</p>
    </div>
  )
}
