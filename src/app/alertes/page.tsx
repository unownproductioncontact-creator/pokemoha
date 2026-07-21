"use client";

import { useEffect, useState } from "react";
import { useAlerts } from "@/components/dataHooks";
import { PageHeader, Badge, EmptyState, SEVERITY_META } from "@/components/ui";
import {
  CredentialsNotice,
  LoadingBlock,
  ErrorBlock,
  DemoBanner,
} from "@/components/StateBlock";
import type { Alert } from "@/lib/alertsCore";

// Bordure gauche colorée par sévérité (ton + libellé viennent de SEVERITY_META).
const SEV_BORDER: Record<Alert["severity"], string> = {
  high: "var(--danger)",
  medium: "var(--warning)",
  low: "var(--muted)",
};

const SUBTITLE =
  "Feed actionnable : démarrages forts, outliers, sous-performances et concepts de concurrents à surveiller.";

export default function AlertesPage() {
  const [demo, setDemo] = useState(false);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("demo") === "1")
      setDemo(true);
  }, []);
  const { loading, data, reload } = useAlerts(demo);

  const header = (
    <PageHeader
      title="Alertes"
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
      <div className="mb-3 text-sm text-muted">
        {data.alerts.length} alerte{data.alerts.length > 1 ? "s" : ""}
      </div>
      {data.alerts.length === 0 ? (
        <EmptyState title="Tout est calme">
          Aucune alerte pour l&apos;instant — reviens après ta prochaine sortie.
        </EmptyState>
      ) : (
        <div className="space-y-2">
          {data.alerts.map((a) => (
            <div
              key={a.id}
              className="rounded-xl border border-l-[3px] border-line bg-surface p-3"
              style={{ borderLeftColor: SEV_BORDER[a.severity] }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="text-sm font-medium">{a.title}</div>
                <Badge tone={SEVERITY_META[a.severity].tone}>
                  {SEVERITY_META[a.severity].label}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted">{a.detail}</p>
              {a.href && (
                <a
                  href={a.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-xs font-medium text-brand hover:underline"
                >
                  Voir la vidéo →
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
