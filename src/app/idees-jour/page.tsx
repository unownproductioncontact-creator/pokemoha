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
  "Ta sélection du jour : 6 idées prioritaires synthétisées depuis tes outliers. Rotation quotidienne déterministe.";

export default function IdeesJourPage() {
  const [demo, setDemo] = useState(false);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("demo") === "1")
      setDemo(true);
  }, []);
  const { loading, data } = useIdeas(demo, true);

  const header = (
    <PageHeader
      title="Idées du jour"
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
      {data.ideas.length === 0 ? (
        <EmptyState title="Pas d'idées pour aujourd'hui">
          Nourris le moteur avec des concurrents et ta chaîne.
        </EmptyState>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.ideas.map((i) => (
            <IdeaCard key={i.id} idea={i} />
          ))}
        </div>
      )}
    </>
  );
}
