# PeakerVsDemandResponse

A React calculator app that compares the total cost of building a gas peaker
plant vs. deploying a Wattsmart demand response battery program.

## Quick start

```bash
npm create vite@latest . -- --template react
npm install
npm run dev
```

## How to build with Claude Code CLI

```bash
cd /Users/gilbertlee/Documents/Github/PeakerVsDemandResponse
claude
```

Then paste this prompt:

> Please read CLAUDE.md in full, then read reference/wattsmart_vs_peaker.html
> in full. Build the app exactly as specified. Start with calculator.js,
> then styles.css, then InputForm.jsx, then Report.jsx, then App.jsx.

## Reference file
`reference/wattsmart_vs_peaker.html` — the finished static report this app
is based on. All CSS and layout should match it exactly.
