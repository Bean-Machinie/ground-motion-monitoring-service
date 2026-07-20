// Minimal sparkline: one polyline drawn from hand-entered chart_series
// points. No axes, no tooltips, no library — it is a trend glyph, not a
// chart. Renders nothing at all for fewer than two points; consumers
// leave the slot empty rather than substituting a placeholder.
import type { ChartPoint } from "@/types/domain";
import styles from "./Sparkline.module.css";

interface SparklineProps {
  points: ChartPoint[];
  /** Stroke colour, e.g. "var(--color-danger)". */
  stroke: string;
  /** Rendered height in px; the width fills the container. */
  height?: number;
}

export function Sparkline({ points, stroke, height = 70 }: SparklineProps) {
  if (points.length < 2) return null;

  // X from the date axis when it parses, else even spacing.
  const times = points.map((p) => Date.parse(p.t));
  const datesValid = times.every((t) => Number.isFinite(t));
  const xs = datesValid ? times : points.map((_, i) => i);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const spanX = maxX - minX || 1;

  const values = points.map((p) => p.v);
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const spanV = maxV - minV || 1;

  // Fixed viewBox stretched to the container; vector-effect keeps the
  // stroke width honest under non-uniform scaling.
  const W = 200;
  const H = 60;
  const PAD = 4;
  const coords = points
    .map((p, i) => {
      const x = PAD + ((xs[i]! - minX) / spanX) * (W - PAD * 2);
      const y = PAD + ((maxV - p.v) / spanV) * (H - PAD * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      className={styles.sparkline}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      style={{ height }}
      aria-hidden="true"
      focusable="false"
    >
      <polyline
        points={coords}
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
