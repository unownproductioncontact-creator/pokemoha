import type { OutlierFlag } from "@/lib/types";

const BAR_COLOR: Record<OutlierFlag, string> = {
  outlier: "var(--success)",
  emerging: "var(--accent)",
  normal: "var(--brand)",
  under: "var(--muted)",
};

/** Mini bar-chart SVG, sans dépendance. Barres = valeurs réelles, ligne = médiane. */
export function BarsChart({
  data,
  median,
}: {
  data: { value: number; flag: OutlierFlag }[];
  median?: number;
}) {
  if (!data.length)
    return <div className="text-sm text-muted">Pas assez de données.</div>;
  const W = 600;
  const H = 170;
  const pad = 4;
  const max = Math.max(...data.map((d) => d.value), median ?? 0, 1);
  const bw = (W - pad * 2) / data.length;
  const y = (v: number) => H - (v / max) * (H - 18) - 2;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img">
      {median && median > 0 ? (
        <line
          x1={0}
          x2={W}
          y1={y(median)}
          y2={y(median)}
          stroke="var(--muted)"
          strokeWidth={1.2}
          strokeDasharray="5 4"
          opacity={0.8}
        />
      ) : null}
      {data.map((d, i) => {
        const x = pad + i * bw;
        const top = y(d.value);
        return (
          <rect
            key={i}
            x={x + bw * 0.12}
            y={top}
            width={bw * 0.76}
            height={H - top - 2}
            rx={2}
            fill={BAR_COLOR[d.flag]}
          />
        );
      })}
    </svg>
  );
}
