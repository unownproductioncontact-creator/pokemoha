"use client";

import { useEffect, useState } from "react";
import { useHistory } from "@/components/dataHooks";
import { PageHeader, Card, Badge, EmptyState } from "@/components/ui";
import { LoadingBlock, ErrorBlock } from "@/components/StateBlock";
import { ageLabel, DAY_MS } from "@/lib/dateRange";

export default function HistoriquePage() {
  const { loading, data } = useHistory();
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
  }, []);

  const header = (
    <PageHeader
      title="Historique"
      subtitle="Toutes tes analyses en cache local (.cache/) — 100% sur ta machine."
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

  const entries = data.entries;
  return (
    <>
      {header}
      {entries.length === 0 ? (
        <EmptyState title="Aucune analyse en cache">
          Lance une analyse (Outliers, Concurrents, Idées…) pour remplir
          l&apos;historique.
        </EmptyState>
      ) : (
        <div className="space-y-2">
          {entries.map((e) => (
            <Card
              key={e.key}
              className="flex items-center gap-3 p-3"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate font-mono text-xs">{e.key}</div>
                <div className="mt-0.5 text-xs text-muted">
                  {now != null
                    ? `il y a ${ageLabel((now - e.savedAt) / DAY_MS)}`
                    : ""}{" "}
                  · TTL {Math.round(e.ttlMs / 3_600_000)} h ·{" "}
                  {(e.sizeBytes / 1024).toFixed(1)} Ko
                </div>
              </div>
              <Badge tone={e.fresh ? "success" : "muted"}>
                {e.fresh ? "frais" : "périmé"}
              </Badge>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
