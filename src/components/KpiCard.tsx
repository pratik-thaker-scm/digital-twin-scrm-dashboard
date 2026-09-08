import type { ReactNode } from 'react'

interface Props {
  label: string
  value: string
  sub?: string
  icon?: ReactNode
  tone?: 'default' | 'healthy' | 'warning' | 'critical'
}

const TONE_BORDER: Record<string, string> = {
  default: 'var(--border)',
  healthy: 'var(--healthy)',
  warning: 'var(--warning)',
  critical: 'var(--critical)',
}

export default function KpiCard({ label, value, sub, icon, tone = 'default' }: Props) {
  return (
    <div className="panel p-3.5 flex flex-col gap-1.5" style={{ borderLeft: `3px solid ${TONE_BORDER[tone]}` }}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>{label}</span>
        {icon && <span style={{ color: 'var(--text-muted)' }}>{icon}</span>}
      </div>
      <div className="text-2xl font-bold font-mono" style={{ color: 'var(--text-primary)' }}>{value}</div>
      {sub && <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{sub}</div>}
    </div>
  )
}
