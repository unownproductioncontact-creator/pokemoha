import type { OutlierFlag, Confidence } from "@/lib/types";
import { Badge, type Tone } from "@/components/ui";
import { formatRatio } from "@/lib/format";
import { cn } from "@/lib/cn";

const FLAG_META: Record<
  OutlierFlag,
  { label: string; tone: Tone; emoji?: string }
> = {
  outlier: { label: "Outlier", tone: "success" },
  emerging: { label: "Démarrage fort", tone: "accent", emoji: "🌱" },
  normal: { label: "Normal", tone: "muted" },
  under: { label: "Sous la médiane", tone: "danger" },
};

export function FlagBadge({ flag }: { flag: OutlierFlag }) {
  const m = FLAG_META[flag];
  return (
    <Badge tone={m.tone}>
      {m.emoji ? `${m.emoji} ` : ""}
      {m.label}
    </Badge>
  );
}

const CONF_META: Record<Confidence, { label: string; tone: Tone }> = {
  high: { label: "Confiance élevée", tone: "success" },
  medium: { label: "Confiance moyenne", tone: "warning" },
  low: { label: "Confiance faible", tone: "muted" },
};

export function ConfidenceBadge({ c }: { c: Confidence }) {
  const m = CONF_META[c];
  return <Badge tone={m.tone}>{m.label}</Badge>;
}

const RATIO_COLOR: Record<OutlierFlag, string> = {
  outlier: "text-success",
  emerging: "text-accent",
  normal: "text-muted",
  under: "text-danger",
};

export function RatioPill({
  ratio,
  flag,
  projected,
}: {
  ratio: number;
  flag: OutlierFlag;
  projected?: number;
}) {
  return (
    <div className="shrink-0 text-right">
      <div className={cn("text-lg font-bold tabular-nums", RATIO_COLOR[flag])}>
        {formatRatio(ratio)}
      </div>
      {flag === "emerging" && projected ? (
        <div className="text-[10px] text-muted">proj. {formatRatio(projected)}</div>
      ) : null}
    </div>
  );
}
