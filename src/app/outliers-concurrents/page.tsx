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
import {
  FilterBar,
  type FormatFilter,
  type SortKey,
} from "@/components/FilterBar";
import { usePersistedState } from "@/components/usePersistedState";
import type { DateWindowDays } from "@/lib/dateRange";

const SUBTITLE =
  "Top 50 des outliers les plus récents de TOUS tes concurrents. 0 quota en plus.";

export default function OutliersConcurrentsPage() {
  const [demo, setDemo] = useState(false);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("demo") === "1")
      setDemo(true);
  }, []);

  // Mêmes filtres que « Mes outliers » (audit UX F031) + mémoire par écran (F013).
  const [format, setFormat] = usePersistedState<FormatFilter>(
    "pkm-filtres:outliers-concurrents:format",
    "all",
  );
  const [win, setWin] = usePersistedState<DateWindowDays>(
    "pkm-filtres:outliers-concurrents:periode",
    30,
  );
  const [sort, setSort] = usePersistedState<SortKey>(
    "pkm-filtres:outliers-concurrents:tri",
    "recent",
  );
  const { items, loading, hasCredentials, isDemo } = useCompetitorOutliers(
    demo,
    win,
  );

  const list = useMemo(() => {
    let arr =
      format === "all"
        ? [...items]
        : items.filter((it) => it.sv.video.format === format);
    if (sort === "ratio") arr = arr.sort((a, b) => b.sv.ratio - a.sv.ratio);
    else if (sort === "views")
      arr = arr.sort((a, b) => b.sv.video.views - a.sv.video.views);
    return arr.slice(0, 50);
  }, [items, sort, format]);

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
        <CredentialsNotice message="Ajoute YOUTUBE_API_KEY et des concurrents, ou explore la démo." />
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
      <FilterBar
        format={format}
        onFormat={setFormat}
        window={win}
        onWindow={setWin}
        sort={sort}
        onSort={setSort}
      />
      <div className="mb-3 text-sm text-muted">
        {list.length} outlier{list.length > 1 ? "s" : ""}
        {sort !== "recent" && (
          // Honnêteté (audit UX F031) : la source ne renvoie que les 50 outliers
          // les plus récents ; tri/filtre s'appliquent à ce lot, pas au global.
          <span className="text-xs">
            {" "}
            · tri/filtre parmi les 50 plus récents
          </span>
        )}
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
