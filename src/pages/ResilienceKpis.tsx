import { useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts'
import PageHeader from '../components/PageHeader'
import StatusPill from '../components/StatusPill'
import { suppliers } from '../data/network'
import { kpiHistoryBySupplier } from '../data/kpiHistory'
import { formatEur } from '../calculations/kpi'
import type { RiskLevel, Tier } from '../models/types'

export default function ResilienceKpis() {
  const [tierFilter, setTierFilter] = useState<Tier | 'All'>('All')
  const [countryFilter, setCountryFilter] = useState('All')
  const [componentFilter, setComponentFilter] = useState('All')
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'All'>('All')
  const [supplierId, setSupplierId] = useState('T3-07')

  const countries = useMemo(() => Array.from(new Set(suppliers.map((s) => s.country))).sort(), [])
  const components = useMemo(() => Array.from(new Set(suppliers.map((s) => s.component))).sort(), [])

  const filtered = useMemo(() => suppliers.filter((s) =>
    (tierFilter === 'All' || s.tier === tierFilter) &&
    (countryFilter === 'All' || s.country === countryFilter) &&
    (componentFilter === 'All' || s.component === componentFilter) &&
    (riskFilter === 'All' || s.riskLevel === riskFilter)
  ), [tierFilter, countryFilter, componentFilter, riskFilter])

  const supplier = suppliers.find((s) => s.id === supplierId) ?? filtered[0] ?? suppliers[0]
  const history = kpiHistoryBySupplier[supplier.id]

  return (
    <div>
      <PageHeader title="Resilience KPI Cockpit" subtitle="TTS, TTR, REI and process KPIs — Kapitel 5.3 Tabelle 5.3" />
      <div className="p-6 space-y-5">
        <div className="panel p-4">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Select value={tierFilter} onChange={setTierFilter} label="Tier" options={['All', 'OEM', 'Tier-1', 'Tier-2', 'Tier-3']} />
            <Select value={countryFilter} onChange={setCountryFilter} label="Country" options={['All', ...countries]} />
            <Select value={componentFilter} onChange={setComponentFilter} label="Component" options={['All', ...components]} />
            <Select value={riskFilter} onChange={setRiskFilter} label="Risk" options={['All', 'healthy', 'warning', 'critical']} />
            <span className="ml-auto text-[11px]" style={{ color: 'var(--text-muted)' }}>{filtered.length} suppliers match filter</span>
          </div>
          <table className="w-full text-[11.5px]">
            <thead>
              <tr className="text-left border-b" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                <th className="py-1.5 font-semibold">Supplier</th><th>Tier</th><th>TTS</th><th>TTR</th><th>REI</th><th>Condition</th><th>Risk</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 12).map((s) => (
                <tr key={s.id} onClick={() => setSupplierId(s.id)} className="border-t cursor-pointer hover:bg-[var(--surface-alt)]" style={{ borderColor: 'var(--border)', background: s.id === supplier.id ? 'var(--accent-soft)' : undefined }}>
                  <td className="py-1.5 font-medium">{s.name}</td>
                  <td>{s.tier}</td>
                  <td className="font-mono">{s.tts.toFixed(1)}d</td>
                  <td className="font-mono">{s.ttr.toFixed(1)}d</td>
                  <td className="font-mono">{formatEur(s.rei)}</td>
                  <td className="font-mono">{s.resilient ? 'TTS ≥ TTR' : 'TTS < TTR'}</td>
                  <td><StatusPill level={s.riskLevel} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length > 12 && <p className="text-[10.5px] mt-1.5" style={{ color: 'var(--text-muted)' }}>Showing 12 of {filtered.length}. Click a row to inspect its KPI history below.</p>}
        </div>

        <div className="panel p-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-[13px] font-bold">{supplier.name} — {supplier.component} ({supplier.tier}, {supplier.country})</h2>
            <StatusPill level={supplier.riskLevel} />
          </div>
          <p className="text-[11.5px] mb-3" style={{ color: 'var(--text-secondary)' }}>
            Resilience Rule: node is resilient when TTS ≥ TTR. Current: TTS {supplier.tts.toFixed(1)}d, TTR {supplier.ttr.toFixed(1)}d, REI {formatEur(supplier.rei)}.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <ChartCard title="TTS vs TTR (75-day history)">
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={(d) => d.slice(5)} interval={9} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="tts" name="TTS (days)" stroke="#2563eb" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="ttr" name="TTR (days)" stroke="#dc2626" dot={false} strokeWidth={2} />
              </LineChart>
            </ChartCard>
            <ChartCard title="REI Over Time (EUR)">
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={(d) => d.slice(5)} interval={9} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => formatEur(v)} width={55} />
                <Tooltip formatter={(v) => formatEur(Number(v))} />
                <Line type="monotone" dataKey="rei" name="REI" stroke="#7c3aed" dot={false} strokeWidth={2} />
              </LineChart>
            </ChartCard>
            <ChartCard title="Inventory Coverage (days)">
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={(d) => d.slice(5)} interval={9} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="inventoryCoverageDays" name="Coverage" stroke="#0891b2" dot={false} strokeWidth={2} />
              </LineChart>
            </ChartCard>
            <ChartCard title="Lead Time & On-Time Delivery">
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={(d) => d.slice(5)} interval={9} />
                <YAxis yAxisId="l" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 10 }} domain={[50, 100]} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line yAxisId="l" type="monotone" dataKey="leadTimeDays" name="Lead time (d)" stroke="#d97706" dot={false} strokeWidth={2} />
                <Line yAxisId="r" type="monotone" dataKey="onTimeDelivery" name="On-time %" stroke="#16a34a" dot={false} strokeWidth={2} />
              </LineChart>
            </ChartCard>
            <ChartCard title="Average Time to Detection (ATTD)">
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={(d) => d.slice(5)} interval={9} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="attdDays" name="ATTD (d)" stroke="#be185d" dot={false} strokeWidth={2} />
              </LineChart>
            </ChartCard>
            <ChartCard title="Reaction Lead Time & Capacity Utilization">
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={(d) => d.slice(5)} interval={9} />
                <YAxis yAxisId="l" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 10 }} domain={[0, 100]} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line yAxisId="l" type="monotone" dataKey="reactionLeadTimeDays" name="Reaction (d)" stroke="#059669" dot={false} strokeWidth={2} />
                <Line yAxisId="r" type="monotone" dataKey="capacityUtilization" name="Capacity %" stroke="#6366f1" dot={false} strokeWidth={2} />
                <ReferenceLine yAxisId="r" y={90} stroke="#dc2626" strokeDasharray="4 4" />
              </LineChart>
            </ChartCard>
          </div>
        </div>
      </div>
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactElement }) {
  return (
    <div>
      <h3 className="text-[11.5px] font-bold mb-1.5">{title}</h3>
      <ResponsiveContainer width="100%" height={190}>{children}</ResponsiveContainer>
    </div>
  )
}

function Select<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: string[]; label: string }) {
  return (
    <label className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--text-secondary)' }}>
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value as T)} className="text-[11.5px] py-1 px-1.5 rounded border" style={{ borderColor: 'var(--border)' }}>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  )
}
