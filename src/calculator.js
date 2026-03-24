export function calculate(inputs, toggles = {}) {
  const {
    capacity_mw, timeframe_years,
    peaker_utilization_pct, peaker_om_per_mwh, peaker_capital_per_mw,
    dr_cost_per_kw_yr,
    build_years, interest_rate_pct, deploy_years,
    capacity_market_per_mw_yr, ancillary_per_mw_yr,
    arbitrage_days, arbitrage_hours, arbitrage_spread_per_mwh,
  } = inputs

  const t = {
    financing: true,
    capacity_market: true, ancillary: true, arbitrage: true,
    ...toggles,
  }
  if (t.early_revenue === undefined) t.early_revenue = t.financing

  const peaker_hours_yr = 8760 * (peaker_utilization_pct / 100)
  const dr_kw = capacity_mw * 1000

  const peaker_capital        = capacity_mw * peaker_capital_per_mw
  const peaker_om_annual      = capacity_mw * peaker_hours_yr * peaker_om_per_mwh
  const peaker_om_total       = peaker_om_annual * timeframe_years
  const dr_cost_annual = dr_kw * dr_cost_per_kw_yr
  const dr_cost_total  = dr_cost_annual * timeframe_years

  const financing_cost        = t.financing ? peaker_capital * (interest_rate_pct / 100) * build_years : 0
  const early_revenue_years   = build_years - deploy_years
  const grid_services_annual  =
    (t.capacity_market ? capacity_mw * capacity_market_per_mw_yr : 0) +
    (t.ancillary ? capacity_mw * ancillary_per_mw_yr : 0) +
    (t.arbitrage ? capacity_mw * arbitrage_hours * arbitrage_days * arbitrage_spread_per_mwh : 0)
  const early_revenue         = t.early_revenue ? grid_services_annual * early_revenue_years : 0

  const capacity_market_total = t.capacity_market ? capacity_mw * capacity_market_per_mw_yr * timeframe_years : 0
  const ancillary_total       = t.ancillary ? capacity_mw * ancillary_per_mw_yr * timeframe_years : 0
  const arbitrage_total       = t.arbitrage
    ? capacity_mw * arbitrage_hours * arbitrage_days * arbitrage_spread_per_mwh * timeframe_years : 0

  const peaker_net    = -(peaker_capital + peaker_om_total + financing_cost)
  const dr_net = -dr_cost_total + capacity_market_total +
                         ancillary_total + arbitrage_total + early_revenue

  const total_advantage = dr_net - peaker_net

  return {
    peaker_capital, peaker_om_annual, peaker_om_total,
    dr_cost_annual, dr_cost_total,
    financing_cost, early_revenue_years, early_revenue, grid_services_annual,
    capacity_market_total, ancillary_total, arbitrage_total,
    peaker_net, dr_net, total_advantage, peaker_hours_yr,
  }
}
