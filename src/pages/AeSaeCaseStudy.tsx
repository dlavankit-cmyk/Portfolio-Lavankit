import { BellRing, Coins, ShieldCheck, Activity } from "lucide-react";
import { BeamCard } from "../components/BeamCard";
import {
  Block,
  Body,
  MediaBox,
  BreadcrumbPill,
  Sidebar,
  TextBlock,
  TextMedia,
  ThemeToggle,
  useScrollSpy,
  useTheme,
  type Chapter,
} from "../components/blocks";
import { SaeComparison } from "../components/SaeComparison";
import { aeSaeProject } from "../content/aeSaeProject";
import { NoiseTexture } from "../components/NoiseTexture";

const chapters: Chapter[] = [
  { id: "problem", label: "Problem" },
  { id: "solution", label: "Solution" },
  { id: "impact", label: "Expected impact" },
];
const chapterIds = chapters.map((c) => c.id);

const impact = [
  {
    value: "Patients treated on time, possibly saving lives",
    label:
      "An alert within seconds of saving a flagged value gives the team time to treat the patient before they leave and collapse at home. Caught early, it also avoids a trial hold that costs millions.",
  },
  {
    value: "Slow decline no longer hides",
    label: "The system reads each patient against their own normal, across visits.",
  },
  {
    value: "94.5% fewer AI calls",
    label: "Makes it affordable for large trials across many sites.",
  },
];
function Diagram({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[14px] border border-card-border bg-card p-5 sm:p-8">{children}</div>
  );
}
function Cards({ items }: { items: string[][] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map(([title, description], i) => (
        <div
          key={title}
          className="flex flex-col gap-4 rounded-xl bg-box p-5 shadow-sm"
        >
          <div className="flex items-center gap-3 text-ink">{i === 0 ? <ShieldCheck size={19} className="shrink-0 text-label" /> : <Activity size={19} className="shrink-0 text-emerald-600 dark:text-emerald-400" />}<p className="text-[15px] font-medium">{title}</p></div>
          <p className="text-[14px] leading-[1.5] text-body">{description}</p>
        </div>
      ))}
    </div>
  );
}
const Accent = ({ children }: { children: string }) => (
  <span className="text-accent">{children}</span>
);

