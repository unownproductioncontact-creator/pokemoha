"use client";

import { useEffect, useMemo, useState } from "react";
import { useChannelAnalysis } from "@/components/dataHooks";
import { analyzeHooks, detectHookPatterns } from "@/lib/hooksCore";
import { PageHeader, Card, Badge, EmptyState } from "@/components/ui";
import { RatioPill, FlagBadge } from "@/components/outlierUi";
import {
  CredentialsNotice,
  LoadingBlock,
  ErrorBlock,
  DemoBanner,
} from "@/components/StateBlock";
import { formatCompact, formatRatio } from "@/lib/format";

const SUBTITLE =
  "Tes dernières vidéos avec des quick wins concrets : hooks de titre manquants + analyse de miniature.";

export default function OptimiserPage() {
  const [demo, setDemo] = useState(false);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("demo") === "1")
      setDemo(true);
  }, []);
  const { loading, data } = useChannelAnalysis({ demo });

  const { recent, winners } = useMemo(() => {
    const scored = data?.scored ?? [];
    const hits = scored.filter(
      (s) => s.flag === "outlier" || s.flag === "emerging",
    );
    const base = hits.length >= 4 ? hits : scored;
    const analysis = analyzeHooks(
      base.map((s) => ({ title: s.video.title, ratio: s.ratio })),
    );
    const winners = analysis.patterns
      .filter((p) => p.count >= 2 && (p.lift >= 1.2 || p.lift === Infinity))
      .slice(0, 4);
    const recent = [...scored]
      .sort((a, b) => a.ageDays - b.ageDays)
      .slice(0, 10);
    return { recent, winners };
  }, [data]);

  const header = (
    <PageHeader
      title="Optimiser mes vidéos"
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
        <CredentialsNotice message={data.message} onDemo={() => setDemo(true)} />
      </>
    );
  if (data.status === "error")
    return (
      <>
        {header}
        <ErrorBlock message={data.message} />
      </>
    );

  return (
    <>
      {header}
      {data.demo && <DemoBanner />}

      {winners.length > 0 && (
        <Card className="mb-4 p-3">
          <div className="mb-1.5 text-sm font-medium">
            Hooks gagnants de ta chaîne
          </div>
          <div className="flex flex-wrap gap-2">
            {winners.map((w) => (
              <Badge key={w.id} tone="success">
                {w.label}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {recent.length === 0 ? (
        <EmptyState title="Aucune vidéo à optimiser" />
      ) : (
        <div className="space-y-2">
          {recent.map((s) => {
            const present = new Set(detectHookPatterns(s.video.title));
            const missing = winners.filter((w) => !present.has(w.id));
            const watch = `https://www.youtube.com/watch?v=${s.video.id}`;
            return (
              <Card key={s.video.id} className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <a
                    href={watch}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="line-clamp-1 text-sm font-medium hover:text-brand"
                  >
                    {s.video.title}
                  </a>
                  <RatioPill
                    ratio={s.ratio}
                    flag={s.flag}
                    projected={s.projectedRatio}
                  />
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                  <span className="tabular-nums">
                    {formatCompact(s.video.views)} vues
                  </span>
                  <FlagBadge flag={s.flag} />
                </div>
                <ul className="mt-2 space-y-1 text-xs text-muted">
                  {missing.length > 0 ? (
                    missing.map((m) => (
                      <li key={m.id} className="flex gap-1.5">
                        <span className="text-brand">+</span>
                        Titre : ajoute « {m.label} » (lift{" "}
                        {m.lift === Infinity ? "∞" : formatRatio(m.lift)})
                      </li>
                    ))
                  ) : (
                    <li className="flex gap-1.5">
                      <span className="text-success">✓</span>
                      Titre : applique déjà tes hooks gagnants
                    </li>
                  )}
                  <li>
                    <a
                      href={`/miniatures?url=${encodeURIComponent(watch)}`}
                      className="text-brand hover:underline"
                    >
                      Analyser la miniature →
                    </a>
                  </li>
                </ul>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
