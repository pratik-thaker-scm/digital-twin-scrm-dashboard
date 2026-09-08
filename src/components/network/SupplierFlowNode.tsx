import { Handle, Position } from 'reactflow'
import { AlertOctagon } from 'lucide-react'
import type { SupplierWithKpis } from '../../models/types'
import { RISK_COLORS } from '../../utils/format'

interface Data { supplier: SupplierWithKpis }

export default function SupplierFlowNode({ data, selected }: { data: Data; selected: boolean }) {
  const s = data.supplier
  const color = RISK_COLORS[s.riskLevel]
  const dimmed = (data as any).dimmed as boolean | undefined
  const highlighted = (data as any).highlighted as boolean | undefined

  return (
    <div
      className="rounded-md px-2.5 py-2 text-[10.5px] leading-tight"
      style={{
        width: 168,
        background: '#fff',
        border: `1.5px solid ${selected || highlighted ? '#2563eb' : color}`,
        boxShadow: selected ? '0 0 0 3px rgba(37,99,235,0.18)' : highlighted ? '0 0 0 2px rgba(37,99,235,0.12)' : '0 1px 2px rgba(16,24,40,0.06)',
        opacity: dimmed ? 0.25 : 1,
      }}
    >
      <Handle type="target" position={Position.Bottom} style={{ opacity: 0 }} />
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{s.tier}</span>
        <span className="w-2 h-2 rounded-full" style={{ background: color }} />
      </div>
      <div className="font-semibold truncate" title={s.name}>{s.name}</div>
      <div className="truncate" style={{ color: 'var(--text-secondary)' }}>{s.component} · {s.country}</div>
      <div className="flex items-center justify-between mt-1 font-mono">
        <span>TTS {s.tts.toFixed(0)}d</span>
        <span>TTR {s.ttr.toFixed(0)}d</span>
      </div>
      {s.spof && (
        <div className="flex items-center gap-1 mt-1 text-[9.5px] font-semibold" style={{ color: 'var(--critical)' }}>
          <AlertOctagon size={10} /> SPOF
        </div>
      )}
      <Handle type="source" position={Position.Top} style={{ opacity: 0 }} />
    </div>
  )
}
