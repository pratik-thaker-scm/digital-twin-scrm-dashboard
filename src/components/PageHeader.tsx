import type { ReactNode } from 'react'

export default function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b sticky top-0 z-10" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
      <div>
        <h1 className="text-[18px] font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h1>
        {subtitle && <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>{subtitle}</p>}
      </div>
      {actions}
    </div>
  )
}
