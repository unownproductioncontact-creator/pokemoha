"use client";

import { useEffect, useMemo, useState } from "react";
import { useChannelAnalysis } from "@/components/dataHooks";
import {
  FilterBar,
  type FormatFilter,
  type SortKey,
} from "@/components/FilterBar";
import { VideoRow } from "@/components/VideoRow";
import { PageHeader, Badge, EmptyState } from "@/components/ui";
import {
  CredentialsNotice,
  LoadingBlock,
  ErrorBlock,
  DemoBanner,
} from "@/components/StateBlock";
import type { DateWindowDays } from "@/lib/dateRange";
import { selectTopOutliers } from "@/lib/outlierCore";

const SUBTITLE =
  "Tes vidéos qui sur-performent vs ta propre médiane, par format.";

export default function OutliersPage() {
  const [demo, setDemo] = useState(false);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("demo") === "1")
      setDemo(true);
  }, []);
  const { loading, data } = useChannelAnalysis({ demo });
  const [format, setFormat] = useState<FormatFilter>("all");
  const [win, setWin] = useState<DateWindowDays>(30);
  const [sort, setSort] = useState<SortKey>("ratio");

  const list = useMemo(() => {
    const scored = data?.scored ?? [];
    const byFmt =
      format === "all"
        ? scored
        : scored.filter((s) => s.video.format === format);
    let res = selectTopOutliers(byFmt, { windowDays: win });
    if (sort === "views")
      res = [...res].sort((a, b) => b.video.views - a.video.views);
    else if (sort === "recent")
      res = [...res].sort((a, b) => a.ageDays - b.ageDays);
    return res;
  }, [data, format, win, sort]);

  if (loading)
    return (
      <>
        <PageHeader title="Outliers" subtitle={SUBTITLE} />
        <LoadingBlock />
      </>
    );
  if (!data)
    return (
      <>
        <PageHeader title="Outliers" subtitle={SUBTITLE} />
        <ErrorBlock />
      </>
    );
  if (data.status === "no-credentials" || data.status === "unconfigured")
    return (
      <>
        <PageHeader title="Outliers" subtitle={SUBTITLE} />
        <CredentialsNotice message={data.message} onDemo={() => setDemo(true)} />
      </>
    );
  if (data.status === "error")
    return (
      <>
        <PageHeader title="Outliers" subtitle={SUBTITLE} />
        <ErrorBlock message={data.message} />
      </>
    );

  return (
    <>
      <PageHeader
        title="Outliers"
        subtitle={SUBTITLE}
        actions={data.demo ? <Badge tone="accent">Démo</Badge> : undefined}
      />
      {data.demo && <DemoBanner />}
      <FilterBar
        format={format}
        onFormat={setFormat}
        window={win}
        onWindow={setWin}
        sort={sort}
        onSort={setSort}
      />
      <div className="mb-3 text-sm text-muted">
        {list.length} vidéo{list.length > 1 ? "s" : ""} (outlier + démarrage fort)
      </div>
      {list.length === 0 ? (
        <EmptyState title="Aucun outlier sur cette période">
          Élargis la fenêtre de dates ou change de format.
        </EmptyState>
      ) : (
        <div className="space-y-2">
          {list.map((s) => (
            <VideoRow key={s.video.id} sv={s} />
          ))}
        </div>
      )}
    </>
  );
}
