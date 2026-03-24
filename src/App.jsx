import { useState } from 'react'
import { FormFields } from './InputForm'
import Report from './Report'

const DEFAULTS = {
  capacity_mw: 100,
  timeframe_years: 20,
  peaker_utilization_pct: 10,
  peaker_om_per_mwh: 130,
  peaker_capital_per_mw: 1100000,
  dr_cost_per_kw_yr: 100,
  build_years: 4,
  interest_rate_pct: 5,
  deploy_years: 1,
  capacity_market_per_mw_yr: 75000,
  ancillary_per_mw_yr: 40000,
  arbitrage_days: 300,
  arbitrage_hours: 0.5,
  arbitrage_spread_per_mwh: 25,
}

const DEFAULT_TOGGLES = {
  financing: true,
  capacity_market: true,
  ancillary: true,
  arbitrage: true,
}

export default function App() {
  const [inputs, setInputs] = useState(DEFAULTS)
  const [toggles, setToggles] = useState(DEFAULT_TOGGLES)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  function handleChange(name, value) {
    setInputs(prev => ({ ...prev, [name]: value }))
  }

  function handleToggle(key) {
    setToggles(prev => {
      const next = { ...prev, [key]: !prev[key] }
      if (key === 'financing') next.early_revenue = next.financing
      return next
    })
  }

  return (
    <div className="report-layout">
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header sidebar-header-mobile">
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>&times;</button>
        </div>
        <div className="sidebar-body">
          <h2 className="sidebar-title">Assumptions</h2>
          <FormFields inputs={inputs} onChange={handleChange} toggles={toggles} onToggle={handleToggle} />
        </div>
      </aside>
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <main className="report-main">
        <div className="report-actions">
          <button className="btn-back sidebar-toggle" onClick={() => setSidebarOpen(o => !o)}>Adjust assumptions</button>
          <button className="btn-print" onClick={() => window.print()}>Print / Save as PDF</button>
        </div>
        <Report inputs={inputs} toggles={toggles} onToggle={handleToggle} embedded />
      </main>
    </div>
  )
}
