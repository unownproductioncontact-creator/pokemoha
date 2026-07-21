"use client";

import { useEffect, useState } from "react";
import { useSearch } from "@/components/dataHooks";
import { WorldRow } from "@/components/WorldRow";
import { PageHeader, Badge, EmptyState } from "@/components/ui";
import {
  CredentialsNotice,
  LoadingBlock,
  ErrorBlock,
  DemoBanner,
} from "@/components/StateBlock";

const SUBTITLE =
  "Recherche libre dans YouTube, scorée comme un analyste (anomalie, vélocité, mécanique).";

export default function RecherchePage() {
  const [demo, setDemo] = useState(false);
  const [q, setQ] = useState("");
  const search = useSearch();

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("demo") === "1") {
      setDemo(true);
      search.run("pokémon", true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    search.run(q, demo);
  }

  const data = search.data;
  return (
    <>
      <PageHeader
        title="Recherche approfondie"
        subtitle={SUBTITLE}
        actions={demo ? <Badge tone="accent">Démo</Badge> : undefined}
      />
      {demo && <DemoBanner />}
      <form onSubmit={submit} className="mb-4 flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Mots-clés (ex : ouverture display, graal, vintage…)"
          className="flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        />
        <button
          type="submit"
          className="rounded-lg bg-brand px-3 py-2 text-sm font-medium text-brand-ink hover:opacity-90"
        >
          Rechercher
        </button>
      </form>

      {search.loading ? (
        <LoadingBlock label="Recherche…" />
      ) : !data ? (
        <p className="text-sm text-muted">
          Lance une recherche pour voir des résultats classés.
        </p>
      ) : data.status === "no-credentials" ? (
        <CredentialsNotice message={data.message} />
      ) : data.status === "error" ? (
        <ErrorBlock
          message={data.message}
          onRetry={() => search.run(q || "pokémon", demo)}
        />
      ) : data.items.length === 0 ? (
        <EmptyState title="Aucun résultat">Essaie d&apos;autres mots-clés.</EmptyState>
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
