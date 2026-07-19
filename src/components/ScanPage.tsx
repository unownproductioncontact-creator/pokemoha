"use client";

import { useEffect, useState } from "react";
import { useScan } from "@/components/dataHooks";
import { WorldRow } from "@/components/WorldRow";
import { PageHeader, Badge, EmptyState } from "@/components/ui";
import {
  CredentialsNotice,
  LoadingBlock,
  ErrorBlock,
  DemoBanner,
} from "@/components/StateBlock";

/** Page de scan (niche ou monde) : liste de WorldRow classés par score monde. */
export function ScanPage({
  kind,
  title,
  subtitle,
  note,
}: {
  kind: "niche" | "world";
  title: string;
  subtitle: string;
  note?: string;
}) {
  const [demo, setDemo] = useState(false);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("demo") === "1")
      setDemo(true);
  }, []);
  const { loading, data, reload } = useScan(kind, demo);

  const header = (
    <PageHeader
      title={title}
      subtitle={subtitle}
      actions={data?.demo ? <Badge tone="accent">Démo</Badge> : undefined}
    />
  );

  if (loading)
    return (
      <>
        {header}
        <LoadingBlock label="Scan en cours…" />
      </>
    );
  if (!data)
    return (
      <>
        {header}
        <ErrorBlock onRetry={reload} />
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
        <ErrorBlock message={data.message} onRetry={reload} />
      </>
    );

  return (
    <>
      {header}
      {data.demo && <DemoBanner />}
      {note && <p className="mb-4 text-xs text-muted">{note}</p>}
      <div className="mb-3 text-sm text-muted">
        {data.items.length} vidéo{data.items.length > 1 ? "s" : ""} classées par
        score monde
      </div>
      {data.items.length === 0 ? (
        <EmptyState title="Rien à afficher">
          Le scan n&apos;a rien retourné (quota épuisé ou niche vide).
        </EmptyState>
      ) : (
        <div className="space-y-2">
          {data.items.map((w) => (
            <WorldRow key={w.video.id} w={w} />
          ))}
        </div>
      )}
    </>
  );
}
