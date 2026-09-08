import { HashRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ExecutiveOverview from './pages/ExecutiveOverview'
import SupplyNetwork from './pages/SupplyNetwork'
import ResilienceKpis from './pages/ResilienceKpis'
import EarlyWarningCenter from './pages/EarlyWarningCenter'
import ScenarioSimulation from './pages/ScenarioSimulation'
import DecisionCenter from './pages/DecisionCenter'
import Architecture from './pages/Architecture'
import Methodology from './pages/Methodology'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<ExecutiveOverview />} />
          <Route path="/network" element={<SupplyNetwork />} />
          <Route path="/kpis" element={<ResilienceKpis />} />
          <Route path="/alerts" element={<EarlyWarningCenter />} />
          <Route path="/simulation" element={<ScenarioSimulation />} />
          <Route path="/decision" element={<DecisionCenter />} />
          <Route path="/architecture" element={<Architecture />} />
          <Route path="/methodology" element={<Methodology />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
