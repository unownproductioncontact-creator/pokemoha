function Bar({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted">{label}</span>
        <span className="font-medium tabular-nums">{value}/100</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-elevated">
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.max(2, value)}%`, background: tone }}
        />
      </div>
    </div>
  );
}

/** Barres Menace & Inspiration (scores ESTIMÉS, §5). */
export function ScoreBars({
  menace,
  inspiration,
}: {
  menace: number;
  inspiration: number;
}) {
  return (
    <div className="space-y-2">
      <Bar label="Menace" value={menace} tone="var(--danger)" />
      <Bar label="Inspiration" value={inspiration} tone="var(--brand)" />
    </div>
  );
}
