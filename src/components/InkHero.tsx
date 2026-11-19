import { useEffect, useRef, useState } from "react";
import { MediaAsset } from "./MediaAsset";
import "./ink-hero.css";

const bayer2 = (x: number, y: number) => {
  const value = Math.floor(x) * 0.5 + Math.floor(y) * Math.floor(y) * 0.75;
  return value - Math.floor(value);
};
const bayer4 = (x: number, y: number) => bayer2(x * 0.5, y * 0.5) * 0.25 + bayer2(x, y);
type Trace = { x: number; y: number; time: number; distance: number; stroke: number };
const TRAIL_LIFETIME = 650;

/** A temporary liquid ribbon reveals the ink image only along the moving pointer path. */
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
    let stroke = 0;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    const clear = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, output.width, output.height);
    };
    const render = (time: number) => {
      frame = 0;
      traces = traces.filter((point) => time - point.time < TRAIL_LIFETIME);
      clear();
      if (!prepared || !traces.length || reduced.matches) return;
      const brush = mask.getContext("2d");
      if (!brush) return;
      brush.setTransform(1, 0, 0, 1, 0, 0);
      brush.clearRect(0, 0, mask.width, mask.height);
      brush.setTransform(dpr, 0, 0, dpr, 0, 0);
      brush.fillStyle = "#fff";
      // Feather the reveal mask, preserving the sharp detail of the image underneath.
      // Its width collapses with age; holding the pointer still cannot keep it open.
      brush.filter = `blur(${Math.max(9, Math.min(15, height * 0.07)) * dpr}px)`;
      const groups = new Map<number, Trace[]>();
      for (const point of traces) {
        const group = groups.get(point.stroke) || [];
        group.push(point);
        groups.set(point.stroke, group);
      }
      for (const points of groups.values()) {
        if (points.length < 2) continue;
        const left: { x: number; y: number }[] = [];
        const right: { x: number; y: number }[] = [];
        points.forEach((point, index) => {
          const before = points[Math.max(0, index - 2)];
          const after = points[Math.min(points.length - 1, index + 2)];
          const dx = after.x - before.x;
          const dy = after.y - before.y;
          const length = Math.hypot(dx, dy) || 1;
          const age = Math.max(0, time - point.time);
          const opening = Math.min(1, age / 45);
          const closing = Math.pow(Math.max(0, 1 - age / TRAIL_LIFETIME), 0.85);
          const taper = Math.min(1, (index + 1) / 5, (points.length - index) / 5);
          const flow = Math.sin(point.distance * 0.055 - age * 0.003);
          const radius = Math.min(29, height * 0.15) * opening * closing * taper;
          const bend = radius * flow * 0.18;
          const nx = -dy / length;
          const ny = dx / length;
          left.push({ x: point.x + nx * (radius + bend), y: point.y + ny * (radius + bend) });
          right.push({ x: point.x - nx * (radius - bend), y: point.y - ny * (radius - bend) });
        });
        const outline = [...left, ...right.reverse()];
        const last = outline[outline.length - 1];
        brush.beginPath();
        brush.moveTo((last.x + outline[0].x) / 2, (last.y + outline[0].y) / 2);
        outline.forEach((point, index) => {
          const next = outline[(index + 1) % outline.length];
          brush.quadraticCurveTo(point.x, point.y, (point.x + next.x) / 2, (point.y + next.y) / 2);
        });
        brush.closePath();
        brush.fill();
      }
      brush.filter = "none";
      ctx.drawImage(ink, 0, 0);
      ctx.globalCompositeOperation = "destination-in";
      ctx.globalAlpha = 0.72;
      ctx.drawImage(mask, 0, 0);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      frame = requestAnimationFrame(render);
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
      if (!prepared || event.pointerType === "touch" || reduced.matches) return;
      const box = wrapper.getBoundingClientRect();
      const time = performance.now();
      // A new gesture must never draw a bridge from an old, stationary cursor position.
      if (previous && time - previous.time > 250) previous = null;
      if (!previous) stroke++;
      const x = event.clientX - box.left;
      const y = event.clientY - box.top;
      const distance = previous ? Math.hypot(x - previous.x, y - previous.y) : 0;
      if (previous && distance < 1) return;
      const point: Trace = { x, y, time, distance: (previous?.distance || 0) + distance, stroke };
      const steps = Math.min(120, Math.max(1, Math.ceil(distance / 3)));
      for (let step = 1; step <= steps; step++) {
        const t = step / steps;
        traces.push({
          x: previous ? previous.x + (point.x - previous.x) * t : point.x,
          y: previous ? previous.y + (point.y - previous.y) * t : point.y,
          time: previous ? previous.time + (time - previous.time) * t : time,
          distance: previous ? previous.distance + distance * t : point.distance,
          stroke,
        });
      }
      traces = traces.slice(-600);
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
