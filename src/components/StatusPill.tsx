import type { RiskLevel } from '../models/types'

const LABEL: Record<RiskLevel, string> = { healthy: 'Healthy', warning: 'Warning', critical: 'Critical' }

export default function StatusPill({ level, className = '' }: { level: RiskLevel; className?: string }) {
  return <span className={`chip chip-${level} ${className}`}><span className={`dot dot-${level}`} />{LABEL[level]}</span>
}