export default function AeSaeCaseStudy({ animateEntrance = true }: { animateEntrance?: boolean }) {
  const active = useScrollSpy(chapterIds);
  const [dark, toggleTheme] = useTheme();
  return (
    <div id="top" className="relative isolate min-h-screen font-sans">
      <NoiseTexture />
      <BreadcrumbPill parent="Projects" current="AESA Prediction">
        <ThemeToggle dark={dark} onToggle={toggleTheme} />
      </BreadcrumbPill>
      <Sidebar chapters={chapters} active={active} />
      <main className="relative z-10 mx-auto w-full px-5 pt-[130px] pb-32 md:w-[60%] md:px-0">
        <MediaBox
          video="https://res.cloudinary.com/vwlr2h8r/video/upload/v1794851656/Final_Video.mp4"
          alt="AE/SAE prediction platform overview"
        />
        <header className="mt-8">
          <div data-fade className="flex flex-col gap-8 sm:flex-row sm:gap-0">
            <div className="flex flex-col gap-4 sm:w-[70%] sm:pr-12">
              <h1 className="text-[20px] leading-[1.3] font-medium text-ink">
                {aeSaeProject.title}
              </h1>
              <Body>{aeSaeProject.description}</Body>
              <Body>94.5% fewer AI calls · Alerts within seconds · 2 layers of checks</Body>
            </div>
            <dl className="flex flex-col gap-1 text-[13px] sm:w-[30%]">
              <dt className="font-semibold text-ink">Akyrian Systems</dt>
              <dd className="text-label">Clinical Trial Platform</dd>
              <dd className="text-label">Solo Product Designer</dd>
              <dd className="mt-4 text-body">2026</dd>
            </dl>
          </div>
        </header>
        <TextMedia
          id="problem"
          eyebrow={<Accent>Problem</Accent>}
          heading="A serious patient health problem, found late, can cost a patient’s life and put a whole trial on hold for millions"
          body="In a clinical trial, a Serious Adverse Event (SAE) is a serious health problem a patient has while testing a new drug. When one happens, the FDA must be told. The trial can be paused or stopped, and each pause costs millions of dollars. A patient can also leave after a visit, collapse at home, and face a very serious emergency, even death, long after anyone could help."
          media={<SaeComparison theme={dark ? "dark" : "light"} />}
        />
        <TextMedia
          heading="These problems do not happen suddenly. They build up as a pattern over visits"
          body="A value is a little off at visit one and worse at visit two. Each reading looks fine alone. Together, they show a pattern."
          media={
            <Diagram>
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((visit) => (
                  <div key={visit} className="flex flex-col gap-4">
                    <span className="text-[13px] text-label">Visit {visit}</span>
                    <div className="flex h-28 items-end border-b border-card-border">
                      <div
                        className="w-full rounded-t-lg bg-accent"
                        style={{ height: `${visit * 23 + 10}%` }}
                      />
                    </div>
                    <span className="text-[13px] text-body">
                      {["A little off", "Slightly worse", "Still declining"][visit - 1]}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-[14px] text-body">
                The pattern is clear, no single reading is.
              </p>
            </Diagram>
          }
        />
        <TextMedia
          heading="While researching the nurse workflow, I found the system had all the data but was not reading the pattern"
          body="Every value the nurse recorded was saved. She might notice a pattern while entering data, but the system itself was not identifying it. Each visit was checked alone, so any warning came days or weeks later."
          media={
            <MediaBox
              image="https://res.cloudinary.com/vwlr2h8r/image/upload/v1794997742/AE_SAE_Value_Trebd.png"
              alt="Patient values across visits reveal a pattern that individual readings miss"
            />
          }
        />
        <TextMedia
          heading="So the real challenge was system design: quick alerts for nurses, without a huge AI bill"
          body="Nurses need a quick alert. But calling the AI every time a nurse fills one field means thousands of calls and a very high cost. The system also needed more than one layer of checks, so the alerts stay accurate."
          media={
            <Diagram>
              <div className="mx-auto max-w-md text-[15px] text-ink">
                <div className="mx-auto w-fit rounded-xl border border-card-border bg-box px-8 py-5 font-medium">One system</div>
                <svg viewBox="0 0 400 70" className="mx-auto h-16 w-full text-label" fill="none" aria-hidden="true">
                  <path d="M180 8 L105 56 M220 8 L295 56 M106 44 L105 56 L118 55 M282 55 L295 56 L294 44" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="grid grid-cols-2 gap-5">
                  <div className="flex flex-col items-center gap-3 rounded-xl bg-box p-5"><BellRing size={22} strokeWidth={1.5} className="text-emerald-600 dark:text-emerald-400" /><span>Quick alerts</span></div>
                  <div className="flex flex-col items-center gap-3 rounded-xl bg-box p-5"><Coins size={22} strokeWidth={1.5} className="text-label" /><span>API cost</span></div>
                </div>
              </div>
            </Diagram>
          }
        />
        <TextMedia
          id="solution"
          eyebrow={<Accent>Solution</Accent>}
          heading="I worked out the full solution before taking it to the CEO: a backend system design in three parts"
          body="I did not go to the CEO with only the problem. I first worked out what it takes to solve it. What I proposed is a system design for how things work in the backend, not a screen design."
          media={
            <Diagram>
              <div className="grid gap-3 sm:grid-cols-4">
                {["Nurse saves a value", "System checks", "Score builds", "Alert"].map(
                  (step, i) => (
                    <div key={step} className="rounded-xl border border-card-border bg-box p-5">
                      <p className="mb-5 text-[14px] text-ink"><span className="text-emerald-600 dark:text-emerald-400">0</span>{i + 1}<span className="ml-2 text-label" aria-hidden>{i < 3 ? "→" : "✓"}</span></p>
                      <p className="text-[15px] text-ink">{step}</p>
                    </div>
                  ),
                )}
              </div>
            </Diagram>
          }
        />
        <TextMedia
          heading="Part 1. The system reads each patient against their own normal, in two layers"
          body="The first visit sets each patient’s normal. Every later visit adds evidence to a score, and the nurse never sees it. Layer one uses fixed limits to catch sudden emergencies, like a heart rate above 150. Layer two looks for patterns, and catches slow decline that never crosses a limit. The alert appears only when the score reaches 75 out of 100. Below that, there were too many false alarms. Above it, early warnings were missed."
          media={
            <Diagram>
              <Cards
                items={[
                  [
                    "Layer 1 · Fixed limits",
                    "Catches sudden emergencies. Slow decline below the limit is missed.",
                  ],
                  [
                    "Layer 2 · Patterns",
                    "Reads across visits. Catches the same patient’s slow decline.",
                  ],
                ]}
              />
              <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-5">
                {[
                  "0 · Normal",
                  "1–39 · Monitoring",
                  "40–64 · Watching",
                  "65–74 · Close to alert",
                  "75+ · Alert",
                ].map((label, i) => (
                  <div
                    key={label}
                    className={`rounded-lg border border-card-border p-3 text-[12px] ${i === 4 ? "bg-accent text-white" : "bg-box text-body"}`}
                  >
                    {label}
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[12px] text-label">
                Score shown here for the reader only. Nurses do not see it.
              </p>
            </Diagram>
          }
        />
        <TextMedia
          heading="Part 2. The AI is called based on risk, not on every field saved"
          body="Calling the AI on every saved field means about 40,000 calls per trial. Calling it once per finished visit, plus extra checks for watched patients, is about 2,200. That is 94.5% fewer. For watched patients, saving a flagged value triggers an instant check, so the alert comes within seconds."
          media={
            <div className="sae-call-comparison grid gap-5 sm:grid-cols-2">
              {[
                ["Every field", "40,000", "calls per trial"],
                ["By visit, with extra checks", "~2,200", "calls per trial · 94.5% fewer"],
              ].map(([title, value, detail], i) => (
                <BeamCard key={title} color={i === 0 ? "red" : "green"} theme={dark ? "dark" : "light"} delay={i * 2.5}>
                  <p className="sae-call-label">{title}</p>
                  <p className="sae-call-value">{value}</p>
                  <p className="sae-call-detail">{detail}</p>
                </BeamCard>
              ))}
            </div>
          }
        />
        <TextMedia
          heading="Part 3. The nurse sees only a small banner, in the form she already uses"
          body="No new screen and no new tool to learn. The banner explains in plain words what the system noticed and how likely the problem is. Accept opens the SAE form already filled with the patient, visit, and values. Reject asks why, and saves the reason so the next reviewer can see it."
          media={
            <MediaBox
              video="https://res.cloudinary.com/vwlr2h8r/video/upload/v1795000153/Ai_alert.mp4"
              alt="AI alert banner in the nurse’s existing form"
            />
          }
        />
        <Block id="impact">
          <TextBlock
            eyebrow={<Accent>Expected impact</Accent>}
            heading="Not tested yet, and the development team is building it now. It is designed to catch problems in time to treat the patient, and avoid costly trial holds"
          />
          <div data-fade className="mt-6 grid gap-3 sm:grid-cols-2">
            {impact.map((item, i) => (
              <div
                key={item.value}
                data-impact-card
                className={`flex flex-col gap-6 rounded-[14px] bg-card p-6 ${i === 0 ? "border-0 sm:col-span-2 sm:p-10" : "border border-card-border"}`}
              >
                <p
                  className={`${i === 0 ? "text-[26px]" : "text-[20px]"} font-medium leading-[1.3] text-ink`}
                >
                  {item.value}
                </p>
                <p className="text-[15px] leading-[1.5] text-body">{item.label}</p>
              </div>
            ))}
          </div>
        </Block>

      </main>
    </div>
  );
}
