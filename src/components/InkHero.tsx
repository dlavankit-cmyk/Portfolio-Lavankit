import { useEffect, useRef, useState } from "react";
import { MediaAsset } from "./MediaAsset";
import "./ink-hero.css";

// The loader and planet cards use the same screen-locked 4×4 Bayer pattern.
const bayer2 = (x: number, y: number) => {
  const value = Math.floor(x) * 0.5 + Math.floor(y) * Math.floor(y) * 0.75;
  return value - Math.floor(value);
};
const bayer4 = (x: number, y: number) => bayer2(x * 0.5, y * 0.5) * 0.25 + bayer2(x, y);

/** Render the original photograph as ink cells; hover reveals the untouched image beneath. */
export function InkHero({ src, alt }: { src: string; alt: string }) {
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const wrapper = host.current;
    const output = canvas.current;
    if (!wrapper || !output) return;
    let disposed = false;
    let frame = 0;
    const original = new Image();
    original.crossOrigin = "anonymous";
    const sample = document.createElement("canvas");
    const draw = () => {
      if (disposed || !original.complete || !original.naturalWidth) return;
      const { width, height } = wrapper.getBoundingClientRect();
      if (!width || !height) return;
      const pixel = 2;
      const columns = Math.max(1, Math.ceil(width / pixel));
      const rows = Math.max(1, Math.ceil(height / pixel));
      sample.width = columns;
      sample.height = rows;
      const input = sample.getContext("2d", { willReadFrequently: true });
      const ctx = output.getContext("2d");
      if (!input || !ctx) return;
      // Match object-fit: cover and object-position: center in the original hero.
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
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        output.width = Math.round(width * dpr);
        output.height = Math.round(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const dark = document.documentElement.classList.contains("dark");
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
                  1.25 +
                  0.5,
              ),
            );
            const density = 0.96 - luminance * 0.84;
            if (density <= bayer4(x, y) + 1 / 32) continue;
            const tone = Math.round(dark ? 238 - luminance * 75 : 1 + luminance * 76);
            ctx.fillStyle = `rgb(${tone} ${tone} ${tone})`;
            ctx.fillRect(
              x * cellWidth,
              y * cellHeight,
              Math.max(0.5, cellWidth - 0.45),
              Math.max(0.5, cellHeight - 0.45),
            );
          }
        }
        setReady(true);
      } catch {
        // If an image host disallows canvas access, retain a visible grayscale fallback.
        setReady(false);
      }
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(draw);
    };
    original.onload = schedule;
    original.src = src;
    const resize = new ResizeObserver(schedule);
    resize.observe(wrapper);
    const theme = new MutationObserver(schedule);
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resize.disconnect();
      theme.disconnect();
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
