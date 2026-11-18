import { BeamCard } from "./BeamCard";

export function SaeComparison({ theme }: { theme?: "light" | "dark" }) {
  return (
    <div className="sae-comparison-frame">
      <section className="sae-compare">
        <BeamCard color="red" theme={theme} delay={0}>
          <h3>SAE caught late.</h3>
          <p>FDA notified after the fact, patient hospitalized, trial at risk of suspension.</p>
        </BeamCard>
        <BeamCard color="green" theme={theme} delay={2.5}>
          <h3>SAE caught early</h3>
          <p>Nurse alerted, sponsor notified proactively, patient treated, trial continues.</p>
        </BeamCard>
      </section>
    </div>
  );
}
