import PageHeader from '../components/PageHeader'

const TERMS: { term: string; def: string }[] = [
  { term: 'Digital Twin (DT)', def: 'A dynamic, data-driven virtual representation of the physical supply chain network, kept synchronized with (simulated, in this prototype) operational and external risk data to support monitoring, simulation and decision-making.' },
  { term: 'Multi-Tier Supply Chain', def: 'A supply network spanning multiple supplier echelons beyond the direct (Tier-1) relationship — Tier-2 and Tier-3 suppliers that are typically invisible to the OEM.' },
  { term: 'Tier-1 / Tier-2 / Tier-3', def: 'Tier-1 suppliers contract directly with the OEM. Tier-2 suppliers supply Tier-1. Tier-3 suppliers supply Tier-2 and are usually the least visible echelon — yet, per Kapitel 5.1, the source of many hidden dependencies.' },
  { term: 'Supply Chain Resilience', def: "A network's capacity to anticipate, absorb, and recover from disruptions while continuing to meet demand — treated in this framework as equally important as classical efficiency objectives." },
  { term: 'Time-to-Survive (TTS)', def: 'How long downstream production/supply can continue after a node outage before on-hand and pipeline inventory is exhausted. TTS = (on-hand inventory + usable pipeline inventory) / daily consumption.' },
  { term: 'Time-to-Recovery (TTR)', def: 'How long it takes to restore the disrupted function — either by restoring original capacity or by activating an alternative source. Modeled here as the faster of the two available recovery paths.' },
  { term: 'Risk Exposure Index (REI)', def: 'The financial risk-prioritization metric introduced by Simchi-Levi et al.: REIᵢ = TTRᵢ × FIᵢ, where FIᵢ is the financial impact per unit time of node i\'s outage. Converts operational KPIs into a single, comparable EUR figure.' },
  { term: 'ATTD (Average Time to Detection)', def: 'The average time between a disruption occurring and the organization detecting it — a key driver of how much runway remains for a proactive response.' },
  { term: 'Reaction Lead Time', def: 'The time between detecting a risk signal and initiating a countermeasure — the second half of total response latency, alongside ATTD.' },
  { term: 'Resilience Rule: TTS ≥ TTR', def: 'A network node is considered resilient only if its survival buffer is at least as long as its recovery time. TTS < TTR signals an acute, quantifiable supply-interruption risk.' },
  { term: 'Early Warning System', def: 'Continuous monitoring of thresholds and weak signals (internal KPIs plus external risk feeds) that surfaces deviations before they become full disruptions.' },
  { term: 'What-if Simulation', def: 'Digital stress-testing of a disruption scenario and candidate mitigations inside the Digital Twin, before committing resources in the physical world.' },
  { term: 'Prescriptive Decision Support', def: 'Rule-based recommendation logic that converts simulation results into a ranked, actionable mitigation plan (see Digital Twin Recommendation Engine, Decision Center).' },
  { term: 'Multi-Tier Transparency', def: 'End-to-end visibility across all supplier echelons, achieved conceptually here via multi-tier supplier mapping and (architecturally) Catena-X / AAS standards.' },
  { term: 'Single Point of Failure (SPOF)', def: 'A node whose failure has no redundant path — including hidden Tier-3 nodes that silently supply multiple independent upstream paths (see the two demonstrated hidden dependencies in Supply Network).' },
]

export default function Methodology() {
  return (
    <div>
      <PageHeader title="Methodology" subtitle="Academic grounding and prototype scope" />
      <div className="p-6 max-w-4xl space-y-6">
        <section className="panel p-5">
          <h2 className="text-[13px] font-bold mb-3">Conceptual Definitions</h2>
          <dl className="space-y-3">
            {TERMS.map((t) => (
              <div key={t.term}>
                <dt className="text-[12.5px] font-bold" style={{ color: 'var(--accent)' }}>{t.term}</dt>
                <dd className="text-[12px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>{t.def}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="panel p-5" style={{ borderLeft: '3px solid var(--warning)' }}>
          <h2 className="text-[13px] font-bold mb-2">Prototype Scope</h2>
          <ul className="list-disc pl-5 space-y-1.5 text-[12px]" style={{ color: 'var(--text-secondary)' }}>
            <li>All supplier, inventory, KPI-history, and alert data in this application are <strong>simulated</strong>, generated with a fixed random seed so results are reproducible across sessions — not a real OEM's supply chain.</li>
            <li>TTS, TTR and REI use <strong>simplified prototype formulas</strong> that operationalize the definitions in Kapitel 5.3 (Tabelle 5.3); a production deployment would calibrate these against real inventory, contractual recovery, and cost data.</li>
            <li>This prototype demonstrates the <strong>conceptual framework</strong> of Kapitel 5 — it validates that the framework's modules (monitoring → prediction → simulation → prescription) function together, per the validation logic in Kapitel 5.5, not that they have been deployed at an OEM.</li>
            <li>A real deployment would require live ERP / MES / WMS / TMS integration, supplier-side data-sharing agreements, and IoT / logistics data feeds — none of which are connected here.</li>
            <li>Catena-X and the Asset Administration Shell (AAS) are represented as <strong>architectural concepts</strong> from the thesis (Kapitel 5.2, Tabelle 5.2) — this prototype does not connect to the real Catena-X network.</li>
            <li>The "Digital Twin Recommendation Engine" is a transparent, auditable <strong>rule-based</strong> system, not a trained machine-learning model — it is intentionally not marketed as "AI" in this application.</li>
          </ul>
        </section>

        <section className="panel p-5">
          <h2 className="text-[13px] font-bold mb-2">Source</h2>
          <p className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
            Framework concepts, KPI definitions, architecture, decision model, and validation scenario are derived from Kapitel 5
            ("Ein konzeptionelles Rahmenwerk für ein Resilienz-Dashboard, das auf DT gestützt ist") of the Master's thesis
            <em> "Steigerung der Resilienz und Risikominimierung im Supply Chain Management der Automobilindustrie durch den Einsatz
            digitaler Zwillinge."</em> This application is the practical prototype implementation of that conceptual dashboard.
          </p>
        </section>
      </div>
    </div>
  )
}
