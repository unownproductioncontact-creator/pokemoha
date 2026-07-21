"use client";

import { useEffect, useMemo, useState } from "react";
import { generateTitles } from "@/lib/titleGen";
import { buildDataDrivenTitles } from "@/lib/titlePatterns";
import { useTitlePatterns } from "@/components/dataHooks";
import { TitleList } from "@/components/TitleList";
import { DataDrivenTitleList } from "@/components/DataDrivenTitleList";
import { PageHeader, Card, Badge } from "@/components/ui";
import { LoadingBlock, ErrorBlock, DemoBanner } from "@/components/StateBlock";

export default function GenerateurTitresPage() {
  const [topic, setTopic] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [demo, setDemo] = useState(false);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("demo") === "1") setDemo(true);
    const i = sp.get("idee");
    if (i) {
      setTopic(i);
      setSubmitted(i);
    }
  }, []);

  const patterns = useTitlePatterns(demo);

  const offline = useMemo(
    () => (submitted ? generateTitles(submitted, { n: 30 }) : []),
    [submitted],
  );
  const dataDriven = useMemo(
    () =>
      submitted && patterns.data?.patterns
        ? buildDataDrivenTitles(submitted, patterns.data.patterns, { n: 18 })
        : [],
    [submitted, patterns.data],
  );

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const t = topic.trim();
    if (t) setSubmitted(t);
  }

  return (
    <>
      <PageHeader
        title="Générateur de titres"
        subtitle="Des titres FR à partir d'un sujet. Deux moteurs : appris de tes vidéos qui cartonnent, + modèles génériques hors-ligne."
        actions={patterns.data?.demo ? <Badge tone="accent">Démo</Badge> : undefined}
      />
      {patterns.data?.demo && <DemoBanner />}

      <form onSubmit={submit} className="mb-6 flex gap-2">
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Sujet court (ex : Prismatic Evolutions, Dracaufeu ex…)"
          className="flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        />
        <button
          type="submit"
          className="rounded-lg bg-brand px-3 py-2 text-sm font-medium text-brand-ink hover:opacity-90"
        >
          Générer
        </button>
      </form>

      {!submitted ? (
        <p className="text-sm text-muted">
          Entre un sujet pour générer des titres — dont ceux calqués sur tes
          formats qui font le plus de vues.
        </p>
      ) : (
        <div className="space-y-8">
          {/* Bloc 1 — data-driven : appris de vrais titres outliers */}
          <section>
            <h2 className="text-sm font-semibold text-ink">
              💡 Inspirés de tes titres qui cartonnent
            </h2>
            <p className="mb-3 mt-0.5 text-xs text-muted">
              Modèles appris de tes vidéos outliers + celles des concurrents. Le
              «&nbsp;×N&nbsp;» = vues réelles ÷ médiane du même format sur la
              chaîne d&apos;origine (la preuve, jamais inventée).
            </p>
            {patterns.loading ? (
              <LoadingBlock label="Analyse de tes titres gagnants…" />
            ) : patterns.data?.status === "no-credentials" ? (
              <Card className="p-4 text-sm text-muted">
                Connecte ta chaîne (onglet Paramètres) pour débloquer ce bloc.
                Le générateur générique ci-dessous marche déjà sans.
              </Card>
            ) : patterns.data?.status === "error" ? (
              <ErrorBlock message={patterns.data.message} onRetry={patterns.reload} />
            ) : dataDriven.length === 0 ? (
              <Card className="p-4 text-sm text-muted">
                Pas encore de modèle applicable à ce sujet — soit tes outliers
                sont trop peu nombreux, soit leurs titres n&apos;ont pas
                d&apos;ossature réutilisable. Le bloc générique reste dispo.
              </Card>
            ) : (
              <DataDrivenTitleList items={dataDriven} />
            )}
          </section>

          {/* Bloc 2 — générique hors-ligne (existant) */}
          <section>
            <h2 className="text-sm font-semibold text-ink">
              Modèles génériques (hors-ligne)
            </h2>
            <p className="mb-3 mt-0.5 text-xs text-muted">
              ~30 accroches éprouvées, sans donnée ni IA. Clique un titre pour le
              copier.
            </p>
            <TitleList titles={offline} />
          </section>
        </div>
      )}
    </>
  );
}
