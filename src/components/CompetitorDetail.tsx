"use client";

import { useMemo, useState } from "react";
import { useCompetitorDetail, saveInspiration } from "@/components/dataHooks";
import {
  FilterBar,
  type FormatFilter,
  type SortKey,
} from "@/components/FilterBar";
import { VideoRow } from "@/components/VideoRow";
import { ScoreBars } from "@/components/ScoreBars";
import { Card, Badge, DataBadge, EmptyState } from "@/components/ui";
import { LoadingBlock, ErrorBlock } from "@/components/StateBlock";
import { ICONS } from "@/components/icons";
import { formatCompact } from "@/lib/format";
import { selectTopOutliers } from "@/lib/outlierCore";
import type { DateWindowDays } from "@/lib/dateRange";
import type { ScoredVideo } from "@/lib/types";

function SaveButton({
  sv,
  onSaved,
}: {
  sv: ScoredVideo;
  onSaved?: () => void;
}) {
  const [saved, setSaved] = useState(false);
  const Bulb = ICONS.bulb;
  return (
    <button
      type="button"
      onClick={async () => {
        await saveInspiration({
          videoId: sv.video.id,
          title: sv.video.title,
          url: `https://www.youtube.com/watch?v=${sv.video.id}`,
          channelTitle: sv.video.channelTitle,
          ratio: sv.ratio,
          thumb: sv.video.thumbnails?.medium,
        });
        setSaved(true);
        // Rafraîchit la liste « Inspirations sauvegardées » (audit UX/review :
        // sinon le cache SWR la garde périmée jusqu'à expiration du dedup).
        onSaved?.();
      }}
      disabled={saved}
      className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline disabled:text-muted disabled:no-underline"
    >
      <Bulb className="h-3.5 w-3.5" />
      {saved ? "Inspiration enregistrée" : "Sauver l'inspiration"}
    </button>
  );
}

export function CompetitorDetail({
  id,
  demo,
  onBack,
  onInspirationSaved,
}: {
  id: string;
  demo?: boolean;
  onBack: () => void;
  onInspirationSaved?: () => void;
}) {
  const { loading, data } = useCompetitorDetail(id, demo);
  const [format, setFormat] = useState<FormatFilter>("all");
  const [win, setWin] = useState<DateWindowDays>(90);
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

  const Back = ICONS.chevron;
  const backBtn = (
    <button
      type="button"
      onClick={onBack}
      className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink"
    >
      <Back className="h-4 w-4 rotate-90" /> Retour aux concurrents
    </button>
  );

  if (loading)
    return (
      <>
        {backBtn}
        <LoadingBlock />
      </>
    );
  if (!data || data.status !== "ok")
    return (
      <>
        {backBtn}
        <ErrorBlock message={data?.message ?? "Concurrent indisponible."} />
      </>
    );

  const ch = data.channel;
  return (
    <>
      {backBtn}
      <Card className="mb-4 p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              {data.label}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
              {ch?.subscribers != null && (
                <span>{formatCompact(ch.subscribers)} abonnés</span>
              )}
              {data.medians && (
                <span>
                  médianes : {formatCompact(data.medians.long)} (long) ·{" "}
                  {formatCompact(data.medians.short)} (short)
                </span>
              )}
            </div>
          </div>
          {data.scores && (
            <div className="w-full max-w-xs">
              <div className="mb-1 flex justify-end">
                <DataBadge status="estimated" />
              </div>
              <ScoreBars
                menace={data.scores.menace}
                inspiration={data.scores.inspiration}
              />
            </div>
          )}
        </div>
      </Card>

      <FilterBar
        format={format}
        onFormat={setFormat}
        window={win}
        onWindow={setWin}
        sort={sort}
        onSort={setSort}
      />
      <div className="mb-3 text-sm text-muted">
        {list.length} outlier{list.length > 1 ? "s" : ""} de cette chaîne
        {" · "}
        <Badge tone="muted">CTR/rétention indisponibles (chaîne tierce)</Badge>
      </div>
      {list.length === 0 ? (
        <EmptyState title="Aucun outlier sur cette période">
          Élargis la fenêtre ou change de format.
        </EmptyState>
      ) : (
        <div className="space-y-2">
          {list.map((s) => (
            <VideoRow
              key={s.video.id}
              sv={s}
              action={<SaveButton sv={s} onSaved={onInspirationSaved} />}
            />
          ))}
        </div>
      )}
    </>
  );
}
