import { Database, Cpu, MonitorDot, RefreshCw } from 'lucide-react'
import PageHeader from '../components/PageHeader'

const LAYER1 = {
  sources: ['ERP', 'MES', 'WMS', 'TMS', 'IoT Sensors', 'Supplier Data', 'Inventory Data', 'Transport Data', 'External Risk Intelligence', 'Weather / Geopolitical Feeds'],
  processing: ['API Gateways', 'ETL Pipelines', 'Data Harmonization', 'Catena-X Data Ecosystem', 'Asset Administration Shell (AAS)', 'Multi-Tier Supplier Mapping'],
}
const LAYER2 = ['Supply Chain Graph (state sync)', 'Monitoring & Threshold Engine', 'AI Anomaly Detection', 'Predictive Analytics', 'Resilience KPI Engine (TTS / TTR / REI)', 'Scenario Simulation Module', 'Prescriptive Engine']
const LAYER3 = ['Executive Overview', 'Early Warning Center', 'Network Visualization', 'KPI Cockpit', 'Scenario Planning', 'Decision Recommendations']
const LOOP = ['Sense', 'Analyze', 'Simulate', 'Act', 'Learn']

export default function Architecture() {
  return (
    <div>
      <PageHeader title="Digital Twin Architecture" subtitle="Three-layer conceptual architecture — Kapitel 5.4, Abbildung 5.2" />
      <div className="p-6 space-y-5">
        <div className="panel p-4" style={{ borderLeft: '3px solid var(--accent)' }}>
          <p className="text-[11.5px]" style={{ color: 'var(--text-secondary)' }}>
            All connections shown below are <strong>architectural / conceptual</strong> in this prototype. No live ERP, MES, IoT, or Catena-X
            connectivity exists — the Digital Twin Core operates on the simulated dataset described in the Methodology page.
          </p>
        </div>

        <LayerBlock icon={Database} title="Layer 1 — Data Integration" tone="#0891b2">
          <div className="grid grid-cols-2 gap-3">
            <ChipGroup title="Heterogeneous data sources (simulated)" items={LAYER1.sources} />
            <ChipGroup title="Integration & standardization" items={LAYER1.processing} />
          </div>
        </LayerBlock>

        <div className="flex justify-center"><RefreshCw size={16} style={{ color: 'var(--text-muted)' }} className="rotate-90" /></div>

        <LayerBlock icon={Cpu} title="Layer 2 — Digital Twin & Analytics Core" tone="#7c3aed">
          <ChipGroup items={LAYER2} />
          <p className="text-[11px] mt-3" style={{ color: 'var(--text-muted)' }}>
            The DT Core represents the network as a live graph model (nodes = plants/warehouses/suppliers, edges = material flows) and
            continuously recomputes TTS, TTR and REI as the simulated state changes.
          </p>
        </LayerBlock>

        <div className="flex justify-center"><RefreshCw size={16} style={{ color: 'var(--text-muted)' }} className="rotate-90" /></div>

        <LayerBlock icon={MonitorDot} title="Layer 3 — Decision & Resilience Dashboard" tone="#2563eb">
          <ChipGroup items={LAYER3} />
        </LayerBlock>

        <div className="panel p-5">
          <h2 className="text-[13px] font-bold mb-4 text-center">Closed-Loop Resilience Cycle</h2>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {LOOP.map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <div className="px-4 py-2 rounded-full text-[12px] font-bold text-white" style={{ background: 'var(--accent)' }}>{step}</div>
                {i < LOOP.length - 1 && <span style={{ color: 'var(--text-muted)' }}>→</span>}
              </div>
            ))}
            <span style={{ color: 'var(--text-muted)' }}>→</span>
            <div className="px-4 py-2 rounded-full text-[12px] font-bold" style={{ border: '1.5px dashed var(--accent)', color: 'var(--accent)' }}>Sense (loop repeats)</div>
          </div>
          <p className="text-[11.5px] text-center mt-4" style={{ color: 'var(--text-secondary)' }}>
            Every mitigation applied in the physical world feeds new data back into the Digital Twin, which re-senses the network state —
            an adaptive, self-correcting resilience-management cycle.
          </p>
        </div>
      </div>
    </div>
  )
}

function LayerBlock({ icon: Icon, title, tone, children }: { icon: any; title: string; tone: string; children: React.ReactNode }) {
  return (
    <div className="panel p-4" style={{ borderLeft: `3px solid ${tone}` }}>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={16} style={{ color: tone }} />
        <h2 className="text-[13px] font-bold">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function ChipGroup({ title, items }: { title?: string; items: string[] }) {
  return (
    <div>
      {title && <div className="text-[10.5px] font-semibold uppercase mb-1.5" style={{ color: 'var(--text-muted)' }}>{title}</div>}
      <div className="flex flex-wrap gap-1.5">
        {items.map((it) => <span key={it} className="chip chip-neutral">{it}</span>)}
      </div>
    </div>
  )
}
