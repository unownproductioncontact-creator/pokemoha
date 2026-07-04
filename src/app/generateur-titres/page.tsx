"use client";

import { useEffect, useState } from "react";
import { generateTitles } from "@/lib/titleGen";
import { TitleList } from "@/components/TitleList";
import { PageHeader } from "@/components/ui";

export default function GenerateurTitresPage() {
  const [topic, setTopic] = useState("");
  const [titles, setTitles] = useState<string[]>([]);

  useEffect(() => {
    const i = new URLSearchParams(window.location.search).get("idee");
    if (i) {
      setTopic(i);
      setTitles(generateTitles(i, { n: 30 }));
    }
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const t = topic.trim();
    if (!t) return;
    setTitles(generateTitles(t, { n: 30 }));
  }

  return (
    <>
      <PageHeader
        title="Générateur de titres"
        subtitle="~30 titres FR à partir d'un sujet. Hors-ligne et gratuit. Clique sur un titre pour le copier."
      />
      <form onSubmit={submit} className="mb-4 flex gap-2">
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Sujet (ex : ouverture display Écarlate & Violet)"
          className="flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        />
        <button
          type="submit"
          className="rounded-lg bg-brand px-3 py-2 text-sm font-medium text-brand-ink hover:opacity-90"
        >
          Générer
        </button>
      </form>
      {titles.length > 0 ? (
        <TitleList titles={titles} />
      ) : (
        <p className="text-sm text-muted">
          Entre un sujet pour générer ~30 titres prêts à l&apos;emploi.
        </p>
      )}
    </>
  );
}
