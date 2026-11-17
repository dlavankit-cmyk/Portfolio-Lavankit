import { useRef } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { testimonials } from "../content/testimonials";

export function Testimonials({
  className = "",
  visible = true,
}: {
  className?: string;
  visible?: boolean;
}) {
  const track = useRef<HTMLDivElement>(null);
  if (!testimonials.length) return null;

  function move(direction: number) {
    const element = track.current;
    if (!element) return;
    const card = element.querySelector("article");
    const distance = (card?.getBoundingClientRect().width ?? element.clientWidth) + 20;
    element.scrollBy({
      left: direction * distance,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }

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
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => move(-1)}
            aria-label="Previous testimonial"
            aria-controls="testimonial-cards"
            className="grid size-8 place-items-center rounded-full border border-card-border bg-card text-ink transition-colors hover:bg-box focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            <ArrowLeft size={14} aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => move(1)}
            aria-label="Next testimonial"
            aria-controls="testimonial-cards"
            className="grid size-8 place-items-center rounded-full border border-card-border bg-card text-ink transition-colors hover:bg-box focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            <ArrowRight size={14} aria-hidden />
          </button>
        </div>
      </div>
      <div
        id="testimonial-cards"
        ref={track}
        role="region"
        aria-label="Recommendations, scroll horizontally"
        tabIndex={0}
        data-lenis-prevent
        className="flex snap-x snap-mandatory items-stretch gap-5 overflow-x-auto overscroll-x-contain pb-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
      >
        {testimonials.slice(0, 5).map((testimonial) => (
          <article
            key={testimonial.name}
            className="flex h-[480px] w-[min(360px,88%)] shrink-0 snap-start flex-col gap-6 rounded-[20px] border border-card-border bg-card p-5"
          >
            <div className="flex items-start gap-3">
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
                <h3 className="text-[14px] font-medium leading-5 text-ink">{testimonial.name}</h3>
                <p className="mt-1 text-[12px] leading-[19.2px] text-label">
                  {testimonial.company}
                </p>
              </div>
            </div>
            <blockquote
              tabIndex={0}
              aria-label={`Recommendation from ${testimonial.name}`}
              className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain whitespace-pre-line pr-2 text-[14px] leading-[23.8px] text-body focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              {testimonial.quote}
            </blockquote>
          </article>
        ))}
      </div>
    </section>
  );
}
