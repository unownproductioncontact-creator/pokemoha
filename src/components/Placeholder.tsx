import { PageHeader, Card, Badge } from "@/components/ui";

/** Page-stub d'un onglet pas encore livré (remplacée à la phase indiquée). */
export function Placeholder({
  title,
  subtitle,
  phase,
  points,
}: {
  title: string;
  subtitle?: string;
  phase: number;
  points?: string[];
}) {
  return (
    <>
      <PageHeader title={title} subtitle={subtitle} />
      <Card className="p-6">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge tone="brand">Phase {phase}</Badge>
          <span className="text-muted">Module en cours de construction.</span>
        </div>
        {points && points.length > 0 && (
          <ul className="mt-4 space-y-1.5 text-sm text-muted">
            {points.map((p) => (
              <li key={p} className="flex gap-2">
                <span className="text-brand">•</span>
                {p}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
