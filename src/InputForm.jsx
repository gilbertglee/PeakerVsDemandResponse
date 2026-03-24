import { useState } from 'react'

function formatWithCommas(v) {
  const str = String(v)
  const [int, dec] = str.split('.')
  const formatted = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return dec !== undefined ? formatted + '.' + dec : formatted
}

function Field({ label, name, value, unit, onChange, hint }) {
  const [focused, setFocused] = useState(false)
  const [raw, setRaw] = useState('')

  function handleFocus() {
    setRaw(String(value))
    setFocused(true)
  }

  function handleBlur() {
    setFocused(false)
    const parsed = parseFloat(raw) || 0
    onChange({ target: { name, value: String(parsed) } })
  }

  function handleInput(e) {
    setRaw(e.target.value)
    const parsed = parseFloat(e.target.value)
    if (!isNaN(parsed)) onChange({ target: { name, value: e.target.value } })
  }

  return (
    <div className="form-field">
      <label>{label}</label>
      {hint && <p className="form-hint">{hint}</p>}
      <div className="input-wrap">
        <input
          type={focused ? 'number' : 'text'}
          name={name}
          value={focused ? raw : formatWithCommas(value)}
          onChange={focused ? handleInput : undefined}
          onFocus={handleFocus}
          onBlur={handleBlur}
          step="any"
          readOnly={!focused}
        />
        <span className="unit">{unit}</span>
      </div>
    </div>
  )
}

function SectionToggle({ checked, onChange }) {
  return (
    <button
      className={`toggle-switch ${checked ? 'toggle-on' : 'toggle-off'}`}
      onClick={onChange}
      aria-label="Include in calculation"
    >
      <span className="toggle-knob" />
    </button>
  )
}

function FormFields({ inputs, onChange, toggles, onToggle }) {
  function handleChange(e) {
    onChange(e.target.name, parseFloat(e.target.value) || 0)
  }

  const t = { financing: true, capacity_market: true, ancillary: true, arbitrage: true, ...toggles }

  return (
    <>
      <div className="form-card">
        <h2>System</h2>
        <div className="form-grid">
          <Field label="System capacity" name="capacity_mw" value={inputs.capacity_mw} unit="MW" onChange={handleChange} hint="Size of the peaker plant or equivalent demand response fleet" />
          <Field label="Comparison timeframe" name="timeframe_years" value={inputs.timeframe_years} unit="years" onChange={handleChange} hint="Standard utility asset lifecycle for gas plants" />
          <Field label="Peaker utilization" name="peaker_utilization_pct" value={inputs.peaker_utilization_pct} unit="%" onChange={handleChange} hint="Industry range 5-15%; GAO defines peakers at ≤15%" />
          <Field label="Peaker O&amp;M rate" name="peaker_om_per_mwh" value={inputs.peaker_om_per_mwh} unit="$/MWh" onChange={handleChange} hint="Industry range $110-$150/MWh; includes fuel + maintenance" />
          <Field label="Peaker capital cost" name="peaker_capital_per_mw" value={inputs.peaker_capital_per_mw} unit="$/MW" onChange={handleChange} hint="Range $950K-$1.3M/MW; midpoint of current U.S. data" />
          <Field label="Demand Response cost" name="dr_cost_per_kw_yr" value={inputs.dr_cost_per_kw_yr} unit="$/kW-yr" onChange={handleChange} hint="Annual capacity fee paid by the utility for demand response" />
        </div>
      </div>

      <div className={`form-card ${!t.financing ? 'form-card-off' : ''}`}>
        <div className="form-card-header">
          <h2>Financing (peaker build period)</h2>
          {onToggle && <SectionToggle checked={t.financing} onChange={() => onToggle('financing')} />}
        </div>
        <div className="form-grid">
          <Field label="Peaker build period" name="build_years" value={inputs.build_years} unit="years" onChange={handleChange} hint="Typical 3-5 yr range for permitting + construction" />
          <Field label="Cost of capital / interest rate" name="interest_rate_pct" value={inputs.interest_rate_pct} unit="%" onChange={handleChange} hint="Typical utility borrowing rate for infrastructure projects" />
          <Field label="Demand Response deployment time" name="deploy_years" value={inputs.deploy_years} unit="year" onChange={handleChange} hint="Enrollment ramp to aggregate target MW from existing batteries" />
        </div>
      </div>

      <div className={`form-card ${!t.capacity_market ? 'form-card-off' : ''}`}>
        <div className="form-card-header">
          <h2>Capacity market payments</h2>
          {onToggle && <SectionToggle checked={t.capacity_market} onChange={() => onToggle('capacity_market')} />}
        </div>
        <div className="form-grid">
          <Field label="Annual rate per MW" name="capacity_market_per_mw_yr" value={inputs.capacity_market_per_mw_yr} unit="$/MW-yr" onChange={handleChange} hint="Conservative midpoint of $50K-$100K/MW-yr market range" />
        </div>
      </div>

      <div className={`form-card ${!t.ancillary ? 'form-card-off' : ''}`}>
        <div className="form-card-header">
          <h2>Ancillary services</h2>
          {onToggle && <SectionToggle checked={t.ancillary} onChange={() => onToggle('ancillary')} />}
        </div>
        <div className="form-grid">
          <Field label="Annual rate per MW" name="ancillary_per_mw_yr" value={inputs.ancillary_per_mw_yr} unit="$/MW-yr" onChange={handleChange} hint="Frequency regulation revenue; batteries qualify due to sub-second response. Typical U.S. rates range from $25,000–$60,000/MW-yr. Default of $40,000 reflects a mid-range estimate across PJM, CAISO, and ERCOT markets." />
        </div>
      </div>

      <div className={`form-card ${!t.arbitrage ? 'form-card-off' : ''}`}>
        <div className="form-card-header">
          <h2>Energy arbitrage</h2>
          {onToggle && <SectionToggle checked={t.arbitrage} onChange={() => onToggle('arbitrage')} />}
        </div>
        <div className="form-grid">
          <Field label="Dispatch days per year" name="arbitrage_days" value={inputs.arbitrage_days} unit="days" onChange={handleChange} hint="Most weekdays; conservative estimate excluding holidays" />
          <Field label="Dispatch hours per day" name="arbitrage_hours" value={inputs.arbitrage_hours} unit="hours" onChange={handleChange} hint="Brief daily dispatch; primary role is grid reliability" />
          <Field label="Price spread" name="arbitrage_spread_per_mwh" value={inputs.arbitrage_spread_per_mwh} unit="$/MWh" onChange={handleChange} hint="Typical off-peak to peak price difference in U.S. markets" />
        </div>
      </div>
    </>
  )
}

export { FormFields }

export default function InputForm({ inputs, onChange, onGenerate }) {
  return (
    <div className="page">
      <div className="header">
        <p className="header-eyebrow">Utility financial analysis</p>
        <h1>Demand Response vs. Gas Peaker Plant</h1>
        <p>Configure your assumptions, then generate a full cash flow report.</p>
      </div>

      <FormFields inputs={inputs} onChange={onChange} />

      <button className="btn-generate" onClick={onGenerate}>
        Generate Report &rarr;
      </button>
    </div>
  )
}
