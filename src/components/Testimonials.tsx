import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { testimonials, type Testimonial } from "../content/testimonials";
import { SCROLL_LERP, SCROLL_WHEEL_MULTIPLIER } from "../smoothScroll";

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const easing = (elapsed: number) => 1 - Math.pow(1 - SCROLL_LERP, elapsed / (1000 / 60));

function Recommendation({
  testimonial,
  expanded,
  duplicate,
  onToggle,
}: {
  testimonial: Testimonial;
  expanded: boolean;
  duplicate: boolean;
  onToggle: () => void;
}) {
  const quote = useRef<HTMLQuoteElement>(null);
  useEffect(() => {
    const element = quote.current;
    if (!element) return;
    element.scrollTop = 0;
    if (!expanded || reducedMotion()) return;
    let target = 0;
    let written = 0;
    let frame = 0;
    let previous = 0;
    const tick = (time: number) => {
      const elapsed = previous ? Math.min(time - previous, 64) : 1000 / 60;
      previous = time;
      const next = element.scrollTop + (target - element.scrollTop) * easing(elapsed);
      element.scrollTop = Math.abs(target - next) < 1 ? target : next;
      written = element.scrollTop;
      if (Math.abs(target - written) >= 1) frame = requestAnimationFrame(tick);
      else {
        frame = 0;
        previous = 0;
      }
    };
    const wheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY) || event.ctrlKey) return;
      const max = element.scrollHeight - element.clientHeight;
      if (max <= 0) return;
      event.preventDefault();
      event.stopPropagation();
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? element.clientHeight : 1;
      target = Math.max(0, Math.min(max, target + event.deltaY * unit * SCROLL_WHEEL_MULTIPLIER));
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const scroll = () => {
      // Keep touch, keyboard, and scrollbar interaction in sync with wheel easing.
      if (Math.abs(element.scrollTop - written) > 1) {
        target = written = element.scrollTop;
      }
    };
    element.addEventListener("wheel", wheel, { passive: false });
    element.addEventListener("scroll", scroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      element.removeEventListener("wheel", wheel);
      element.removeEventListener("scroll", scroll);
    };
  }, [expanded]);

  return (
    <article className="flex h-[360px] w-[min(360px,calc(100vw-72px))] shrink-0 flex-col gap-5 rounded-[20px] border border-card-border bg-card p-5">
      <div className="flex min-h-[78px] items-start gap-3">
        {testimonial.image ? (
          <img
            src={testimonial.image}
            alt={testimonial.name}
            width={42}
            height={42}
            loading="lazy"
            className="size-[42px] shrink-0 rounded-full border border-card-border object-cover"
          />
        ) : (
          <span
            aria-label={`${testimonial.name} photo pending`}
            className="grid size-[42px] shrink-0 place-items-center rounded-full border border-card-border bg-box text-[12px] font-medium text-ink"
          >
            {testimonial.name
              .split(" ")
              .map((word) => word[0])
              .join("")}
          </span>
        )}
        <div className="min-w-0">
          <h3 className="text-[14px] font-medium leading-5 text-ink">
            <a
              href={testimonial.profileUrl}
              target="_blank"
              rel="noreferrer"
              tabIndex={duplicate ? -1 : undefined}
              className="cursor-pointer decoration-current underline-offset-4 transition-opacity hover:underline hover:opacity-70 focus-visible:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
            >
              {testimonial.name}
            </a>
          </h3>
          <p className="mt-1 text-[12px] leading-[19.2px] text-label">{testimonial.company}</p>
        </div>
      </div>
      <blockquote
        ref={quote}
        tabIndex={expanded && !duplicate ? 0 : undefined}
        aria-label={`Recommendation from ${testimonial.name}`}
        data-lenis-prevent={expanded ? true : undefined}
        className={`min-h-0 flex-1 whitespace-pre-line text-[14px] leading-[23.8px] text-body focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${expanded ? "overflow-y-auto overscroll-y-contain pr-2" : "overflow-hidden"}`}
      >
        <div className={expanded ? "" : "line-clamp-6"}>{testimonial.quote}</div>
      </blockquote>
      <button
        type="button"
        aria-expanded={expanded}
        aria-label={`${expanded ? "View Less" : "View More"}: ${testimonial.name}`}
        tabIndex={duplicate ? -1 : undefined}
        onClick={onToggle}
        className="w-fit cursor-pointer text-[12px] leading-5 text-ink underline decoration-line underline-offset-4 transition-opacity hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
      >
        {expanded ? "View Less" : "View More"}
      </button>
    </article>
  );
}

