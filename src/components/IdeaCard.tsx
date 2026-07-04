import { Card, Badge } from "@/components/ui";
import type { Tone } from "@/components/ui";
import type { Idea } from "@/lib/ideaRanking";

const SOURCE_TONE: Record<string, Tone> = {
  mine: "brand",
  competitor: "warning",
  niche: "info",
  world: "success",
};

function ScoreLine({
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
        <span className="font-medium tabular-nums">{value}</span>
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

export function IdeaCard({ idea }: { idea: Idea }) {
  return (
    <Card className="flex flex-col p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium">{idea.title}</h3>
        <Badge tone={SOURCE_TONE[idea.source] ?? "muted"}>
          {idea.sourceLabel}
        </Badge>
      </div>
      <p className="mt-1 text-sm text-muted">{idea.angle}</p>
      <p className="mt-1 text-xs text-muted">{idea.why}</p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <ScoreLine
          label="Opportunité"
          value={idea.opportunity}
          tone="var(--success)"
        />
        <ScoreLine label="Qualité" value={idea.quality} tone="var(--brand)" />
      </div>
      <a
        href={`/generateur-titres?idee=${encodeURIComponent(idea.title)}`}
        className="mt-3 self-start text-sm font-medium text-brand hover:underline"
      >
        Générer des titres →
      </a>
    </Card>
  );
}
