"use client";

import { useEffect, useState } from "react";
import { useChannelAnalysis, useAlerts, useIdeas } from "@/components/dataHooks";
import {
  PageHeader,
  StatCard,
  Card,
  Badge,
  DataBadge,
  SEVERITY_META,
} from "@/components/ui";
import { BarsChart } from "@/components/Chart";
import { VideoRow } from "@/components/VideoRow";
import { IdeaCard } from "@/components/IdeaCard";
import {
  CredentialsNotice,
  LoadingBlock,
  ErrorBlock,
  DemoBanner,
} from "@/components/StateBlock";
import { formatCompact, formatInt } from "@/lib/format";

const SUBTITLE =
  "Ce qui mérite ton attention aujourd'hui — alertes, idées et repères, en un coup d'œil.";

/** Lien de section « voir tout », en conservant le mode démo (F003). */
function SeeAll({ href, demo, label }: { href: string; demo: boolean; label: string }) {
  return (
    <a
      href={demo ? `${href}?demo=1` : href}
      className="text-sm font-medium text-brand hover:underline"
    >
      {label} →
    </a>
  );
}

export default function AujourdhuiPage() {
  const [demo, setDemo] = useState(false);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("demo") === "1")
      setDemo(true);
  }, []);
  const { loading, data, reload } = useChannelAnalysis({ demo });
  // Secondaires : ne bloquent pas le rendu de l'accueil (SWR, partagés avec
  // les onglets Alertes / Idées du jour → souvent déjà en cache).
  const alerts = useAlerts(demo);
  const ideas = useIdeas(demo, true);

  if (loading)
    return (
      <>
        <PageHeader title="Aujourd'hui" subtitle={SUBTITLE} />
        <LoadingBlock />
      </>
    );
  if (!data)
    return (
      <>
        <PageHeader title="Aujourd'hui" subtitle={SUBTITLE} />
        <ErrorBlock onRetry={reload} />
      </>
    );
  if (data.status === "no-credentials" || data.status === "unconfigured")
    return (
      <>
        <PageHeader title="Aujourd'hui" subtitle={SUBTITLE} />
        <CredentialsNotice message={data.message} />
      </>
    );
  if (data.status === "error")
    return (
      <>
        <PageHeader title="Aujourd'hui" subtitle={SUBTITLE} />
        <ErrorBlock message={data.message} onRetry={reload} />
      </>
    );

  const scored = data.scored ?? [];
  const ch = data.channel!;
  const shorts = scored.filter((s) => s.video.format === "short");
  const longs = scored.filter((s) => s.video.format === "long");
  const outliers = scored.filter(
    (s) => s.flag === "outlier" || s.flag === "emerging",
  );
  const dominant: "short" | "long" =
    longs.length >= shorts.length ? "long" : "short";
  const domChart = scored
    .filter((s) => s.video.format === dominant)
    .sort((a, b) => a.ageDays - b.ageDays)
    .slice(0, 14)
    .reverse();
  const recent = [...scored].sort((a, b) => a.ageDays - b.ageDays).slice(0, 6);

  const topAlerts =
    alerts.data?.status === "ok" ? alerts.data.alerts.slice(0, 3) : [];
  const alertCount = alerts.data?.status === "ok" ? alerts.data.alerts.length : 0;
  const topIdeas =
    ideas.data?.status === "ok" ? ideas.data.ideas.slice(0, 3) : [];

  return (
    <>
      <PageHeader
        title="Aujourd'hui"
        subtitle={SUBTITLE}
        actions={
          data.demo ? (
            <Badge tone="accent">Démo</Badge>
          ) : (
            <Badge tone={data.source === "oauth" ? "success" : "info"}>
              {data.source === "oauth" ? "OAuth" : "Clé API"}
            </Badge>
          )
        }
      />
      {data.demo && <DemoBanner />}

      {/* 1 — « Dois-je agir ? » : les alertes en tête (F009). */}
      <section className="mb-5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold">
            À surveiller
            {alertCount > 0 && (
              <span className="rounded-full bg-danger/10 px-2 py-0.5 text-xs font-medium text-danger tabular-nums">
                {alertCount}
              </span>
            )}
          </h2>
          {alertCount > 0 && <SeeAll href="/alertes" demo={demo} label="Toutes les alertes" />}
        </div>
        {alerts.loading ? (
          <Card className="p-4 text-sm text-muted">Chargement des alertes…</Card>
        ) : topAlerts.length === 0 ? (
          <Card className="p-4 text-sm text-muted">
            Rien d&apos;urgent — aucune alerte à traiter aujourd&apos;hui. 🎉
          </Card>
        ) : (
          <div className="space-y-2">
            {topAlerts.map((a) => (
              <div
                key={a.id}
                className="flex items-start gap-3 rounded-xl border border-l-[3px] border-line bg-surface p-3"
                style={{ borderLeftColor: `var(--${SEVERITY_META[a.severity].tone})` }}
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{a.title}</div>
                  <div className="mt-0.5 text-xs text-muted">{a.detail}</div>
                </div>
                <Badge tone={SEVERITY_META[a.severity].tone}>
                  {SEVERITY_META[a.severity].label}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 2 — Repères chiffrés (toujours séparés Shorts / Longues, §0). */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Abonnés"
          value={ch.subscribers != null ? formatCompact(ch.subscribers) : "—"}
          status={ch.subscribers != null ? "real" : "unavailable"}
        />
        <StatCard
          label="Vues totales"
          value={ch.totalViews != null ? formatCompact(ch.totalViews) : "—"}
          status={ch.totalViews != null ? "real" : "unavailable"}
        />
        <StatCard
          label="Médiane Shorts"
          value={data.medians ? formatCompact(data.medians.short) : "—"}
          hint={`${shorts.length} Shorts`}
          status="real"
        />
        <StatCard
          label="Médiane Longues"
          value={data.medians ? formatCompact(data.medians.long) : "—"}
          hint={`${longs.length} vidéos longues`}
          status="real"
        />
      </div>

      {/* 3 — Idées du jour : aperçu (F009). */}
      <section className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold">Idées du jour</h2>
          <SeeAll href="/idees-jour" demo={demo} label="Plus d'idées" />
        </div>
        {ideas.loading ? (
          <Card className="p-4 text-sm text-muted">Synthèse des idées…</Card>
        ) : topIdeas.length === 0 ? (
          <Card className="p-4 text-sm text-muted">
            Pas encore d&apos;idées — suis des concurrents pour nourrir le moteur.
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            {topIdeas.map((i) => (
              <IdeaCard key={i.id} idea={i} demo={demo} />
            ))}
          </div>
        )}
      </section>

      {/* 4 — Performance récente + dernières vidéos. */}
      <Card className="mt-6 p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium">
            Performance des dernières{" "}
            {dominant === "long" ? "vidéos longues" : "Shorts"}
          </span>
          <DataBadge status="real" />
        </div>
        <BarsChart
          data={domChart.map((s) => ({ value: s.video.views, flag: s.flag }))}
          median={dominant === "long" ? data.medians?.long : data.medians?.short}
        />
        <p className="mt-2 text-xs text-muted">
          Barres = vues réelles. Ligne pointillée = médiane{" "}
          {dominant === "long" ? "longues" : "Shorts"}.
        </p>
      </Card>

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold">
            Dernières vidéos{" "}
            <span className="text-sm font-normal text-muted">
              · {outliers.length} outlier{outliers.length > 1 ? "s" : ""}
            </span>
          </h2>
          <SeeAll href="/outliers" demo={demo} label="Tous les outliers" />
        </div>
        <div className="space-y-2">
          {recent.map((s) => (
            <VideoRow key={s.video.id} sv={s} />
          ))}
        </div>
      </div>
    </>
  );
}
