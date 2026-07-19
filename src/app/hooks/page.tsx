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

const SUBTITLE =
  "Les motifs de titres qui sur-performent sur ta chaîne. « Lift » = ratio moyen avec le motif ÷ sans le motif.";

export default function HooksPage() {
  const [demo, setDemo] = useState(false);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("demo") === "1")
      setDemo(true);
  }, []);
  const { loading, data } = useChannelAnalysis({ demo });

  const analysis = useMemo(() => {
    const scored = data?.scored ?? [];
    const hits = scored.filter(
      (s) => s.flag === "outlier" || s.flag === "emerging",
    );
    const base = hits.length >= 4 ? hits : scored;
    return analyzeHooks(base.map((s) => ({ title: s.video.title, ratio: s.ratio })));
  }, [data]);

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
        <ErrorBlock />
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
        <ErrorBlock message={data.message} />
      </>
    );

  const patterns = analysis.patterns.filter((p) => p.count > 0);

  return (
    <>
      {header}
      {data.demo && <DemoBanner />}
      <p className="mb-4 text-sm text-muted">
        Basé sur {analysis.total} titres performants de ta chaîne.
      </p>

      {patterns.length === 0 ? (
        <EmptyState title="Pas assez de titres à analyser">
          Reviens quand ta chaîne aura plus de vidéos.
        </EmptyState>
      ) : (
        <div className="space-y-2">
          {patterns.map((p) => {
            // Plancher d'échantillon (audit UX F046) : un lift calculé sur < 3
            // titres n'est pas une preuve → couleur neutre + mention.
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
        <section className="mt-6">
          <h2 className="mb-2 font-semibold">Mots-clés récurrents</h2>
          <div className="flex flex-wrap gap-2">
            {analysis.powerWords.map((w) => (
              <Badge key={w.word} tone="brand">
                {w.word} · {w.count}
              </Badge>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
