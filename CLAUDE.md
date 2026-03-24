# PeakerVsDemandResponse — Claude Code Project Spec

## What this is
A single-page React web app that lets a user input all assumptions for a
Wattsmart (demand response battery) vs. Gas Peaker Plant financial comparison,
then renders a fully calculated, print-ready report.

## Tech stack
- React (Vite scaffold)
- No backend — all calculations in JavaScript on the client
- Tailwind CSS for layout and spacing
- Light mode only, matching the visual style in `reference/wattsmart_vs_peaker.html`

## Project structure
```
PeakerVsDemandResponse/
  CLAUDE.md                         ← this file
  reference/
    wattsmart_vs_peaker.html        ← existing report (reuse CSS + layout exactly)
  src/
    App.jsx                         ← root, holds form state, switches screens
    InputForm.jsx                   ← Screen 1: all input fields
    Report.jsx                      ← Screen 2: rendered report
    calculator.js                   ← pure functions, ALL math lives here
    styles.css                      ← extracted + extended from reference HTML
  index.html
  vite.config.js
  package.json
```

## Screen 1 — InputForm
A clean form with five labeled sections. Pre-fill all defaults so the user can
hit "Generate Report" immediately without changing anything.

### Section 1 — System
| Field | Input name | Default | Unit |
|---|---|---|---|
| System capacity | capacity_mw | 100 | MW |
| Comparison timeframe | timeframe_years | 20 | years |
| Peaker utilization | peaker_utilization_pct | 10 | % |
| Peaker O&M rate | peaker_om_per_mwh | 129.85 | $/MWh |
| Peaker capital cost | peaker_capital_per_mw | 1100000 | $/MW |
| Wattsmart cost | wattsmart_cost_per_kw_yr | 100 | $/kW-yr |

### Section 2 — Financing (peaker build period)
| Field | Input name | Default | Unit |
|---|---|---|---|
| Peaker build period | build_years | 4 | years |
| Cost of capital / interest rate | interest_rate_pct | 5 | % |
| Wattsmart deployment time | deploy_years | 1 | year |

### Section 3 — Capacity market payments
| Field | Input name | Default | Unit |
|---|---|---|---|
| Annual rate per MW | capacity_market_per_mw_yr | 75000 | $/MW-yr |

### Section 4 — Ancillary services
| Field | Input name | Default | Unit |
|---|---|---|---|
| Annual rate per MW | ancillary_per_mw_yr | 40000 | $/MW-yr |

### Section 5 — Energy arbitrage
| Field | Input name | Default | Unit |
|---|---|---|---|
| Dispatch days per year | arbitrage_days | 300 | days |
| Dispatch hours per day | arbitrage_hours | 0.5 | hours |
| Price spread | arbitrage_spread_per_mwh | 25 | $/MWh |

CTA: Large "Generate Report →" button at bottom navigates to Screen 2.

## Screen 2 — Report
Renders the exact same layout as `reference/wattsmart_vs_peaker.html` with all
hardcoded numbers replaced by values calculated from the inputs.

- "← Edit inputs" button at top-left returns to Screen 1, preserving all values
- "Print / Save as PDF" button at top-right calls window.print()
- Assumption blocks below the table explain every formula using actual input values

## calculator.js — all formulas (pure functions, no side effects)

```js
export function calculate(inputs) {
  const {
    capacity_mw, timeframe_years,
    peaker_utilization_pct, peaker_om_per_mwh, peaker_capital_per_mw,
    wattsmart_cost_per_kw_yr,
    build_years, interest_rate_pct, deploy_years,
    capacity_market_per_mw_yr, ancillary_per_mw_yr,
    arbitrage_days, arbitrage_hours, arbitrage_spread_per_mwh,
  } = inputs

  const peaker_hours_yr = 8760 * (peaker_utilization_pct / 100)
  const wattsmart_kw = capacity_mw * 1000

  // Costs
  const peaker_capital        = capacity_mw * peaker_capital_per_mw
  const peaker_om_annual      = capacity_mw * peaker_hours_yr * peaker_om_per_mwh
  const peaker_om_total       = peaker_om_annual * timeframe_years
  const wattsmart_cost_annual = wattsmart_kw * wattsmart_cost_per_kw_yr
  const wattsmart_cost_total  = wattsmart_cost_annual * timeframe_years

  // Timeline (pre-operational)
  const financing_cost        = peaker_capital * (interest_rate_pct / 100) * build_years
  const early_revenue_years   = build_years - deploy_years
  const grid_services_annual  =
    capacity_mw * capacity_market_per_mw_yr +
    capacity_mw * ancillary_per_mw_yr +
    capacity_mw * arbitrage_hours * arbitrage_days * arbitrage_spread_per_mwh
  const early_revenue         = grid_services_annual * early_revenue_years

  // 20-year revenue
  const capacity_market_total = capacity_mw * capacity_market_per_mw_yr * timeframe_years
  const ancillary_total       = capacity_mw * ancillary_per_mw_yr * timeframe_years
  const arbitrage_total       =
    capacity_mw * arbitrage_hours * arbitrage_days * arbitrage_spread_per_mwh * timeframe_years

  // Net positions (peaker includes timeline costs, wattsmart includes early revenue)
  const peaker_net    = -(peaker_capital + peaker_om_total + financing_cost)
  const wattsmart_net = -wattsmart_cost_total + capacity_market_total +
                         ancillary_total + arbitrage_total + early_revenue

  const total_advantage = wattsmart_net - peaker_net

  return {
    peaker_capital, peaker_om_annual, peaker_om_total,
    wattsmart_cost_annual, wattsmart_cost_total,
    financing_cost, early_revenue_years, early_revenue, grid_services_annual,
    capacity_market_total, ancillary_total, arbitrage_total,
    peaker_net, wattsmart_net, total_advantage, peaker_hours_yr,
  }
}
```

