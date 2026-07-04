"use client";

import { useEffect, useMemo, useState } from "react";
import { useCompetitorOutliers } from "@/components/dataHooks";
import { VideoRow } from "@/components/VideoRow";
import { PageHeader, Badge, EmptyState } from "@/components/ui";
import {
  CredentialsNotice,
  LoadingBlock,
  DemoBanner,
} from "@/components/StateBlock";
import { DATE_WINDOWS, type DateWindowDays } from "@/lib/dateRange";

const SUBTITLE =
  "Top 50 des outliers les plus récents de TOUS tes concurrents. 0 quota en plus.";

const SELECT_CLASS =
  "rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40";

export default function OutliersConcurrentsPage() {
  const [demo, setDemo] = useState(false);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("demo") === "1")
      setDemo(true);
  }, []);

  const [win, setWin] = useState<DateWindowDays>(30);
  const [sort, setSort] = useState<"recent" | "ratio">("recent");
  const { items, loading, hasCredentials, isDemo } = useCompetitorOutliers(
    demo,
    win,
  );

  const list = useMemo(() => {
    const arr = [...items];
    if (sort === "ratio") arr.sort((a, b) => b.sv.ratio - a.sv.ratio);
    return arr.slice(0, 50);
  }, [items, sort]);

  if (loading)
    return (
      <>
        <PageHeader title="Outliers concurrents" subtitle={SUBTITLE} />
        <LoadingBlock />
      </>
    );
  if (!hasCredentials && !demo)
    return (
      <>
        <PageHeader title="Outliers concurrents" subtitle={SUBTITLE} />
        <CredentialsNotice
          message="Ajoute YOUTUBE_API_KEY et des concurrents, ou explore la démo."
          onDemo={() => setDemo(true)}
        />
      </>
    );

  return (
    <>
      <PageHeader
        title="Outliers concurrents"
        subtitle={SUBTITLE}
        actions={isDemo ? <Badge tone="accent">Démo</Badge> : undefined}
      />
      {isDemo && <DemoBanner />}
      <div className="mb-4 flex flex-wrap gap-2">
        <select
          value={win}
          onChange={(e) => setWin(Number(e.target.value) as DateWindowDays)}
          className={SELECT_CLASS}
          aria-label="Fenêtre de dates"
        >
          {DATE_WINDOWS.map((w) => (
            <option key={w.value} value={w.value}>
              {w.label}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as "recent" | "ratio")}
          className={SELECT_CLASS}
          aria-label="Tri"
        >
          <option value="recent">Tri : récent</option>
          <option value="ratio">Tri : ratio</option>
        </select>
      </div>
      <div className="mb-3 text-sm text-muted">
        {list.length} outlier{list.length > 1 ? "s" : ""}
      </div>
      {list.length === 0 ? (
        <EmptyState title="Aucun outlier de concurrent">
          Ajoute des concurrents (onglet Concurrents) ou élargis la fenêtre.
        </EmptyState>
      ) : (
        <div className="space-y-2">
          {list.map((it) => (
            <VideoRow
              key={`${it.competitorId}-${it.sv.video.id}`}
              sv={it.sv}
              action={<Badge tone="muted">{it.competitorLabel}</Badge>}
            />
          ))}
        </div>
      )}
    </>
  );
}
