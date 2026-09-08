import { useMemo, useState, useCallback, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import ReactFlow, { Background, Controls, MiniMap, type Node } from 'reactflow'
import 'reactflow/dist/style.css'
import { Search, X, ArrowUpCircle, ArrowDownCircle, AlertOctagon } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import StatusPill from '../components/StatusPill'
import SupplierFlowNode from '../components/network/SupplierFlowNode'
import { computeLayout } from '../components/network/layout'
import { suppliers, suppliersById, upstreamClosure, downstreamClosure, HIDDEN_SPOF_IDS } from '../data/network'
import { formatEur } from '../calculations/kpi'
import type { RiskLevel, SupplierWithKpis, Tier } from '../models/types'

const nodeTypes = { supplier: SupplierFlowNode }

export default function SupplyNetwork() {
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState<Tier | 'All'>('All')
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'All'>('All')
  const [componentFilter, setComponentFilter] = useState<string>('All')
  const [countryFilter, setCountryFilter] = useState<string>('All')
  const [selectedId, setSelectedId] = useState<string | null>(params.get('focus'))
  const [pathMode, setPathMode] = useState<'none' | 'upstream' | 'downstream'>('none')

  useEffect(() => {
    const f = params.get('focus')
    if (f) setSelectedId(f)
  }, [params])

  const base = useMemo(() => computeLayout(), [])
  const components = useMemo(() => Array.from(new Set(suppliers.map((s) => s.component))).sort(), [])
  const countries = useMemo(() => Array.from(new Set(suppliers.map((s) => s.country))).sort(), [])

  const matches = useCallback((id: string) => {
    const s = suppliersById[id]
    if (!s) return true
    if (tierFilter !== 'All' && s.tier !== tierFilter) return false
    if (riskFilter !== 'All' && s.riskLevel !== riskFilter) return false
    if (componentFilter !== 'All' && s.component !== componentFilter) return false
    if (countryFilter !== 'All' && s.country !== countryFilter) return false
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.id.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }, [tierFilter, riskFilter, componentFilter, countryFilter, search])

  const pathSet = useMemo(() => {
    if (!selectedId || pathMode === 'none') return null
    const ids = pathMode === 'upstream' ? upstreamClosure(selectedId) : downstreamClosure(selectedId)
    return new Set([selectedId, ...ids])
  }, [selectedId, pathMode])

  const nodes: Node[] = useMemo(() => base.nodes.map((n) => ({
    ...n,
    data: {
      ...n.data,
      dimmed: !matches(n.id) || (pathSet ? !pathSet.has(n.id) : false),
      highlighted: pathSet ? pathSet.has(n.id) : false,
    },
    selected: n.id === selectedId,
  })), [base.nodes, matches, pathSet, selectedId])

  const rfEdges = useMemo(() => base.edges.map((e) => ({
    ...e,
    style: {
      ...e.style,
      opacity: pathSet ? (pathSet.has(e.source) && pathSet.has(e.target) ? 1 : 0.12) : 1,
    },
  })), [base.edges, pathSet])

  const selected = selectedId ? suppliersById[selectedId] : null
  const upstream = selectedId ? upstreamClosure(selectedId).map((id) => suppliersById[id]).filter(Boolean) : []
  const downstream = selectedId ? downstreamClosure(selectedId).map((id) => suppliersById[id]).filter(Boolean) : []

  return (
    <div className="flex flex-col h-screen">
      <PageHeader
        title="Multi-Tier Supply Network"
        subtitle="Interactive Digital Twin graph — OEM ← Tier-1 ← Tier-2 ← Tier-3 (simulated network)"
      />
      <div className="flex items-center gap-2 px-6 py-2.5 border-b flex-wrap" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
        <div className="relative">
          <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search supplier or ID..."
            className="pl-6 pr-2 py-1.5 text-[12px] rounded border w-52" style={{ borderColor: 'var(--border)' }}
          />
        </div>
        <Select value={tierFilter} onChange={setTierFilter} label="Tier" options={['All', 'OEM', 'Tier-1', 'Tier-2', 'Tier-3']} />
        <Select value={riskFilter} onChange={setRiskFilter} label="Risk" options={['All', 'healthy', 'warning', 'critical']} />
        <Select value={componentFilter} onChange={setComponentFilter} label="Component" options={['All', ...components]} />
        <Select value={countryFilter} onChange={setCountryFilter} label="Country" options={['All', ...countries]} />
        <div className="ml-auto flex items-center gap-3 text-[11px]" style={{ color: 'var(--text-muted)' }}>
          <Legend color="#16a34a" label="Healthy" />
          <Legend color="#d97706" label="Warning" />
          <Legend color="#dc2626" label="Critical" />
          <span className="flex items-center gap-1"><AlertOctagon size={12} style={{ color: 'var(--critical)' }} /> SPOF</span>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={rfEdges}
            nodeTypes={nodeTypes}
            onNodeClick={(_, n) => { setSelectedId(n.id); setParams({}) }}
            onPaneClick={() => setPathMode('none')}
            fitView
            minZoom={0.3}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#dde3ea" gap={20} />
            <Controls showInteractive={false} />
            <MiniMap
              pannable zoomable
              nodeColor={(n) => {
                const s = suppliersById[n.id]
                return s ? { healthy: '#16a34a', warning: '#d97706', critical: '#dc2626' }[s.riskLevel] : '#ccc'
              }}
              style={{ background: 'var(--surface)' }}
            />
          </ReactFlow>
          {HIDDEN_SPOF_IDS.length > 0 && (
            <div className="absolute top-3 left-3 panel px-3 py-2 text-[11px] max-w-xs" style={{ borderLeft: '3px solid var(--critical)' }}>
              <strong>Hidden Tier-3 dependencies:</strong> {HIDDEN_SPOF_IDS.map((id) => suppliersById[id]?.name).join(' & ')} each feed two independent upstream paths — a single failure fans out across the network.
            </div>
          )}
        </div>

        {selected && (
          <aside className="w-[340px] shrink-0 border-l overflow-y-auto p-4" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="text-[9px] uppercase font-bold" style={{ color: 'var(--text-muted)' }}>{selected.tier} · {selected.id}</div>
                <h3 className="text-[14px] font-bold">{selected.name}</h3>
              </div>
              <button onClick={() => setSelectedId(null)}><X size={16} /></button>
            </div>
            <StatusPill level={selected.riskLevel} />
            {selected.spof && <span className="chip chip-critical ml-1"><AlertOctagon size={10} /> SPOF</span>}

            <div className="grid grid-cols-2 gap-2 mt-3 text-[11.5px]">
              <Field label="Country / City" value={`${selected.country}, ${selected.city}`} />
              <Field label="Component" value={selected.component} />
              <Field label="Capacity" value={`${selected.capacity.toLocaleString()} u/d`} />
              <Field label="Capacity Utilization" value={`${selected.capacityUtilization}%`} />
              <Field label="On-Hand Inventory" value={`${selected.onHandInventory.toLocaleString()} u`} />
              <Field label="Pipeline Inventory" value={`${selected.pipelineInventory.toLocaleString()} u`} />
              <Field label="Daily Demand" value={`${selected.dailyConsumption.toLocaleString()} u/d`} />
              <Field label="Inventory Coverage" value={`${((selected.onHandInventory) / selected.dailyConsumption).toFixed(1)}d`} />
              <Field label="Lead Time" value={`${selected.leadTimeDays}d`} />
              <Field label="On-Time Delivery" value={`${selected.onTimeDelivery}%`} />
              <Field label="TTS" value={`${selected.tts.toFixed(1)}d`} />
              <Field label="TTR" value={`${selected.ttr.toFixed(1)}d`} />
              <Field label="REI" value={formatEur(selected.rei)} />
              <Field label="ATTD" value={`${selected.attdDays}d`} />
              <Field label="Reaction Lead Time" value={`${selected.reactionLeadTimeDays}d`} />
              <Field label="Alt. Supplier(s)" value={selected.alternativeSupplierIds.length ? selected.alternativeSupplierIds.join(', ') : 'None qualified'} />
              <Field label="SPOF Status" value={selected.spof ? 'Single point of failure' : 'Redundant path exists'} />
            </div>

            {selected.notes && <p className="text-[11.5px] mt-3 p-2 rounded" style={{ background: 'var(--surface-alt)', color: 'var(--text-secondary)' }}>{selected.notes}</p>}

            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setPathMode(pathMode === 'upstream' ? 'none' : 'upstream')}
                className="flex-1 flex items-center justify-center gap-1 text-[11px] font-semibold py-1.5 rounded border"
                style={{ borderColor: 'var(--border)', background: pathMode === 'upstream' ? 'var(--accent-soft)' : 'transparent' }}
              ><ArrowUpCircle size={13} /> Upstream</button>
              <button
                onClick={() => setPathMode(pathMode === 'downstream' ? 'none' : 'downstream')}
                className="flex-1 flex items-center justify-center gap-1 text-[11px] font-semibold py-1.5 rounded border"
                style={{ borderColor: 'var(--border)', background: pathMode === 'downstream' ? 'var(--accent-soft)' : 'transparent' }}
              ><ArrowDownCircle size={13} /> Downstream</button>
            </div>

            <div className="mt-4">
              <h4 className="text-[11px] font-bold uppercase mb-1.5" style={{ color: 'var(--text-muted)' }}>Upstream Dependencies ({upstream.length})</h4>
              <MiniList items={upstream} onSelect={setSelectedId} />
            </div>
            <div className="mt-4">
              <h4 className="text-[11px] font-bold uppercase mb-1.5" style={{ color: 'var(--text-muted)' }}>Downstream Impact ({downstream.length})</h4>
              <MiniList items={downstream} onSelect={setSelectedId} />
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}

function MiniList({ items, onSelect }: { items: SupplierWithKpis[]; onSelect: (id: string) => void }) {
  if (items.length === 0) return <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>None</div>
  return (
    <div className="space-y-1">
      {items.map((s) => (
        <button key={s.id} onClick={() => onSelect(s.id)} className="w-full flex items-center justify-between text-[11.5px] px-2 py-1 rounded hover:bg-[var(--surface-alt)] text-left">
          <span>{s.name} <span style={{ color: 'var(--text-muted)' }}>({s.tier})</span></span>
          <StatusPill level={s.riskLevel} />
        </button>
      ))}
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[9.5px] uppercase font-semibold" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="font-medium">{value}</div>
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

function Legend({ color, label }: { color: string; label: string }) {
  return <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: color }} />{label}</span>
}
