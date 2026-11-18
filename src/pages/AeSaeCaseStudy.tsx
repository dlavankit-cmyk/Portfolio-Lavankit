import {
  Block,
  Body,
  BreadcrumbPill,
  Eyebrow,
  MediaBox,
  Placeholder,
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
  { id: "insights", label: "Insights" },
  { id: "solution", label: "Solution" },
  { id: "design-decisions", label: "Design decisions" },
  { id: "impact", label: "Impact" },
];
const chapterIds = chapters.map((c) => c.id);

const impact = [
  {
    value: "Within seconds",
    label: "The nurse is alerted right after saving a flagged value, not days or weeks later.",
  },
  {
    value: "Across visits",
    label:
      "Slow decline no longer hides in saved data. Each patient is read against their own normal.",
  },
  {
    value: "94.5%",
    label: "Fewer AI calls. This makes it affordable for large trials across many sites.",
  },
];
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
          heading={"A serious patient health problem can put a whole clinical trial at risk"}
          body={
            "In a clinical trial, a Serious Adverse Event (SAE) is a serious health problem a patient has while testing a new drug. When one happens, the FDA must be told. The trial can be paused or stopped. That costs millions of dollars and delays the drug by months or years."
          }
          media={<SaeComparison theme={dark ? "dark" : "light"} />}
        />
        <TextMedia
          heading={"But these problems rarely happen suddenly. They build up over visits"}
          body={
            "At visit one, a value is a little off. At visit two, it is worse. Each reading looks fine on its own. Together, they show a pattern."
          }
          media={
            <MediaBox
              hint={
                "Three visits on a timeline. The same reading gets slightly worse each time. No single reading looks scary. The pattern does."
              }
            />
          }
        />
        <TextMedia
          heading={
            "While researching the nurse workflow, I found the system had all the data but was not reading the pattern"
          }
          body={
            "At every visit, the nurse records blood pressure, heart rate, and lab results. All of it is saved. But each visit was checked alone, never next to the others."
          }
          media={
            <MediaBox
              image="https://res.cloudinary.com/vwlr2h8r/image/upload/v1794997742/AE_SAE_Value_Trebd.png"
              alt="Patient values across visits reveal a pattern that individual readings miss"
            />
          }
        />
        <TextMedia
          heading={"So the warning came late, days or weeks after the visit"}
          body={"By the time someone noticed, it was too late to change anything."}
          media={
            <MediaBox
              hint={
                "Timeline. Visit → data saved → days or weeks pass → review → problem found. The gap is highlighted."
              }
            />
          }
        />
        <Block id="insights">
          <TextBlock
            eyebrow={<Accent>Insights</Accent>}
            heading={"To read across visits, I had to answer three simple questions."}
          />
        </Block>
        <section className="mt-12 grid gap-x-5 gap-y-16 sm:grid-cols-2">
          <div className="flex flex-col gap-6">
            <TextBlock
              eyebrow={<Accent>Insight 1 · Compare with what?</Accent>}
              heading={"Normal is different for every patient"}
            >
              <Body>
                A patient with high blood pressure always has high readings. Compared with an
                average person, that patient looks at risk at every visit.
              </Body>
            </TextBlock>
            <MediaBox
              className="mt-auto"
              ratio="aspect-[4/3]"
              hint={"The same reading against two different normals."}
            />
          </div>
          <div className="flex flex-col gap-6">
            <TextBlock
              eyebrow={<Accent>Insight 2 · Look at what?</Accent>}
              heading={"One reading is rarely scary. The trend is"}
            >
              <Body>
                A heart rate of 130 at three visits in a row never crosses an emergency limit. But
                it is clearly not getting better.
              </Body>
            </TextBlock>
            <MediaBox
              className="mt-auto"
              ratio="aspect-[4/3]"
              hint={"A flat line under the limit, and a rising trend line over it."}
            />
          </div>
        </section>
        <TextMedia
          eyebrow={<Accent>Insight 3 · When to speak up?</Accent>}
          heading={"An alert only works if the nurse trusts it"}
          body={
            "Too early, and nurses start ignoring alerts. Too late, and the alert is useless. Either way, the feature fails."
          }
          media={<MediaBox hint={"Three states. Too early. Too late. Right time."} />}
        />
        <TextMedia
          id="solution"
          eyebrow={<Accent>Solution</Accent>}
          heading={
            "A system that compares each patient to their own normal and speaks up only when it is sure"
          }
          body={
            "At the first visit, before any drug is given, the system learns the patient’s normal. With each visit, it collects more evidence and builds a score. When the score is high enough, a small banner appears in the form the nurse is already using. She accepts or rejects it. Her workflow does not change."
          }
          media={
            <MediaBox
              hint={
                "Montage. First visit → evidence builds over visits → banner in the form → accept and reject. Full width."
              }
            />
          }
        />
        <Block id="design-decisions">
          <TextBlock
            eyebrow={<Accent>Design decisions</Accent>}
            heading={"Part 3. The nurse sees only a small banner, in the form she already uses"}
          >
            <div className="flex flex-col gap-4">
              <p data-fade className="text-[13px] text-label">
                Answers Insight 3
              </p>
              <Body>
                No new screen and no new tool to learn. The banner explains in plain words what the
                system noticed and how likely the problem is. Accept opens the SAE form already
                filled with the patient, visit, and values. Reject asks why, and saves the reason so
                the next reviewer can see it.
              </Body>
            </div>
          </TextBlock>
          <div data-fade className="mt-6">
            <MediaBox
              video="https://res.cloudinary.com/vwlr2h8r/video/upload/v1795000153/Ai_alert.mp4"
              alt="AI alert banner in the nurse’s existing form"
            />
          </div>
        </Block>
        <Block>
          <TextBlock
            heading={"Two layers of checks, and an alert only when the score reaches 75 out of 100"}
          >
            <div className="flex flex-col gap-4">
              <p data-fade className="text-[13px] text-label">
                Answers Insights 1, 2 and 3
              </p>
              <Body>
                The first visit sets each patient’s normal. Every later visit is compared with it,
                and the score builds as evidence adds up. Layer one uses fixed limits to catch
                sudden emergencies, like a heart rate above 150. Layer two looks for patterns, and
                catches slow decline that never crosses a limit. The nurse never sees the score.
                Below 75, there were too many false alarms. Above 75, early warnings were missed.
              </Body>
            </div>
          </TextBlock>
          <div data-fade className="mt-6">
            <MediaBox
              hint={
                "Two boxes for the layers, with a patient that Layer 1 misses and Layer 2 catches. Below: score bar. 0 Normal. 1-39 Monitoring. 40-64 Watching. 65-74 Close to alert. 75+ Alert. Numbers are for the reader only, not for the nurse."
              }
            />
          </div>
        </Block>
        <Block>
          <TextBlock heading={"The AI is called based on risk, not on every field saved"}>
            <div className="flex flex-col gap-4">
              <p data-fade className="text-[13px] text-label">
                Making it work at scale
              </p>
              <Body>
                Calling the AI on every saved field means 40,000 calls per trial. Calling it once
                per finished visit, plus extra checks for watched patients, is about 2,200. Low-risk
                patients get light checks. For watched patients, saving a flagged value triggers an
                instant check, so the nurse gets the alert within seconds.
              </Body>
            </div>
          </TextBlock>
          <div data-fade className="mt-6">
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                { title: "Every field", value: "40,000", detail: "calls" },
                { title: "By visit, with extra checks", value: "~2,200", detail: "94.5% fewer" },
              ].map((stat) => (
                <div
                  key={stat.title}
                  className="flex aspect-[4/3] flex-col justify-between rounded-[14px] border border-card-border bg-card p-6"
                >
                  <p className="text-[15px] text-label">{stat.title}</p>
                  <p className="text-[36px] leading-none font-semibold tracking-tight text-ink">
                    {stat.value}
                  </p>
                  <p className="text-[15px] text-body">{stat.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </Block>
        <Block id="impact">
          <Eyebrow>
            <Accent>Impact</Accent>
          </Eyebrow>
          <div data-fade className="mt-6 grid gap-2 sm:grid-cols-3">
            {impact.map((s) => (
              <div
                data-impact-card
                key={s.value}
                className="flex flex-col justify-between gap-10 rounded-[14px] border border-card-border bg-card p-6 sm:aspect-[4/5]"
              >
                <p className="text-[32px] leading-none font-semibold tracking-tight text-ink">
                  {s.value}
                </p>
                <p className="text-[16px] leading-[1.45] text-body">{s.label}</p>
              </div>
            ))}
          </div>
        </Block>

        <Block>
          <a
            href="#"
            data-fade
            className="group flex flex-col gap-5 rounded-[14px] border border-card-border bg-card p-5 sm:min-h-[104px] sm:flex-row sm:items-center sm:gap-5 sm:px-6 sm:py-5"
          >
            <Placeholder label="ICON" className="size-16 shrink-0 px-0" />
            <div className="flex flex-1 flex-col gap-1">
              <p className="text-[18px] font-semibold text-ink">Want the full process?</p>
              <p className="text-[16px] leading-[1.5] text-label">
                Research, wireframes, rejected directions, and every decision documented.
              </p>
            </div>
            <span className="inline-flex h-9 shrink-0 items-center self-start rounded-full bg-btn px-4 text-[13px] font-semibold text-btn-text transition-opacity group-hover:opacity-85 sm:self-center">
              View full process →
            </span>
          </a>
        </Block>
      </main>
    </div>
  );
}
