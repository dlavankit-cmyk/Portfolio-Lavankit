import type { CSSProperties, ReactNode } from "react";
import "./beam-card.css";

type BeamCardProps = {
  color: "red" | "green";
  theme?: "light" | "dark"; // omit to follow the site theme / prefers-color-scheme
  strength?: number; // 0-1, glow intensity, default 0.45
  active?: boolean; // false pauses the animation, default true
  delay?: number; // seconds, offsets the animation phase
  children: ReactNode;
};

export function BeamCard({
  color,
  theme,
  strength = 0.45,
  active = true,
  delay = 0,
  children,
}: BeamCardProps) {
  const style = {
    "--beam-strength": strength,
    "--beam-delay": `${-delay}s`,
    "--beam-state": active ? "running" : "paused",
  } as CSSProperties;

  return (
    <div className="beam-card" data-color={color} data-theme={theme} style={style}>
      <span className="beam-glow" aria-hidden="true">
        <span className="beam-glow-ring" />
      </span>
      <span className="beam-ring-blur" aria-hidden="true">
        <span className="beam-ring" />
      </span>
      <div className="beam-surface">{children}</div>
    </div>
  );
}
