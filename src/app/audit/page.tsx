"use client";

import { useEffect, useState } from "react";
import { useAudit } from "@/components/dataHooks";
import { PageHeader, Card, Badge, DataBadge, SEVERITY_META } from "@/components/ui";
import {
  CredentialsNotice,
  LoadingBlock,
  ErrorBlock,
  DemoBanner,
} from "@/components/StateBlock";
import { formatCompact, formatRatio } from "@/lib/format";
import type { AuditScore, AuditRec } from "@/lib/auditCore";

const SUBTITLE =
  "Diagnostic complet : scores, tranche de durée gagnante, meilleur jour, recommandations preuve + impact + action.";

function ScoreCard({ s }: { s: AuditScore }) {
  const color =
    s.status === "unavailable"
      ? "var(--muted)"
      : s.value >= 60
        ? "var(--success)"
        : s.value >= 35
          ? "var(--accent)"
          : "var(--danger)";
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">
          {s.label}
        </span>
        <DataBadge status={s.status} />
      </div>
      <div className="mt-2 text-2xl font-semibold tabular-nums">
        {s.status === "unavailable" ? "—" : s.value}
        <span className="text-sm text-muted">/100</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-elevated">
        <div
          className="h-full rounded-full"
          style={{
            width: `${s.status === "unavailable" ? 0 : Math.max(2, s.value)}%`,
            background: color,
          }}
        />
      </div>
      {s.note && <div className="mt-1.5 text-xs text-muted">{s.note}</div>}
    </Card>
  );
}

function RecCard({ rec }: { rec: AuditRec }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium">{rec.title}</h3>
        <Badge tone={SEVERITY_META[rec.severity].tone}>
          {SEVERITY_META[rec.severity].label}
        </Badge>
      </div>
      <dl className="mt-2 space-y-1 text-sm">
        <div className="flex gap-2">
          <dt className="shrink-0 font-medium text-muted">Preuve</dt>
          <dd>{rec.proof}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="shrink-0 font-medium text-muted">Impact</dt>
          <dd>{rec.impact}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="shrink-0 font-medium text-brand">Action</dt>
          <dd>{rec.action}</dd>
        </div>
      </dl>
    </Card>
  );
}

export default function AuditPage() {
  const [demo, setDemo] = useState(false);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("demo") === "1")
      setDemo(true);
  }, []);
  const { loading, data, reload } = useAudit(demo);

  const header = (
    <PageHeader
      title="Audit de chaîne"
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
  if (data.status === "no-credentials" || data.status === "unconfigured")
    return (
      <>
        {header}
        <CredentialsNotice message={data.message} />
      </>
    );
  if (data.status === "error" || !data.report)
    return (
      <>
        {header}
        <ErrorBlock message={data.message} onRetry={reload} />
      </>
    );

  const r = data.report;
  return (
    <>
      {header}
      {data.demo && <DemoBanner />}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {r.scores.map((s) => (
          <ScoreCard key={s.key} s={s} />
        ))}
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Card className="p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-muted">
            Tranche de durée gagnante
          </div>
          {r.bestDuration ? (
            <>
              <div className="mt-1 text-lg font-semibold">
                {r.bestDuration.label}
              </div>
              <div className="text-sm text-muted">
                {formatRatio(r.bestDuration.avgRatio)} la médiane ·{" "}
                {r.bestDuration.count} vidéos
              </div>
            </>
          ) : (
            <div className="mt-1 text-sm text-muted">
              Pas assez de données par tranche.
            </div>
          )}
        </Card>
        <Card className="p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-muted">
            Meilleur jour de publication
          </div>
          {r.bestDay ? (
            <>
              <div className="mt-1 text-lg font-semibold capitalize">
                {r.bestDay.day}
              </div>
              <div className="text-sm text-muted">
                {formatRatio(r.bestDay.avgRatio)} la médiane · {r.bestDay.count}{" "}
                vidéos
              </div>
            </>
          ) : (
            <div className="mt-1 text-sm text-muted">
              Pas assez de données par jour.
            </div>
          )}
        </Card>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Card className="p-4">
          <div className="text-sm font-medium">Audit Shorts</div>
          <div className="mt-1 text-sm text-muted">
            {r.shorts.count} Shorts · médiane {formatCompact(r.shorts.median)} ·{" "}
            {Math.round(r.shorts.outlierRate * 100)}% d&apos;outliers
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium">Vidéos longues</div>
          <div className="mt-1 text-sm text-muted">
            {r.longs.count} longues · médiane {formatCompact(r.longs.median)} ·{" "}
            {Math.round(r.longs.outlierRate * 100)}% d&apos;outliers
          </div>
        </Card>
      </div>

      <h2 className="mb-2 mt-6 font-semibold">Recommandations</h2>
      <div className="space-y-2">
        {r.recommendations.map((rec, i) => (
          <RecCard key={i} rec={rec} />
        ))}
      </div>

      <h2 className="mb-2 mt-6 font-semibold">Plan d&apos;action — 4 semaines</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {r.plan.map((w) => (
          <Card key={w.week} className="p-4">
            <Badge tone="brand">Semaine {w.week}</Badge>
            <div className="mt-2 text-sm font-medium">{w.focus}</div>
            <ul className="mt-2 space-y-1 text-xs text-muted">
              {w.tasks.map((t, i) => (
                <li key={i} className="flex gap-1.5">
                  <span className="text-brand">•</span>
                  {t}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </>
  );
}
