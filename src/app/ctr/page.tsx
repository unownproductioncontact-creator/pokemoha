"use client";

import { useEffect, useState } from "react";
import { useCtr } from "@/components/dataHooks";
import { PageHeader, Card, Badge, DataBadge } from "@/components/ui";
import {
  CredentialsNotice,
  LoadingBlock,
  ErrorBlock,
  DemoBanner,
} from "@/components/StateBlock";
import { formatCompact, formatPercent } from "@/lib/format";
import type { LabeledMetric } from "@/lib/types";

const SUBTITLE =
  "CTR & rétention RÉELS de tes chaînes (OAuth). Métriques d'une chaîne tierce = privées, donc indisponibles.";

function Metric({ label, m }: { label: string; m?: LabeledMetric }) {
  const val = m?.value;
  const display =
    m?.unit === "%" && val != null
      ? formatPercent(val, 1)
      : val != null
        ? formatCompact(val)
        : "—";
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">
          {label}
        </span>
        <DataBadge status={m?.status ?? "unavailable"} />
      </div>
      <div className="mt-2 text-2xl font-semibold tabular-nums">
        {display}
        {m?.unit && m.unit !== "%" && val != null ? (
          <span className="ml-1 text-sm text-muted">{m.unit}</span>
        ) : null}
      </div>
      {m?.source && <div className="mt-1 text-xs text-muted">{m.source}</div>}
      {m?.note && <div className="mt-1.5 text-xs text-muted">{m.note}</div>}
    </Card>
  );
}

export default function CtrPage() {
  const [demo, setDemo] = useState(false);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("demo") === "1")
      setDemo(true);
  }, []);
  const { loading, data } = useCtr(demo);

  const header = (
    <PageHeader
      title="CTR"
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
      <div className="grid grid-cols-2 gap-3">
        <Metric label="CTR (impressions → clics)" m={data.ctr} />
        <Metric label="Rétention moyenne" m={data.retention} />
        <Metric label="Watch time (28 j)" m={data.watchTimeMin} />
        <Metric label="Vues (28 j)" m={data.views28} />
      </div>
      <Card className="mt-4 p-4 text-sm text-muted">
        <strong className="text-ink">Concurrents :</strong> le CTR et la
        rétention d&apos;une chaîne tierce sont privés →{" "}
        <Badge tone="muted">indisponible</Badge>. Aucune valeur n&apos;est
        inventée ni estimée à leur place (§0).
      </Card>
    </>
  );
}