export function Testimonials({
  className = "",
  visible = true,
}: {
  className?: string;
  visible?: boolean;
}) {
  const track = useRef<HTMLDivElement>(null);
  const controller = useRef<(distance: number) => void>(() => {});
  const hovered = useRef(false);
  const focused = useRef(false);
  const reading = useRef(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [reduced, setReduced] = useState(reducedMotion);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  pausedRef.current = paused;
  reading.current = expanded !== null;

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setReduced(query.matches);
    query.addEventListener("change", change);
    return () => query.removeEventListener("change", change);
  }, []);

  useEffect(() => {
    const element = track.current;
    if (!element || !visible) return;
    let frame = 0;
    let previous = 0;
    let pauseUntil = 0;
    let target = 0;
    let written = 0;
    const cycle = () => element.scrollWidth / 3;
    if (!reduced) target = element.scrollLeft = written = cycle();
    const normalize = () => {
      if (reduced) return;
      const width = cycle();
      if (!width) return;
      let shift = 0;
      if (element.scrollLeft < width * 0.5) shift = width;
      else if (element.scrollLeft >= width * 1.5) shift = -width;
      if (shift) {
        target += shift;
        element.scrollLeft += shift;
        written = element.scrollLeft;
      }
    };
    const move = (distance: number) => {
      pauseUntil = performance.now() + 1800;
      if (reduced) {
        element.scrollLeft = Math.max(
          0,
          Math.min(element.scrollWidth - element.clientWidth, element.scrollLeft + distance),
        );
        written = target = element.scrollLeft;
      } else target += distance;
    };
    controller.current = move;
    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey) return;
      const delta = event.shiftKey ? event.deltaY || event.deltaX : event.deltaX;
      // A regular vertical wheel stays with the main page until a quote is opened.
      if (!delta || (!event.shiftKey && Math.abs(event.deltaY) > Math.abs(event.deltaX))) return;
      event.preventDefault();
      event.stopPropagation();
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? element.clientWidth : 1;
      move(delta * unit * SCROLL_WHEEL_MULTIPLIER);
    };
    const scroll = () => {
      if (Math.abs(element.scrollLeft - written) > 1) {
        target = written = element.scrollLeft;
        pauseUntil = performance.now() + 1800;
        normalize();
      }
    };
    const tick = (time: number) => {
      const elapsed = previous ? Math.min(time - previous, 64) : 1000 / 60;
      previous = time;
      if (!document.hidden) {
        if (
          !reduced &&
          !pausedRef.current &&
          !hovered.current &&
          !focused.current &&
          !reading.current &&
          time > pauseUntil
        )
          target += elapsed * 0.022;
        const next = reduced
          ? target
          : element.scrollLeft + (target - element.scrollLeft) * easing(elapsed);
        element.scrollLeft = next;
        written = element.scrollLeft;
        normalize();
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    element.addEventListener("wheel", wheel, { passive: false });
    element.addEventListener("scroll", scroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      controller.current = () => {};
      element.removeEventListener("wheel", wheel);
      element.removeEventListener("scroll", scroll);
    };
  }, [visible, reduced]);

  const copies = reduced ? [0] : [0, 1, 2];
  const moveCard = (direction: number) =>
    controller.current(
      direction *
        ((track.current?.querySelector("article")?.getBoundingClientRect().width ?? 360) + 20),
    );
  return (
    <section
      id="testimonials"
      aria-labelledby="testimonials-heading"
      aria-hidden={!visible}
      className={`${className} ${visible ? "projects-revealed" : "projects-locked"} flex min-w-0 flex-col gap-5 pt-10`}
    >
      <div data-fade className="flex items-center justify-between gap-6">
        <h2 id="testimonials-heading" className="text-[15px] leading-[19.2px] text-ink">
          Testimonial
        </h2>
        <div className="flex items-center gap-2">
          {!reduced && (
            <button
              type="button"
              onClick={() => setPaused(!paused)}
              aria-label={paused ? "Play testimonials" : "Pause testimonials"}
              aria-pressed={paused}
              className="mr-1 cursor-pointer text-[12px] text-label underline-offset-4 hover:text-ink hover:underline"
            >
              {paused ? "Play" : "Pause"}
            </button>
          )}
          <button
            type="button"
            onClick={() => moveCard(-1)}
            aria-label="Previous testimonial"
            aria-controls="testimonial-cards"
            className="grid size-8 place-items-center rounded-full border border-card-border bg-card text-ink transition-colors hover:bg-box focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            <ArrowLeft size={14} aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => moveCard(1)}
            aria-label="Next testimonial"
            aria-controls="testimonial-cards"
            className="grid size-8 place-items-center rounded-full border border-card-border bg-card text-ink transition-colors hover:bg-box focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            <ArrowRight size={14} aria-hidden />
          </button>
        </div>
      </div>
      <div
        ref={track}
        id="testimonial-cards"
        role="region"
        aria-label="Recommendations, scroll horizontally"
        tabIndex={0}
        onPointerEnter={() => {
          hovered.current = true;
        }}
        onPointerLeave={() => {
          hovered.current = false;
        }}
        onFocusCapture={() => {
          focused.current = true;
        }}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) focused.current = false;
        }}
        className="testimonial-ticker overflow-x-auto overscroll-x-contain py-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
      >
        <div className="flex w-max">
          {copies.map((copy) => (
            <div
              key={copy}
              aria-hidden={!reduced && copy !== 1 ? true : undefined}
              className="flex gap-5 pr-5"
            >
              {testimonials.map((testimonial) => (
                <Recommendation
                  key={testimonial.name}
                  testimonial={testimonial}
                  duplicate={!reduced && copy !== 1}
                  expanded={expanded === testimonial.name}
                  onToggle={() =>
                    setExpanded((current) =>
                      current === testimonial.name ? null : testimonial.name,
                    )
                  }
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
