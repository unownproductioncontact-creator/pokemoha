"use client";

import { useEffect, useMemo, useState } from "react";
import { useChannelAnalysis } from "@/components/dataHooks";
import { analyzeHooks } from "@/lib/hooksCore";
import { PageHeader, Card, Badge, EmptyState } from "@/components/ui";
import {
  CredentialsNotice,
  LoadingBlock,
  ErrorBlock,
  DemoBanner,
} from "@/components/StateBlock";
import { formatRatio } from "@/lib/format";
import type { ScoredVideo, VideoFormat } from "@/lib/types";

const SUBTITLE =
  "Les motifs de titres qui sur-performent — séparés Shorts / vidéos longues (leurs codes diffèrent). « Lift » = ratio moyen avec le motif ÷ sans.";

/** Analyse d'un sous-ensemble (un format) : privilégie les titres performants. */
function analysisFor(scored: ScoredVideo[], format: VideoFormat) {
  const inFmt = scored.filter((s) => s.video.format === format);
  const hits = inFmt.filter((s) => s.flag === "outlier" || s.flag === "emerging");
  const base = hits.length >= 4 ? hits : inFmt;
  return analyzeHooks(base.map((s) => ({ title: s.video.title, ratio: s.ratio })));
}

function HookSection({
  title,
  analysis,
}: {
  title: string;
  analysis: ReturnType<typeof analyzeHooks>;
}) {
  const patterns = analysis.patterns.filter((p) => p.count > 0);
  return (
    <section className="mt-6 first:mt-0">
      <h2 className="mb-1 font-semibold">{title}</h2>
      <p className="mb-3 text-sm text-muted">
        Basé sur {analysis.total} titre{analysis.total > 1 ? "s" : ""} performant
        {analysis.total > 1 ? "s" : ""} de ce format.
      </p>
      {patterns.length === 0 ? (
        <EmptyState title="Pas assez de titres pour ce format">
          Reviens quand ta chaîne aura plus de vidéos de ce format.
        </EmptyState>
      ) : (
        <div className="space-y-2">
          {patterns.map((p) => {
            // Plancher d'échantillon (F046) : un lift sur < 3 titres n'est pas
            // une preuve → couleur neutre + mention. Crucial ici : la séparation
            // par format réduit les échantillons.
            const weak = p.count < 3;
            return (
              <Card key={p.id} className="p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{p.label}</span>
                  <Badge
                    tone={
                      weak
                        ? "muted"
                        : p.lift >= 1.2
                          ? "success"
                          : p.lift >= 0.95
                            ? "muted"
                            : "danger"
                    }
                  >
                    {p.lift === Infinity ? "lift ∞" : `lift ${formatRatio(p.lift)}`}
                    {weak ? " · échantillon faible" : ""}
                  </Badge>
                </div>
                <div className="mt-1 text-xs text-muted">
                  {p.count} titre{p.count > 1 ? "s" : ""} (
                  {Math.round(p.share * 100)}%) · ratio moyen{" "}
                  {formatRatio(p.avgRatioWith)} avec / {formatRatio(p.avgRatioWithout)}{" "}
                  sans
                </div>
                {p.examples.length > 0 && (
                  <div className="mt-1 line-clamp-1 text-xs text-muted">
                    ex : {p.examples[0]}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
      {analysis.powerWords.length > 0 && (
        <div className="mt-3">
          <div className="mb-2 text-sm font-medium text-muted">
            Mots-clés récurrents
          </div>
          <div className="flex flex-wrap gap-2">
            {analysis.powerWords.map((w) => (
              <Badge key={w.word} tone="brand">
                {w.word} · {w.count}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default function HooksPage() {
  const [demo, setDemo] = useState(false);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("demo") === "1")
      setDemo(true);
  }, []);
  const { loading, data, reload } = useChannelAnalysis({ demo });

  const longs = useMemo(() => analysisFor(data?.scored ?? [], "long"), [data]);
  const shorts = useMemo(() => analysisFor(data?.scored ?? [], "short"), [data]);

  const header = (
    <PageHeader
      title="Hooks"
      subtitle={SUBTITLE}
      actions={data?.demo ? <Badge tone="accent">Démo</Badge> : undefined}
    />
  );

  if (loading)
    return (
      <>
        {header}
        <LoadingBlock />
      </>
    );
  if (!data)
    return (
      <>
        {header}
        <ErrorBlock onRetry={reload} />
      </>
    );
  if (data.status === "no-credentials" || data.status === "unconfigured")
    return (
      <>
        {header}
        <CredentialsNotice message={data.message} />
      </>
    );
  if (data.status === "error")
    return (
      <>
        {header}
        <ErrorBlock message={data.message} onRetry={reload} />
      </>
    );

  return (
    <>
      {header}
      {data.demo && <DemoBanner />}
      <HookSection title="Vidéos longues" analysis={longs} />
      <HookSection title="Shorts" analysis={shorts} />
    </>
  );
}
