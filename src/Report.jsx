import { calculate } from './calculator'

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const fmtRate = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const fmtShort = (v) => {
  const abs = Math.abs(v)
  if (abs >= 1e9) return '$' + (abs / 1e9).toFixed(1) + 'B'
  if (abs >= 1e6) return '$' + (abs / 1e6).toFixed(1) + 'M'
  if (abs >= 1e3) return '$' + (abs / 1e3).toFixed(0) + 'K'
  return fmt.format(abs)
}

function negVal(v) {
  if (v === 0) return <span className="cf-val zero">$0</span>
  return <span className="cf-val neg">{'\u2013' + fmt.format(Math.abs(v))}</span>
}
function posVal(v) {
  if (v === 0) return <span className="cf-val zero">$0</span>
  return <span className="cf-val pos">+{fmt.format(v)}</span>
}
function zeroVal() {
  return <span className="cf-val zero">$0</span>
}
function netNeg(v) {
  return <span className="net-val neg">{'\u2013' + fmt.format(Math.abs(v))}</span>
}
function netPos(v) {
  return <span className="net-val pos">+{fmt.format(v)}</span>
}

export default function Report({ inputs, toggles = {}, onToggle, onBack, embedded }) {
  const r = calculate(inputs, toggles)
  const t = { financing: true, capacity_market: true, ancillary: true, arbitrage: true, ...toggles }
  if (t.early_revenue === undefined) t.early_revenue = t.financing
  const {
    capacity_mw, timeframe_years, peaker_utilization_pct,
    peaker_om_per_mwh, dr_cost_per_kw_yr,
    peaker_capital_per_mw, build_years, interest_rate_pct, deploy_years,
    capacity_market_per_mw_yr, ancillary_per_mw_yr,
    arbitrage_days, arbitrage_hours, arbitrage_spread_per_mwh,
  } = inputs

  const dr_kw = capacity_mw * 1000
  const peaker_annual_interest = r.peaker_capital * (interest_rate_pct / 100)

  return (
    <div className="page">
      {!embedded && (
        <div className="report-actions">
          <button className="btn-back" onClick={onBack}>&larr; Edit inputs</button>
          <button className="btn-print" onClick={() => window.print()}>Print / Save as PDF</button>
        </div>
      )}

      <div className="header">
        <p className="header-eyebrow">Utility financial analysis</p>
        <h1>Demand Response vs. Gas Peaker Plant</h1>
        <p>A {timeframe_years}-year cash flow comparison from the utility&rsquo;s point of view &mdash; costs are negative, revenue is positive.</p>
      </div>

      <div className="chips">
        <span className="chip-purple"><strong>{capacity_mw} MW</strong> capacity</span>
        <span className="chip-blue"><strong>{peaker_utilization_pct}% utilization</strong></span>
        <span className="chip-orange">Peaker O&amp;M <strong>~{fmt.format(peaker_om_per_mwh)}/MWh</strong></span>
        <span className="chip-green">DR cost <strong>{fmt.format(dr_cost_per_kw_yr)}/kW-yr</strong></span>
        <span className="chip-amber">Timeframe <strong>{timeframe_years} years</strong></span>
      </div>

      <div className="table-card">
        <div className="table-header">
          <span>Cash flow item</span><span>Gas peaker</span><span>Demand Response</span>
        </div>
        <p className="group-label">Capital expenditure</p>
        <div className="cf-row">
          <span className="cf-label">Plant / system construction</span>
          {negVal(r.peaker_capital)}
          {zeroVal()}
        </div>
        <p className="group-label">Operating costs ({timeframe_years} years)</p>
        <div className="cf-row">
          <span className="cf-label">Fuel + O&amp;M</span>
          {negVal(r.peaker_om_total)}
          {zeroVal()}
        </div>
        <div className="cf-row">
          <span className="cf-label">Demand Response costs to utility</span>
          {zeroVal()}
          {negVal(r.dr_cost_total)}
        </div>
        <p className="group-label">Timeline (pre-operational period)</p>
        <div className={`cf-row ${!t.financing ? 'cf-row-off' : ''}`}>
          <span className="cf-label">Financing costs during build</span>
          {negVal(r.financing_cost)}
          {zeroVal()}
        </div>
        <div className={`cf-row ${!t.early_revenue ? 'cf-row-off' : ''}`}>
          <span className="cf-label">Early grid services revenue ({r.early_revenue_years} extra yrs)</span>
          {zeroVal()}
          {r.early_revenue > 0 ? posVal(r.early_revenue) : zeroVal()}
        </div>
        <p className="group-label">Grid services revenue ({timeframe_years} years)</p>
        <div className={`cf-row ${!t.capacity_market ? 'cf-row-off' : ''}`}>
          <span className="cf-label">Capacity market payments</span>
          {zeroVal()}
          {posVal(r.capacity_market_total)}
        </div>
        <div className={`cf-row ${!t.ancillary ? 'cf-row-off' : ''}`}>
          <span className="cf-label">Ancillary services</span>
          {zeroVal()}
          {posVal(r.ancillary_total)}
        </div>
        <div className={`cf-row ${!t.arbitrage ? 'cf-row-off' : ''}`}>
          <span className="cf-label">Energy arbitrage</span>
          {zeroVal()}
          {posVal(r.arbitrage_total)}
        </div>
        <div className="net-row">
          <div>
            <p className="net-label">Net {timeframe_years}-year position</p>
            <p className="net-sub">Total costs + total revenue</p>
          </div>
          {netNeg(r.peaker_net)}
          {r.dr_net >= 0 ? netPos(r.dr_net) : netNeg(Math.abs(r.dr_net))}
        </div>
      </div>

      <div className="advantage-band">
        <div className="advantage-left">
          <p className="advantage-label">Demand Response advantage over building a peaker</p>
          <p className="advantage-math">
            DR net ({r.dr_net >= 0 ? '+' : '\u2013'}{fmtShort(r.dr_net)}) minus peaker net ({'\u2013'}{fmtShort(Math.abs(r.peaker_net))}) = {fmtShort(r.total_advantage)} swing
          </p>
          <p className="advantage-math">
            {fmtShort(r.peaker_capital)} avoided capital &nbsp;+&nbsp;
            {fmtShort(r.peaker_om_total)} avoided O&amp;M
            {t.financing && <>&nbsp;+&nbsp;{fmtShort(r.financing_cost)} avoided financing</>}
            {(r.capacity_market_total + r.ancillary_total + r.arbitrage_total + r.early_revenue) > 0 && (
              <>&nbsp;+&nbsp;{fmtShort(r.capacity_market_total + r.ancillary_total + r.arbitrage_total + r.early_revenue)} grid services revenue</>
            )}
            &nbsp;&ndash;&nbsp;{fmtShort(r.dr_cost_total)} DR costs
          </p>
        </div>
        <span className="advantage-val">{fmt.format(r.total_advantage)}</span>
      </div>

      <p className="section-heading">How we got to these numbers</p>

      <div className="assumptions-card">
        <div className="assumption-row">
          <div className="assumption-left">
            <div className="timeline-header-label" style={{ color: '#e8734e' }}>Capital expenditure</div>
            <div className="timeline-years">Plant construction</div>
            <div className="timeline-body">Building a new gas peaker plant costs utilities between $950,000 and $1,300,000 per megawatt. We used {fmtRate.format(peaker_capital_per_mw)}/MW as a conservative midpoint based on current U.S. industry data. Demand Response requires zero construction capital.</div>
          </div>

          <div className="assumption-right assumption-impact-col">
            <div className="timeline-impact neg-bg">
              <div className="timeline-impact-label">Gas peaker capital cost</div>
              <div className="timeline-impact-val neg">{'\u2013'}{fmt.format(r.peaker_capital)}</div>
              <div className="timeline-impact-sub">{capacity_mw} MW &times; {fmtRate.format(peaker_capital_per_mw)}/MW</div>
            </div>
          </div>
        </div>

        <div className="assumption-row">
          <div className="assumption-left">
            <div className="timeline-header-label" style={{ color: '#e8734e' }}>Operating costs</div>
            <div className="timeline-years">Fuel + O&amp;M</div>
            <div className="timeline-body">A peaker running at {peaker_utilization_pct}% utilization operates roughly {Math.round(r.peaker_hours_yr).toLocaleString()} hours per year ({peaker_utilization_pct}% of 8,760 annual hours). At approximately {fmt.format(peaker_om_per_mwh)}/MWh, this covers natural gas fuel, scheduled maintenance, and staffing. Demand Response has no fuel or maintenance cost to the utility.</div>
          </div>

          <div className="assumption-right assumption-impact-col">
            <div className="timeline-impact neg-bg">
              <div className="timeline-impact-label">Peaker O&amp;M over {timeframe_years} years</div>
              <div className="timeline-impact-val neg">{'\u2013'}{fmt.format(r.peaker_om_total)}</div>
              <div className="timeline-impact-sub">{capacity_mw} MW &times; {Math.round(r.peaker_hours_yr).toLocaleString()} hrs/yr &times; {fmt.format(peaker_om_per_mwh)}/MWh &times; {timeframe_years} yrs</div>
            </div>
          </div>
        </div>

        <div className="assumption-row">
          <div className="assumption-left">
            <div className="timeline-header-label" style={{ color: '#e8734e' }}>Operating costs</div>
            <div className="timeline-years">Demand Response costs</div>
            <div className="timeline-body">{capacity_mw} MW equals {dr_kw.toLocaleString()} kilowatts. The Demand Response Program charges the utility {fmt.format(dr_cost_per_kw_yr)} per kilowatt per year &mdash; a capacity fee for having battery storage available and dispatchable on the grid. This is the utility&rsquo;s only cost. No construction risk, no fuel exposure, no maintenance obligations.</div>
          </div>

          <div className="assumption-right assumption-impact-col">
            <div className="timeline-impact neg-bg">
              <div className="timeline-impact-label">DR cost over {timeframe_years} years</div>
              <div className="timeline-impact-val neg">{'\u2013'}{fmt.format(r.dr_cost_total)}</div>
              <div className="timeline-impact-sub">{dr_kw.toLocaleString()} kW &times; {fmt.format(dr_cost_per_kw_yr)}/kW-yr &times; {timeframe_years} yrs</div>
            </div>
          </div>
        </div>

        <div className={`assumption-row ${!t.financing ? 'cf-row-off' : ''}`}>
          <div className="assumption-left">
            <div className="timeline-header-label" style={{ color: '#e8734e' }}>Financing</div>
            <div className="timeline-years">Costs during build</div>
            <div className="timeline-body">A gas peaker takes an average of {build_years} years to permit and build. During that period the utility borrows {fmt.format(r.peaker_capital)} and pays interest before the plant generates a single watt. At a {interest_rate_pct}% cost of capital that is {fmt.format(peaker_annual_interest)}/year. Demand Response deploys in {deploy_years} year{deploy_years !== 1 ? 's' : ''} with zero borrowed capital.</div>
          </div>

          <div className="assumption-right assumption-impact-col">
            <div className="timeline-impact neg-bg">
              <div className="timeline-impact-label">Interest cost over {build_years} years</div>
              <div className="timeline-impact-val neg">{'\u2013'}{fmt.format(r.financing_cost)}</div>
              <div className="timeline-impact-sub">{fmt.format(r.peaker_capital)} &times; {interest_rate_pct}% &times; {build_years} yrs</div>
            </div>
          </div>
        </div>

        <div className={`assumption-row ${!t.early_revenue ? 'cf-row-off' : ''}`}>
          <div className="assumption-left">
            <div className="timeline-header-label" style={{ color: '#34d399' }}>Early revenue</div>
            <div className="timeline-years">{r.early_revenue_years} extra years of revenue</div>
            <div className="timeline-body">Demand Response deploys in {deploy_years} year{deploy_years !== 1 ? 's' : ''}, earning {r.early_revenue_years} full years of grid services revenue ({build_years} &ndash; {deploy_years} = {r.early_revenue_years}) before the peaker is even operational. Revenue the peaker utility simply never earns.</div>
          </div>

          <div className="assumption-right assumption-impact-col">
            <div className="timeline-impact pos-bg">
              <div className="timeline-impact-label">Grid services head start</div>
              <div className="timeline-impact-val pos">+{fmt.format(r.early_revenue)}</div>
              <div className="timeline-impact-sub">{fmt.format(r.grid_services_annual)}/yr &times; {r.early_revenue_years} yrs</div>
            </div>
          </div>
        </div>

        <div className={`assumption-row ${!t.capacity_market ? 'cf-row-off' : ''}`}>
          <div className="assumption-left">
            <div className="timeline-header-label" style={{ color: '#34d399' }}>Grid services</div>
            <div className="timeline-years">Capacity market</div>
            <div className="timeline-body">Grid operators pay utilities for having reliable, dispatchable capacity available, even if never called upon. <strong>This is not a usage-based payment</strong> &mdash; the utility earns it simply by having capacity committed 24/7. We used {fmtRate.format(capacity_market_per_mw_yr)}/MW-yr as a conservative midpoint of the $50K&ndash;$100K market range.</div>
          </div>

          <div className="assumption-right assumption-impact-col">
            <div className="timeline-impact pos-bg">
              <div className="timeline-impact-label">Capacity revenue over {timeframe_years} years</div>
              <div className="timeline-impact-val pos">+{fmt.format(r.capacity_market_total)}</div>
              <div className="timeline-impact-sub">{capacity_mw} MW &times; {fmtRate.format(capacity_market_per_mw_yr)}/MW-yr &times; {timeframe_years} yrs</div>
            </div>
          </div>
        </div>

        <div className={`assumption-row ${!t.ancillary ? 'cf-row-off' : ''}`}>
          <div className="assumption-left">
            <div className="timeline-header-label" style={{ color: '#34d399' }}>Grid services</div>
            <div className="timeline-years">Ancillary services</div>
            <div className="timeline-body">Grid operators pay a premium for resources that respond in milliseconds to keep grid frequency stable. Batteries respond instantaneously &mdash; gas turbines take 5&ndash;15 minutes. <strong>This is not a 24/7 dispatch</strong> &mdash; the battery earns revenue by being enrolled and responding to short, intermittent calls. Gas peakers earn $0 here.</div>
          </div>

          <div className="assumption-right assumption-impact-col">
            <div className="timeline-impact pos-bg">
              <div className="timeline-impact-label">Ancillary revenue over {timeframe_years} years</div>
              <div className="timeline-impact-val pos">+{fmt.format(r.ancillary_total)}</div>
              <div className="timeline-impact-sub">{capacity_mw} MW &times; {fmtRate.format(ancillary_per_mw_yr)}/MW-yr &times; {timeframe_years} yrs</div>
            </div>
          </div>
        </div>

        <div className={`assumption-row ${!t.arbitrage ? 'cf-row-off' : ''}`}>
          <div className="assumption-left">
            <div className="timeline-header-label" style={{ color: '#34d399' }}>Grid services</div>
            <div className="timeline-years">Energy arbitrage</div>
            <div className="timeline-body">Assumes <strong>{arbitrage_days} dispatch days per year</strong> with <strong>{arbitrage_hours * 60} minutes of dispatch per day</strong> at a {fmt.format(arbitrage_spread_per_mwh)}/MWh off-peak/peak price spread. The battery&rsquo;s primary role is grid reliability &mdash; arbitrage is a conservative secondary benefit.</div>
          </div>

          <div className="assumption-right assumption-impact-col">
            <div className="timeline-impact pos-bg">
              <div className="timeline-impact-label">Arbitrage revenue over {timeframe_years} years</div>
              <div className="timeline-impact-val pos">+{fmt.format(r.arbitrage_total)}</div>
              <div className="timeline-impact-sub">{capacity_mw} MW &times; {arbitrage_hours} hrs &times; {arbitrage_days} days &times; {fmt.format(arbitrage_spread_per_mwh)}/MWh &times; {timeframe_years} yrs</div>
            </div>
          </div>
        </div>
      </div>



      <div className="footer">
        Analysis prepared for Demand Response Program conversations &nbsp;&middot;&nbsp; Assumptions based on publicly available U.S. energy market data &nbsp;&middot;&nbsp; 2025
      </div>
    </div>
  )
}
