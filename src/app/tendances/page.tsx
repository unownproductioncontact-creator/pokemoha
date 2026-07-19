"use client";

import { useEffect, useState } from "react";
import { useTrends } from "@/components/dataHooks";
import { PageHeader, Badge, Card, EmptyState } from "@/components/ui";
import {
  CredentialsNotice,
  LoadingBlock,
  ErrorBlock,
  DemoBanner,
} from "@/components/StateBlock";
import { formatCompact } from "@/lib/format";

const SUBTITLE = "Le « populaire maintenant » de YouTube (chart mostPopular).";

export default function TendancesPage() {
  const [demo, setDemo] = useState(false);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("demo") === "1")
      setDemo(true);
  }, []);
  const { loading, data } = useTrends(demo);

  const header = (
    <PageHeader
      title="Tendances"
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
  if (data.status === "no-credentials")
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

  return (
    <>
      {header}
      {data.demo && <DemoBanner />}
      <div className="mb-4 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
        ⚠️ <strong>mostPopular ne supporte pas de filtre par date</strong> :
        c&apos;est le populaire de l&apos;instant, pas une fenêtre temporelle.
      </div>
      {data.items.length === 0 ? (
        <EmptyState title="Aucune tendance">Réessaie plus tard.</EmptyState>
      ) : (
        <div className="space-y-2">
          {data.items.map((v, i) => {
            const thumb =
              v.thumbnails?.medium ?? v.thumbnails?.high ?? v.thumbnails?.default;
            const watch = `https://www.youtube.com/watch?v=${v.id}`;
            return (
              <Card key={v.id} className="flex items-center gap-3 p-3">
                <span className="w-6 shrink-0 text-center text-sm font-bold text-muted">
                  {i + 1}
                </span>
                <a
                  href={watch}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-md bg-elevated"
                >
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumb}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : null}
                </a>
                <div className="min-w-0 flex-1">
                  <a
                    href={watch}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="line-clamp-2 text-sm font-medium hover:text-brand"
                  >
                    {v.title}
                  </a>
                  <div className="truncate text-xs text-muted">
                    {v.channelTitle} · {formatCompact(v.views)} vues
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
