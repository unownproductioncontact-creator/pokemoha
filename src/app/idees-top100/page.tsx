"use client";

import { useEffect, useState } from "react";
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
        <CredentialsNotice message={data.message} onDemo={() => setDemo(true)} />
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
      <div className="mb-3 text-sm text-muted">
        {data.ideas.length} idées
        {data.usedLlm ? " · rédigées par IA" : " · moteur local gratuit"}
      </div>
      {data.ideas.length === 0 ? (
        <EmptyState title="Pas encore d'idées">
          Suis des concurrents et ajoute ta chaîne pour nourrir le moteur.
        </EmptyState>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {data.ideas.map((i) => (
            <IdeaCard key={i.id} idea={i} />
          ))}
        </div>
      )}
    </>
  );
}