## Visual style rules (preserve exactly from reference HTML)
- Page background: #f5f4f0
- Cards: white bg, `border: 0.5px solid #d3d1c7`, `border-radius: 12px`
- Table header row bg: #f5f4f0
- Negative dollar values: `color: #993c1d`
- Positive dollar values: `color: #0f6e56`
- Zero / n/a values: `color: #b4b2a9`
- Section group labels: 10px, uppercase, letter-spacing 0.07em, color #b4b2a9
- Advantage band: `background: #e1f5ee`, `border: 0.5px solid #9fe1cb`
- Timeline cards: two equal columns separated by a `1px solid #d3d1c7` divider
- Assumption blocks: 200px left column (label + formula) + flex-right (explanation)
- Financing cost box (peaker): `background: #fcebeb`
- Early revenue box (wattsmart): `background: #e1f5ee`
- Font stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif`
- Chips/pills: `border-radius: 99px`, white bg, `border: 0.5px solid #d3d1c7`
- Blue chip (sourced): `background: #e6f1fb`, `border: 0.5px solid #b5d4f4`, `color: #185fa5`

## Number formatting rules
- All currency: `Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })`
- Negative values in table: prefix with `–` (en-dash U+2013), e.g. `–$110,000,000`
- Positive revenue values: prefix with `+`, e.g. `+$150,000,000`
- Zero values: display as `$0` in muted gray
- Percentages: one decimal place, e.g. `10.0%`
- Large rates ($/MW-yr): format with commas, e.g. `$75,000/MW-yr`

## Chips to show on report (auto-generated from inputs)
- `{capacity_mw} MW capacity`
- `{peaker_utilization_pct}% utilization — sourced below` (blue chip)
- `Peaker O&M ~${peaker_om_per_mwh}/MWh`
- `Wattsmart cost $${wattsmart_cost_per_kw_yr}/kW-yr`
- `Timeframe ${timeframe_years} years`

## Report table sections
The cash flow table has four group sections in this order:
1. Capital expenditure
2. Operating costs ({timeframe_years} years)
3. Timeline (pre-operational period)
4. Grid services revenue ({timeframe_years} years)
Followed by: Net position row

## Assumption blocks (below the table on report)
Each assumption block uses the two-column card style.
Left column: short label + monospace formula showing actual input values.
Right column: plain-English explanation.

Generate one block for each of these:
1. Plant construction — Gas peaker
2. Fuel + O&M — Gas peaker
3. Wattsmart costs to utility
4. Financing costs during build
5. Grid services revenue — 3 extra years
6. Capacity market payments
7. Ancillary services
8. Energy arbitrage

## Sources section (below assumptions)
Blue box titled "Why we used X% utilization for the gas peaker" with four
bullet rows citing Thunder Said Energy, U.S. GAO (2024), Siemens Energy,
and industry consensus. Dynamically insert the actual utilization % from inputs.

## Caveat box (amber/orange)
"Important caveat: Grid services revenue figures are estimates based on
comparable U.S. energy markets..."

## Print styles
@media print:
- Hide "Edit inputs" and "Print" buttons
- Force white background on body and all cards
- No page margins
- Prevent table-card from breaking across pages

## How to start development
```bash
cd /Users/gilbertlee/Documents/Github/PeakerVsDemandResponse
npm create vite@latest . -- --template react
npm install
cp /Users/gilbertlee/Desktop/wattsmart_vs_peaker.html reference/
npm run dev
```

Open http://localhost:5173 in your browser.

## Key instruction for Claude Code
When building this app, start by reading `reference/wattsmart_vs_peaker.html`
in full. Extract all CSS classes verbatim into `src/styles.css`. Then build
`src/calculator.js` with the formulas above. Then build `InputForm.jsx` and
`Report.jsx` as separate components, wiring them together in `App.jsx` with a
single `inputs` state object and a `screen` toggle ('form' | 'report').

Do not use any component library. Use only the CSS from the reference file.
Keep the entire app in these four files — do not split further unless asked.
