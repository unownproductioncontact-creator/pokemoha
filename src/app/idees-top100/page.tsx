"use client";

import { useEffect, useMemo, useState } from "react";
import { useIdeas } from "@/components/dataHooks";
import { IdeaCard } from "@/components/IdeaCard";
import { PageHeader, Badge, EmptyState } from "@/components/ui";
import {
  CredentialsNotice,
  LoadingBlock,
  ErrorBlock,
  DemoBanner,
} from "@/components/StateBlock";

const SUBTITLE =
  "Moteur 100% local : idées synthétisées depuis tes outliers (toi, concurrents, niche), scorées qualité × opportunité, anti-déjà-vu.";

export default function IdeesTop100Page() {
  const [demo, setDemo] = useState(false);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("demo") === "1")
      setDemo(true);
  }, []);
  const { loading, data } = useIdeas(demo, false);
  // Filtre instantané côté client (audit UX G1-0) : retrouver « coffret » ou
  // « Dracaufeu » sans scanner 50 rangées. 0 quota.
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const ideas = data?.ideas ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return ideas;
    return ideas.filter((i) =>
      [i.title, i.angle, i.why, i.sourceLabel, ...(i.keywords ?? [])]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [data, query]);

  const header = (
    <PageHeader
      title="Idées · Top 100"
      subtitle={SUBTITLE}
      actions={data?.demo ? <Badge tone="accent">Démo</Badge> : undefined}
    />
  );

  if (loading)
    return (
      <>
        {header}
        <LoadingBlock label="Synthèse des idées…" />
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
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filtrer les idées… (ex : coffret, Dracaufeu)"
          aria-label="Filtrer les idées par mot-clé"
          className="w-full max-w-xs rounded-lg border border-line bg-surface px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        />
        <span className="text-sm text-muted">
          {filtered.length}/{data.ideas.length} idée
          {data.ideas.length > 1 ? "s" : ""}
          {data.usedLlm ? " · rédigées par IA" : " · moteur local gratuit"}
        </span>
      </div>
      {data.ideas.length === 0 ? (
        <EmptyState title="Pas encore d'idées">
          Suis des concurrents et ajoute ta chaîne pour nourrir le moteur.
        </EmptyState>
      ) : filtered.length === 0 ? (
        <EmptyState title="Aucune idée ne correspond">
          Essaie un autre mot-clé, ou vide le filtre.
        </EmptyState>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((i) => (
            <IdeaCard key={i.id} idea={i} demo={data.demo} />
          ))}
        </div>
      )}
    </>
  );
}
