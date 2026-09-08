import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard, Network, Activity, Bell, FlaskConical, Compass, Layers, BookOpen, ShieldAlert,
} from 'lucide-react'
import { alerts } from '../data/alerts'

const NAV = [
  { to: '/', label: 'Executive Overview', icon: LayoutDashboard, end: true },
  { to: '/network', label: 'Supply Network', icon: Network },
  { to: '/kpis', label: 'Resilience KPIs', icon: Activity },
  { to: '/alerts', label: 'Early Warning Center', icon: Bell },
  { to: '/simulation', label: 'Scenario Simulation', icon: FlaskConical },
  { to: '/decision', label: 'Decision Center', icon: Compass },
  { to: '/architecture', label: 'Digital Twin Architecture', icon: Layers },
  { to: '/methodology', label: 'Methodology', icon: BookOpen },
]

export default function Layout() {
  const criticalCount = alerts.filter((a) => a.severity === 'Critical' && !a.acknowledged).length

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
      <aside className="w-[240px] shrink-0 flex flex-col" style={{ background: 'var(--nav-bg)' }}>
        <div className="px-4 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded flex items-center justify-center" style={{ background: 'var(--accent)' }}>
              <Network size={16} color="white" />
            </div>
            <div>
              <div className="text-[13px] font-bold text-white leading-tight">SCRM Digital Twin</div>
              <div className="text-[10px]" style={{ color: 'var(--nav-text)' }}>Resilience Command Center</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-2 overflow-y-auto">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-4 py-2.5 text-[12.5px] font-medium transition-colors ${isActive ? 'text-white' : ''}`
              }
              style={({ isActive }) => ({
                background: isActive ? 'var(--nav-bg-active)' : 'transparent',
                color: isActive ? 'var(--nav-text-active)' : 'var(--nav-text)',
                borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
              })}
            >
              <Icon size={15} />
              {label}
              {to === '/alerts' && criticalCount > 0 && (
                <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'var(--critical)', color: 'white' }}>
                  {criticalCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-3 border-t flex items-start gap-2" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <ShieldAlert size={14} style={{ color: 'var(--nav-text)', marginTop: 2 }} />
          <div className="text-[10px] leading-snug" style={{ color: 'var(--nav-text)' }}>
            Conceptual Digital Twin Prototype — Simulated Data. Demonstrates the framework of Kapitel 5, not a live OEM system.
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
