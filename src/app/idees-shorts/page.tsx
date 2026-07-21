"use client";

import { useEffect, useMemo, useState } from "react";
import { useScan } from "@/components/dataHooks";
import { WorldRow } from "@/components/WorldRow";
import { PageHeader, Badge, EmptyState } from "@/components/ui";
import {
  CredentialsNotice,
  LoadingBlock,
  ErrorBlock,
  DemoBanner,
} from "@/components/StateBlock";
import type { WorldScored } from "@/lib/types";

export default function IdeesShortsPage() {
  const [demo, setDemo] = useState(false);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("demo") === "1")
      setDemo(true);
  }, []);
  const { loading, data, reload } = useScan("niche", demo);

  const groups = useMemo(() => {
    const shorts = (data?.items ?? []).filter(
      (w) => w.video.format === "short",
    );
    const map = new Map<string, WorldScored[]>();
    for (const w of shorts) {
      const k = w.mechanic?.label ?? "Autres formats";
      const arr = map.get(k) ?? [];
      arr.push(w);
      map.set(k, arr);
    }
    return [...map.entries()];
  }, [data]);

  const header = (
    <PageHeader
      title="Idées Virales Shorts"
      subtitle="Les Shorts qui marchent dans ta niche, classés par catégorie. Concept clair = importable en FR (à adapter, jamais copier)."
      actions={data?.demo ? <Badge tone="accent">Démo</Badge> : undefined}
    />
  );

  if (loading)
    return (
      <>
        {header}
        <LoadingBlock label="Scan des Shorts…" />
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
      {groups.length === 0 ? (
        <EmptyState title="Aucun Short détecté">
          Réessaie plus tard ou élargis ta niche.
        </EmptyState>
      ) : (
        groups.map(([cat, items]) => (
          <section key={cat} className="mb-6">
            <div className="mb-2 flex items-center gap-2">
              <h2 className="font-semibold">{cat}</h2>
              {cat !== "Autres formats" && (
                <Badge tone="success">importable en FR</Badge>
              )}
            </div>
            <div className="space-y-2">
              {items.map((w) => (
                <WorldRow key={w.video.id} w={w} />
              ))}
            </div>
          </section>
        ))
      )}
    </>
  );
}
