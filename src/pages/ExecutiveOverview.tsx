import { Link } from 'react-router-dom'
import { AlertTriangle, Building2, ShieldCheck, Clock, Timer, Wallet, Siren, Bell } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts'
import PageHeader from '../components/PageHeader'
import KpiCard from '../components/KpiCard'
import StatusPill from '../components/StatusPill'
import { suppliers, downstreamClosure, suppliersById } from '../data/network'
import { alerts } from '../data/alerts'
import { networkAggregateHistory } from '../data/kpiHistory'
import { formatEur } from '../calculations/kpi'

export default function ExecutiveOverview() {
  // REI/risk leaderboards are computed over supplier nodes only — the OEM node
  // represents final assembly (the consequence of upstream risk), not a graded
  // supply-risk node itself, so it is excluded from ranking/leaderboard logic.
  const riskSuppliers = suppliers.filter((s) => s.tier !== 'OEM')
  const critical = riskSuppliers.filter((s) => s.riskLevel === 'critical').sort((a, b) => b.rei - a.rei)
  const warning = riskSuppliers.filter((s) => s.riskLevel === 'warning')
  const healthy = riskSuppliers.filter((s) => s.riskLevel === 'healthy')
  const violations = riskSuppliers.filter((s) => s.tts < s.ttr)
  // "Max REI" is reported among currently flagged (non-healthy) nodes so it
  // stays consistent with "Most Critical Network Node" below — a healthy node
  // can carry a high inherent REI (e.g. a well-buffered single-source
  // supplier) without being the network's most urgent exposure right now.
  const flagged = critical.length > 0 ? critical : warning.length > 0 ? warning : riskSuppliers
  const mostCritical = flagged.reduce((a, b) => (b.rei > a.rei ? b : a))
  const maxRei = mostCritical.rei
  const totalExposure = riskSuppliers.reduce((s, sup) => s + (sup.riskLevel !== 'healthy' ? sup.rei : 0), 0)
  const avgAttd = riskSuppliers.reduce((s, sup) => s + sup.attdDays, 0) / riskSuppliers.length
  const avgReaction = riskSuppliers.reduce((s, sup) => s + sup.reactionLeadTimeDays, 0) / riskSuppliers.length
  const activeCriticalAlerts = alerts.filter((a) => a.severity === 'Critical' && !a.acknowledged).length

  const resilienceScore = Math.max(0, Math.round(100 - critical.length * 8 - warning.length * 3))

  const top5 = [...riskSuppliers].sort((a, b) => b.rei - a.rei).slice(0, 5)
  const criticalT23 = riskSuppliers.filter((s) => (s.tier === 'Tier-2' || s.tier === 'Tier-3') && s.riskLevel !== 'healthy').sort((a, b) => b.rei - a.rei)
  const severeAlerts = alerts.filter((a) => a.severity === 'Critical' || a.severity === 'High').slice(0, 6)

  const history = networkAggregateHistory()
  const trendSample = history.filter((_, i) => i % 4 === 0)

  const byTier = ['Tier-1', 'Tier-2', 'Tier-3'].map((tier) => ({
    tier,
    healthy: riskSuppliers.filter((s) => s.tier === tier && s.riskLevel === 'healthy').length,
    warning: riskSuppliers.filter((s) => s.tier === tier && s.riskLevel === 'warning').length,
    critical: riskSuppliers.filter((s) => s.tier === tier && s.riskLevel === 'critical').length,
  }))

  const byGeo = Object.entries(
    riskSuppliers.reduce<Record<string, number>>((acc, s) => {
      acc[s.country] = (acc[s.country] ?? 0) + (s.riskLevel !== 'healthy' ? 1 : 0)
      return acc
    }, {})
  ).filter(([, v]) => v > 0).map(([country, count]) => ({ country, count }))

  const byCategory = Object.entries(
    riskSuppliers.reduce<Record<string, number>>((acc, s) => {
      acc[s.component] = (acc[s.component] ?? 0) + 1
      return acc
    }, {})
  ).map(([component, count]) => ({ component, count })).sort((a, b) => b.count - a.count).slice(0, 8)

  const downstream = downstreamClosure(mostCritical.id).map((id) => suppliersById[id]?.name).filter(Boolean)

  return (
    <div>
      <PageHeader title="Executive Overview" subtitle="Network-wide resilience cockpit — simulated Digital Twin data" />
      <div className="p-6 space-y-5">
        <div className="grid grid-cols-4 xl:grid-cols-8 gap-3">
          <KpiCard label="Resilience Score" value={`${resilienceScore}`} sub="0-100, network-wide" icon={<ShieldCheck size={16} />} tone={resilienceScore >= 70 ? 'healthy' : resilienceScore >= 45 ? 'warning' : 'critical'} />
          <KpiCard label="Max REI" value={formatEur(maxRei)} sub={mostCritical.name} icon={<Wallet size={16} />} tone="critical" />
          <KpiCard label="Critical Suppliers" value={`${critical.length}`} sub={`of ${riskSuppliers.length} nodes`} icon={<AlertTriangle size={16} />} tone={critical.length > 0 ? 'critical' : 'healthy'} />
          <KpiCard label="TTS < TTR Violations" value={`${violations.length}`} sub="Resilience rule breached" icon={<Siren size={16} />} tone={violations.length > 0 ? 'critical' : 'healthy'} />
          <KpiCard label="Active Critical Alerts" value={`${activeCriticalAlerts}`} sub="Unacknowledged" icon={<Bell size={16} />} tone={activeCriticalAlerts > 0 ? 'critical' : 'healthy'} />
          <KpiCard label="Financial Exposure" value={formatEur(totalExposure)} sub="Sum REI, non-healthy nodes" icon={<Building2 size={16} />} tone="warning" />
          <KpiCard label="Avg. Time to Detection" value={`${avgAttd.toFixed(1)}d`} sub="ATTD across network" icon={<Clock size={16} />} />
          <KpiCard label="Reaction Lead Time" value={`${avgReaction.toFixed(1)}d`} sub="Avg. across network" icon={<Timer size={16} />} />
        </div>

        <div className="panel p-4" style={{ borderLeft: '3px solid var(--critical)' }}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} style={{ color: 'var(--critical)' }} />
            <h2 className="text-[13px] font-bold">Most Critical Network Node</h2>
            <StatusPill level={mostCritical.riskLevel} className="ml-1" />
          </div>
          <div className="grid grid-cols-4 lg:grid-cols-8 gap-4 text-[12px]">
            <Field label="Supplier" value={mostCritical.name} />
            <Field label="Tier" value={mostCritical.tier} />
            <Field label="Component" value={mostCritical.component} />
            <Field label="TTS" value={`${mostCritical.tts.toFixed(1)}d`} />
            <Field label="TTR" value={`${mostCritical.ttr.toFixed(1)}d`} />
            <Field label="REI" value={formatEur(mostCritical.rei)} />
            <Field label="Affected Downstream" value={`${downstream.length} nodes`} />
            <Field label="OEM Impact" value={downstream.includes('Vantoria Motors AG') ? 'Direct exposure' : 'Indirect exposure'} />
          </div>
          {mostCritical.notes && <p className="text-[11.5px] mt-3" style={{ color: 'var(--text-secondary)' }}>{mostCritical.notes}</p>}
          <Link to={`/network?focus=${mostCritical.id}`} className="inline-block mt-3 text-[12px] font-semibold" style={{ color: 'var(--accent)' }}>
            View in Supply Network →
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="panel p-4 col-span-2">
            <h2 className="text-[12.5px] font-bold mb-2">REI &amp; TTS vs TTR Trend (75-day history, network average)</h2>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trendSample}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => d.slice(5)} />
                <YAxis yAxisId="days" tick={{ fontSize: 10 }} label={{ value: 'days', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line yAxisId="days" type="monotone" dataKey="avgTts" name="Avg TTS" stroke="#2563eb" dot={false} strokeWidth={2} />
                <Line yAxisId="days" type="monotone" dataKey="avgTtr" name="Avg TTR" stroke="#dc2626" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="panel p-4">
            <h2 className="text-[12.5px] font-bold mb-2">Risk Distribution by Tier</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byTier} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="tier" type="category" tick={{ fontSize: 10 }} width={45} />
                <Tooltip />
                <Bar dataKey="healthy" stackId="a" fill="#16a34a" />
                <Bar dataKey="warning" stackId="a" fill="#d97706" />
                <Bar dataKey="critical" stackId="a" fill="#dc2626" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="panel p-4">
            <h2 className="text-[12.5px] font-bold mb-2">Top 5 Suppliers by REI</h2>
            <table className="w-full text-[11.5px]">
              <tbody>
                {top5.map((s) => (
                  <tr key={s.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                    <td className="py-1.5">
                      <Link to={`/network?focus=${s.id}`} className="font-medium hover:underline" style={{ color: 'var(--accent)' }}>{s.name}</Link>
                      <div style={{ color: 'var(--text-muted)' }}>{s.tier} · {s.component}</div>
                    </td>
                    <td className="py-1.5 text-right font-mono font-semibold">{formatEur(s.rei)}</td>
                    <td className="py-1.5 pl-2"><StatusPill level={s.riskLevel} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="panel p-4">
            <h2 className="text-[12.5px] font-bold mb-2">Critical Tier-2 / Tier-3 Suppliers</h2>
            <table className="w-full text-[11.5px]">
              <tbody>
                {criticalT23.length === 0 && <tr><td className="py-2" style={{ color: 'var(--text-muted)' }}>No Tier-2/3 nodes currently in a non-healthy state.</td></tr>}
                {criticalT23.map((s) => (
                  <tr key={s.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                    <td className="py-1.5">
                      <Link to={`/network?focus=${s.id}`} className="font-medium hover:underline" style={{ color: 'var(--accent)' }}>{s.name}</Link>
                      <div style={{ color: 'var(--text-muted)' }}>{s.tier} · {s.country}{s.spof ? ' · SPOF' : ''}</div>
                    </td>
                    <td className="py-1.5 pl-2"><StatusPill level={s.riskLevel} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="panel p-4">
            <h2 className="text-[12.5px] font-bold mb-2">Current Severe Alerts</h2>
            <div className="space-y-2">
              {severeAlerts.map((a) => (
                <Link key={a.id} to="/alerts" className="block p-2 rounded border text-[11.5px]" style={{ borderColor: 'var(--border)', background: 'var(--surface-alt)' }}>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{a.trigger}</span>
                    <StatusPill level={a.severity === 'Critical' ? 'critical' : a.severity === 'High' ? 'warning' : 'healthy'} />
                  </div>
                  <div style={{ color: 'var(--text-muted)' }}>{suppliersById[a.supplierId]?.name} · {a.where}</div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="panel p-4">
            <h2 className="text-[12.5px] font-bold mb-2">Risk by Geography</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={byGeo} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                <YAxis dataKey="country" type="category" tick={{ fontSize: 10 }} width={80} />
                <Tooltip />
                <Bar dataKey="count" name="At-risk nodes" fill="#d97706" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="panel p-4 col-span-2">
            <h2 className="text-[12.5px] font-bold mb-2">Node Count by Component Category</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={byCategory} margin={{ left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="component" tick={{ fontSize: 9 }} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#2563eb" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="text-[11px] text-center py-2" style={{ color: 'var(--text-muted)' }}>
          {healthy.length} healthy · {warning.length} warning · {critical.length} critical — {riskSuppliers.length} supplier nodes ({suppliers.length} total incl. OEM)
        </div>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase font-semibold" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  )
}
