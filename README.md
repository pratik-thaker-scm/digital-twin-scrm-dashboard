# SCRM Digital Twin — Resilience Command Center

**Live demo:** https://pratik-thaker-scm.github.io/digital-twin-scrm-dashboard/

A conceptual, interactive Digital Twin Supply Chain Resilience Dashboard - the practical prototype implementation of the framework described in Kapitel 5 of the thesis *"Steigerung der Resilienz und Risikominimierung im Supply Chain Management der Automobilindustrie durch den Einsatz digitaler Zwillinge."*

> **All data in this application is simulated.** It demonstrates the thesis's conceptual framework - it is not connected to a real OEM, ERP system, or live supplier feed. See the in-app Methodology page for the full prototype-scope disclosure.

## What it does

A fictional automotive OEM ("Vantoria Motors AG") is modeled with a 38-supplier, three-tier network (Tier-1, Tier-2, Tier-3), including two deliberately hidden Tier-3 single points of failure that each feed two independent upstream paths, demonstrating the thesis's core argument that OEMs typically lose visibility beyond Tier-1.

The dashboard is built around three resilience KPIs from the thesis:

- **TTS (Time-to-Survive)** - how long the network can run on current inventory before a supply gap hits
- **TTR (Time-to-Recovery)** - how long it takes to recover from a disruption
- **REI (Risk Exposure Index)** - TTR × financial impact per day, the euro cost of that risk

The resilience rule driving the whole app: **TTS ≥ TTR is resilient; TTS < TTR is critical.**

## Screens

| Page | Purpose |
|---|---|
| Executive Overview | Network-wide resilience cockpit |
| Supply Network | Interactive Tier-1/2/3 graph with upstream/downstream path highlighting |
| Resilience KPIs | 75-day KPI history, filterable by tier/country/component/risk |
| Early Warning Center | Explainable, severity-ranked disruption alerts |
| Scenario Simulation | What-if stress testing with before/after mitigation comparison |
| Decision Center | Four-phase decision workflow + rule-based prescriptive recommendations |
| Digital Twin Architecture | Three-layer conceptual architecture diagram |
| Methodology | Term definitions and an explicit prototype-scope disclosure |

## Tech stack

React 19 + TypeScript + Vite, React Router, Recharts, React Flow, Tailwind CSS v4, Lucide icons. No backend — all business logic (KPI formulas, simulation engine, recommendation engine) lives in `src/calculations` and `src/simulation`, separate from the UI.

## Running locally

```bash
npm install
npm run dev
```

## Building

```bash
npm run build
```

Deploys automatically to GitHub Pages via `.github/workflows/deploy.yml` on every push to `main`.
