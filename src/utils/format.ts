export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(value))
}

export function formatPct(value: number): string {
  return `${Math.round(value)}%`
}

export function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export const RISK_COLORS = {
  healthy: '#16a34a',
  warning: '#d97706',
  critical: '#dc2626',
} as const

export const TIER_ORDER = ['OEM', 'Tier-1', 'Tier-2', 'Tier-3'] as const
