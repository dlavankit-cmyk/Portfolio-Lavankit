import { useEffect, useRef, useState } from "react";
import { MediaAsset } from "./MediaAsset";
import "./ink-hero.css";

const bayer2 = (x: number, y: number) => {
  const value = Math.floor(x) * 0.5 + Math.floor(y) * Math.floor(y) * 0.75;
  return value - Math.floor(value);
};
const bayer4 = (x: number, y: number) => bayer2(x * 0.5, y * 0.5) * 0.25 + bayer2(x, y);
type Trace = { x: number; y: number; time: number };

/** A fine ink trail painted by pointer movement over the untouched color photograph. */
export function InkHero({ src, alt }: { src: string; alt: string }) {
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const wrapper = host.current;
    const output = canvas.current;
    if (!wrapper || !output) return;
    const ctx = output.getContext("2d");
    if (!ctx) return;
    const original = new Image();
    original.crossOrigin = "anonymous";
    const sample = document.createElement("canvas");
    const ink = document.createElement("canvas");
    const mask = document.createElement("canvas");
    let disposed = false;
    let prepared = false;
    let frame = 0;
    let resizeFrame = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let traces: Trace[] = [];
    let previous: Trace | null = null;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    const clear = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, output.width, output.height);
    };
    const render = (time: number) => {
      frame = 0;
      traces = traces.filter((point) => time - point.time < 1400);
      clear();
      if (!prepared || !traces.length) return;
      const brush = mask.getContext("2d");
      if (!brush) return;
      brush.setTransform(1, 0, 0, 1, 0, 0);
      brush.clearRect(0, 0, mask.width, mask.height);
      brush.setTransform(dpr, 0, 0, dpr, 0, 0);
      for (const point of traces) {
        const age = Math.max(0, time - point.time);
        const fadeIn = reduced.matches ? 1 : Math.min(1, age / 90);
        const fadeOut = 1 - Math.min(1, Math.max(0, age - 350) / 1050);
        const opacity = fadeIn * fadeOut * fadeOut;
        // Overlapping wisps form an irregular feathered trail, never an outlined circle.
        for (const [dx, dy, radius, weight] of [
          [0, 0, 23, 0.8],
          [-8, 5, 19, 0.45],
          [7, -6, 18, 0.45],
        ]) {
          const x = point.x + dx;
          const y = point.y + dy;
          const gradient = brush.createRadialGradient(x, y, 0, x, y, radius);
          gradient.addColorStop(0, `rgba(255,255,255,${opacity * weight})`);
          gradient.addColorStop(0.35, `rgba(255,255,255,${opacity * weight * 0.7})`);
          gradient.addColorStop(1, "rgba(255,255,255,0)");
          brush.fillStyle = gradient;
          brush.fillRect(x - radius, y - radius, radius * 2, radius * 2);
        }
      }
      ctx.drawImage(ink, 0, 0);
      ctx.globalCompositeOperation = "destination-in";
      ctx.drawImage(mask, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      if (!reduced.matches) frame = requestAnimationFrame(render);
    };
    const prepare = () => {
      if (disposed || !original.complete || !original.naturalWidth) return;
      const box = wrapper.getBoundingClientRect();
      width = box.width;
      height = box.height;
      if (!width || !height) return;
      // Subpixel cells preserve the person's outline, screen, desk and fine grass detail.
      const columns = Math.max(1, Math.ceil(width / 0.8));
      const rows = Math.max(1, Math.ceil(height / 0.8));
      sample.width = columns;
      sample.height = rows;
      const input = sample.getContext("2d", { willReadFrequently: true });
      const texture = ink.getContext("2d");
      if (!input || !texture) return;
      const scale = Math.max(columns / original.naturalWidth, rows / original.naturalHeight);
      input.drawImage(
        original,
        (columns - original.naturalWidth * scale) / 2,
        (rows - original.naturalHeight * scale) / 2,
        original.naturalWidth * scale,
        original.naturalHeight * scale,
      );
      try {
        const pixels = input.getImageData(0, 0, columns, rows).data;
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        for (const surface of [output, ink, mask]) {
          surface.width = Math.round(width * dpr);
          surface.height = Math.round(height * dpr);
        }
        texture.setTransform(dpr, 0, 0, dpr, 0, 0);
        const dark = document.documentElement.classList.contains("dark");
        texture.fillStyle = dark ? "#000" : "#fff";
        texture.fillRect(0, 0, width, height);
        const cellWidth = width / columns;
        const cellHeight = height / rows;
        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < columns; x++) {
            const index = (y * columns + x) * 4;
            const luminance = Math.max(
              0,
              Math.min(
                1,
                ((pixels[index] * 0.2126 +
                  pixels[index + 1] * 0.7152 +
                  pixels[index + 2] * 0.0722) /
                  255 -
                  0.5) *
                  1.15 +
                  0.5,
              ),
            );
            if (0.96 - luminance * 0.84 <= bayer4(x, y) + 1 / 32) continue;
            const tone = Math.round(dark ? 238 - luminance * 75 : 1 + luminance * 76);
            texture.fillStyle = `rgb(${tone} ${tone} ${tone})`;
            texture.fillRect(x * cellWidth, y * cellHeight, cellWidth - 0.08, cellHeight - 0.08);
          }
        }
        prepared = true;
        setReady(true);
        clear();
        if (traces.length && !frame) frame = requestAnimationFrame(render);
      } catch {
        prepared = false;
        setReady(false);
        clear();
      }
    };
    const move = (event: PointerEvent) => {
      if (!prepared || event.pointerType === "touch") return;
      const box = wrapper.getBoundingClientRect();
      const point = {
        x: event.clientX - box.left,
        y: event.clientY - box.top,
        time: performance.now(),
      };
      // Ignore tiny pointer jitter; entering or resting alone does not trigger the effect.
      if (previous && Math.hypot(point.x - previous.x, point.y - previous.y) < 1) return;
      if (reduced.matches) traces = [];
      const distance = previous ? Math.hypot(point.x - previous.x, point.y - previous.y) : 0;
      const steps = Math.min(100, Math.max(1, Math.ceil(distance / 4)));
      for (let step = 1; step <= steps; step++) {
        const t = step / steps;
        traces.push({
          x: previous ? previous.x + (point.x - previous.x) * t : point.x,
          y: previous ? previous.y + (point.y - previous.y) * t : point.y,
          time: point.time,
        });
      }
      traces = traces.slice(-300);
      previous = point;
      if (!frame) frame = requestAnimationFrame(render);
    };
    const leave = () => {
      previous = null;
      if (reduced.matches) {
        traces = [];
        clear();
      }
    };
    const schedule = () => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(prepare);
    };
    original.onload = schedule;
    original.src = src;
    const resize = new ResizeObserver(schedule);
    resize.observe(wrapper);
    const theme = new MutationObserver(schedule);
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    wrapper.addEventListener("pointermove", move, { passive: true });
    wrapper.addEventListener("pointerleave", leave);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      cancelAnimationFrame(resizeFrame);
      resize.disconnect();
      theme.disconnect();
      wrapper.removeEventListener("pointermove", move);
      wrapper.removeEventListener("pointerleave", leave);
      original.onload = null;
    };
  }, [src]);

  return (
    <div ref={host} className="ink-hero relative h-[105%] w-full" data-ink-ready={ready}>
      <MediaAsset
        type="image"
        src={src}
        alt={alt}
        className="size-full"
        mediaClassName="size-full object-cover"
        loading="eager"
        fetchPriority="high"
      />
      <canvas
        ref={canvas}
        aria-hidden="true"
        className="ink-hero__canvas pointer-events-none absolute inset-0 size-full"
      />
    </div>
  );
}
