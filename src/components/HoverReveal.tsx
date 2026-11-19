import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

type Photo = { src: string; alt: string };

/** Anchored photo stacks stay still so exposed cards can be brought forward. */
export function HoverReveal({ children, images, caption }: {
  children: ReactNode;
  images: Photo[];
  caption?: string;
}) {
  const [open, setOpen] = useState(false);
  const [front, setFront] = useState(0);
  const [pos, setPos] = useState({ left: 0, top: 0, below: false });
  const trigger = useRef<HTMLButtonElement>(null);
  const gallery = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const id = useId();
  const keepOpen = () => clearTimeout(timer.current);
  const closeSoon = () => {
    keepOpen();
    timer.current = setTimeout(() => setOpen(false), 160);
  };
  const show = () => {
    keepOpen();
    const r = trigger.current?.getBoundingClientRect();
    if (!r) return;
    const width = Math.min(images.length > 1 ? 350 : 250, window.innerWidth - 24);
    const height = images.length > 1 ? width * .72 : width * .75 + (caption ? 32 : 0);
    setPos({ left: Math.max(12, Math.min(r.left + r.width / 2 - width / 2, window.innerWidth - width - 12)), top: r.top < height + 26 ? r.bottom : r.top, below: r.top < height + 26 });
    if (!open) setFront(0);
    setOpen(true);
  };
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") { trigger.current?.focus(); close(); } };
    const outside = (e: PointerEvent) => {
      if (!trigger.current?.contains(e.target as Node) && !gallery.current?.contains(e.target as Node)) close();
    };
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    window.addEventListener("keydown", key);
    document.addEventListener("pointerdown", outside);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      window.removeEventListener("keydown", key);
      document.removeEventListener("pointerdown", outside);
    };
  }, [open]);

  return <>
    <button ref={trigger} type="button" aria-expanded={open} aria-controls={id}
      className="cursor-pointer border-0 bg-transparent p-0 font-[inherit] text-[inherit] leading-[inherit] tracking-[inherit] underline decoration-ink decoration-dotted decoration-1 underline-offset-[3px] transition-colors hover:text-ink focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
      onMouseEnter={show} onMouseLeave={closeSoon} onFocus={show} onBlur={closeSoon}
      onClick={show}>{children}</button>
    {createPortal(<div ref={gallery} id={id} role="group" aria-label={`Photos: ${typeof children === "string" ? children : "About me"}`}
      hidden={!open} onMouseEnter={keepOpen} onMouseLeave={closeSoon} onFocus={keepOpen} onBlur={closeSoon}
      className="fixed z-50" style={{ left: pos.left, top: pos.top, width: `min(${images.length > 1 ? 350 : 250}px, calc(100vw - 24px))`, paddingTop: pos.below ? 18 : 0, paddingBottom: pos.below ? 0 : 18, transform: pos.below ? undefined : "translateY(-100%)" }}>
      <div className="relative" style={{ aspectRatio: images.length > 1 ? "1.4" : "4/3" }}>
        {images.map((photo, i) => <button key={photo.src} type="button" aria-label={`Bring photo ${i + 1} to front: ${photo.alt}`}
          onMouseEnter={() => setFront(i)} onFocus={() => setFront(i)} onClick={() => setFront(i)}
          className="absolute cursor-pointer rounded-xl border-0 bg-card p-1.5 shadow-[0_12px_32px_-10px_rgba(0,0,0,0.55)] transition-transform duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:transition-none"
          style={{ width: images.length > 1 ? "72%" : "100%", height: images.length > 1 ? "76%" : "100%", left: images.length > 1 ? `${i * (26 / Math.max(images.length - 1, 1))}%` : 0, top: images.length > 1 ? `${i * (21 / Math.max(images.length - 1, 1))}%` : 0, zIndex: front === i ? 10 : images.length - i, transform: `rotate(${images.length > 1 ? [-4, 3, -2][i % 3] : -2}deg) scale(${front === i ? 1.02 : 1})` }}>
          <img src={photo.src} alt={photo.alt} draggable={false} className="block size-full rounded-lg object-cover" />
        </button>)}
      </div>
      {caption && <p className="mt-3 text-center text-[14px] font-medium text-ink">{caption}</p>}
    </div>, document.body)}
  </>;
}
