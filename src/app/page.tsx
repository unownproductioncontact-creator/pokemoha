"use client";

import { useEffect, useState } from "react";
import { useChannelAnalysis } from "@/components/dataHooks";
import { PageHeader, StatCard, Card, Badge, DataBadge } from "@/components/ui";
import { BarsChart } from "@/components/Chart";
import { VideoRow } from "@/components/VideoRow";
import {
  CredentialsNotice,
  LoadingBlock,
  ErrorBlock,
  DemoBanner,
} from "@/components/StateBlock";
import { formatCompact, formatInt } from "@/lib/format";

const SUBTITLE =
  "KPIs, performance et dernières vidéos — toujours séparés Shorts / vidéos longues.";

export default function DashboardPage() {
  const [demo, setDemo] = useState(false);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("demo") === "1")
      setDemo(true);
  }, []);
  const { loading, data } = useChannelAnalysis({ demo });

  if (loading)
    return (
      <>
        <PageHeader title="Dashboard" subtitle={SUBTITLE} />
        <LoadingBlock />
      </>
    );
  if (!data)
    return (
      <>
        <PageHeader title="Dashboard" subtitle={SUBTITLE} />
        <ErrorBlock />
      </>
    );
  if (data.status === "no-credentials" || data.status === "unconfigured")
    return (
      <>
        <PageHeader title="Dashboard" subtitle={SUBTITLE} />
        <CredentialsNotice message={data.message} onDemo={() => setDemo(true)} />
      </>
    );
  if (data.status === "error")
    return (
      <>
        <PageHeader title="Dashboard" subtitle={SUBTITLE} />
        <ErrorBlock message={data.message} />
      </>
    );

  const scored = data.scored ?? [];
  const ch = data.channel!;
  const shorts = scored.filter((s) => s.video.format === "short");
  const longs = scored.filter((s) => s.video.format === "long");
  const outliers = scored.filter(
    (s) => s.flag === "outlier" || s.flag === "emerging",
  );
  const dominant: "short" | "long" =
    longs.length >= shorts.length ? "long" : "short";
  const domChart = scored
    .filter((s) => s.video.format === dominant)
    .sort((a, b) => a.ageDays - b.ageDays)
    .slice(0, 14)
    .reverse();
  const recent = [...scored].sort((a, b) => a.ageDays - b.ageDays).slice(0, 6);

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={ch.title}
        actions={
          data.demo ? (
            <Badge tone="accent">Démo</Badge>
          ) : (
            <Badge tone={data.source === "oauth" ? "success" : "info"}>
              {data.source === "oauth" ? "OAuth" : "Clé API"}
            </Badge>
          )
        }
      />
      {data.demo && <DemoBanner />}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Abonnés"
          value={ch.subscribers != null ? formatCompact(ch.subscribers) : "—"}
          status={ch.subscribers != null ? "real" : "unavailable"}
        />
        <StatCard
          label="Vues totales"
          value={ch.totalViews != null ? formatCompact(ch.totalViews) : "—"}
          status={ch.totalViews != null ? "real" : "unavailable"}
        />
        <StatCard
          label="Vidéos"
          value={ch.videoCount != null ? formatInt(ch.videoCount) : "—"}
          status={ch.videoCount != null ? "real" : "unavailable"}
        />
        <StatCard
          label="Outliers"
          value={outliers.length}
          hint="outlier + démarrage fort"
        />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <StatCard
          label="Médiane Shorts"
          value={data.medians ? formatCompact(data.medians.short) : "—"}
          hint={`${shorts.length} Shorts`}
          status="real"
        />
        <StatCard
          label="Médiane Longues"
          value={data.medians ? formatCompact(data.medians.long) : "—"}
          hint={`${longs.length} vidéos longues`}
          status="real"
        />
      </div>

      <Card className="mt-3 p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium">
            Performance des dernières{" "}
            {dominant === "long" ? "vidéos longues" : "Shorts"}
          </span>
          <DataBadge status="real" />
        </div>
        <BarsChart
          data={domChart.map((s) => ({ value: s.video.views, flag: s.flag }))}
          median={dominant === "long" ? data.medians?.long : data.medians?.short}
        />
        <p className="mt-2 text-xs text-muted">
          Barres = vues réelles. Ligne pointillée = médiane{" "}
          {dominant === "long" ? "longues" : "Shorts"}.
        </p>
      </Card>

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold">Dernières vidéos</h2>
          <a
            href="/outliers"
            className="text-sm font-medium text-brand hover:underline"
          >
            Voir tous les outliers →
          </a>
        </div>
        <div className="space-y-2">
          {recent.map((s) => (
            <VideoRow key={s.video.id} sv={s} />
          ))}
        </div>
      </div>
    </>
  );
}
