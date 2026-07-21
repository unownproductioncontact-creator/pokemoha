"use client";

import { useEffect, useState } from "react";
import {
  useCompetitors,
  useInspirations,
  postCompetitor,
  deleteInspiration,
} from "@/components/dataHooks";
import { CompetitorDetail } from "@/components/CompetitorDetail";
import { ScoreBars } from "@/components/ScoreBars";
import { UndoToast } from "@/components/UndoToast";
import { PageHeader, Card, Badge, DataBadge, EmptyState } from "@/components/ui";
import {
  CredentialsNotice,
  LoadingBlock,
  DemoBanner,
} from "@/components/StateBlock";
import { ICONS } from "@/components/icons";
import { formatCompact, formatRatio } from "@/lib/format";
import type { CompetitorAnalysis, ChannelSnapshot } from "@/lib/types";

const SUBTITLE =
  "Suivi par URL/@handle/nom, scores Menace & Inspiration estimés, inspirations sauvegardées.";

function CompetitorCard({
  c,
  demo,
  onOpen,
  onDelete,
}: {
  c: CompetitorAnalysis;
  demo: boolean;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const Trash = ICONS.trash;
  const top =
    (c.scored ?? [])
      .filter((s) => s.flag === "outlier" || s.flag === "emerging")
      .sort((a, b) => b.ratio - a.ratio)[0] ?? null;
  return (
    <Card className="flex flex-col p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate font-medium">{c.label}</div>
          {c.channel?.subscribers != null && (
            <div className="text-xs text-muted">
              {formatCompact(c.channel.subscribers)} abonnés
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onDelete}
          disabled={demo}
          aria-label="Supprimer le concurrent"
          className="rounded-md p-1.5 text-muted hover:bg-elevated hover:text-danger disabled:opacity-40"
        >
          <Trash className="h-4 w-4" />
        </button>
      </div>

      {c.status !== "ok" || !c.scores ? (
        <p className="mt-3 text-xs text-muted">
          {c.message ?? "Analyse indisponible."}
        </p>
      ) : (
        <>
          <div className="mt-3">
            <div className="mb-1 flex justify-end">
              <DataBadge status="estimated" />
            </div>
            <ScoreBars
              menace={c.scores.menace}
              inspiration={c.scores.inspiration}
            />
          </div>
          {top && (
            <p className="mt-3 line-clamp-1 text-xs text-muted">
              🔥 Top : {top.video.title} ({formatRatio(top.ratio)})
            </p>
          )}
          <button
            type="button"
            onClick={onOpen}
            className="mt-3 self-start text-sm font-medium text-brand hover:underline"
          >
            🔥 Outliers de la chaîne →
          </button>
        </>
      )}
    </Card>
  );
}

export default function ConcurrentsPage() {
  const [demo, setDemo] = useState(false);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("demo") === "1")
      setDemo(true);
  }, []);

  const { loading, data, reload } = useCompetitors(demo);
  const insp = useInspirations();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addRef, setAddRef] = useState("");
  const [adding, setAdding] = useState(false);
  const [pending, setPending] = useState<{ id: string; label: string } | null>(
    null,
  );
  const [discover, setDiscover] = useState<{
    loading: boolean;
    channels?: ChannelSnapshot[];
  } | null>(null);

  if (selectedId) {
    return (
      <>
        <PageHeader
          title="Concurrent"
          subtitle="Détail filtrable + outliers de la chaîne."
          actions={demo ? <Badge tone="accent">Démo</Badge> : undefined}
        />
        <CompetitorDetail
          id={selectedId}
          demo={demo}
          onBack={() => setSelectedId(null)}
          onInspirationSaved={insp.reload}
        />
      </>
    );
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!addRef.trim() || demo) return;
    setAdding(true);
    // try/finally : en cas d'échec serveur, reload() reflète l'état RÉEL (le
    // concurrent n'a pas été ajouté) plutôt qu'un faux succès (§0).
    try {
      await postCompetitor("add", { ref: addRef.trim() });
      setAddRef("");
    } catch {
      /* l'échec se voit dans la liste rechargée ci-dessous */
    } finally {
      setAdding(false);
      reload();
    }
  }

  async function confirmDelete() {
    if (!pending) return;
    const id = pending.id;
    setPending(null);
    try {
      await postCompetitor("remove", { id });
    } catch {
      /* idem : reload() ré-affiche le concurrent s'il n'a pas été retiré */
    }
    reload();
  }

  async function runDiscover() {
    setDiscover({ loading: true });
    const r = await fetch(
      "/api/competitors/discover" + (demo ? "?demo=1" : ""),
    );
    const d = await r.json();
    setDiscover({ loading: false, channels: d.channels ?? [] });
  }

  const competitors = data?.competitors ?? [];
  const shown = competitors.filter((c) => c.id !== pending?.id);

  return (
    <>
      <PageHeader
        title="Concurrents"
        subtitle={SUBTITLE}
        actions={demo ? <Badge tone="accent">Démo</Badge> : undefined}
      />
      {demo && <DemoBanner />}

      <form onSubmit={add} className="mb-1 flex gap-2">
        <input
          value={addRef}
          onChange={(e) => setAddRef(e.target.value)}
          placeholder="@handle, URL ou nom de chaîne"
          disabled={demo}
          className="flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={demo || adding || !addRef.trim()}
          className="rounded-lg bg-brand px-3 py-2 text-sm font-medium text-brand-ink hover:opacity-90 disabled:opacity-40"
        >
          Ajouter
        </button>
      </form>
      {demo && (
        <p className="mb-4 text-xs text-muted">
          Ajout / suppression désactivés en mode démo.
        </p>
      )}
      <div className="mb-4" />

      {loading ? (
        <LoadingBlock />
      ) : !data?.hasCredentials && !demo ? (
        <CredentialsNotice
          message="Ajoute YOUTUBE_API_KEY pour analyser tes concurrents."
         
        />
      ) : (
        <>
          {shown.length === 0 ? (
            <EmptyState title="Aucun concurrent suivi">
              Ajoute une chaîne ci-dessus ou lance la découverte.
            </EmptyState>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {shown.map((c) => (
                <CompetitorCard
                  key={c.id}
                  c={c}
                  demo={demo}
                  onOpen={() => setSelectedId(c.id)}
                  onDelete={() => setPending({ id: c.id, label: c.label })}
                />
              ))}
            </div>
          )}

          {/* Découverte */}
          <section className="mt-8">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-semibold">Découvrir des chaînes similaires</h2>
              <button
                type="button"
                onClick={runDiscover}
                className="text-sm font-medium text-brand hover:underline"
              >
                Lancer la découverte
              </button>
            </div>
            {discover?.loading && <LoadingBlock label="Recherche…" />}
            {discover && !discover.loading && (
              <>
                {discover.channels && discover.channels.length > 0 ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {discover.channels.map((ch) => (
                      <Card
                        key={ch.channelId}
                        className="flex items-center justify-between gap-2 p-3"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">
                            {ch.title}
                          </div>
                          {ch.subscribers != null && (
                            <div className="text-xs text-muted">
                              {formatCompact(ch.subscribers)} abonnés
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          disabled={demo}
                          onClick={async () => {
                            try {
                              await postCompetitor("add", { ref: ch.title });
                            } finally {
                              reload();
                            }
                          }}
                          className="rounded-md border border-line px-2 py-1 text-xs hover:bg-elevated disabled:opacity-50"
                        >
                          Ajouter
                        </button>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted">
                    Aucune suggestion (ou quota épuisé).
                  </p>
                )}
              </>
            )}
          </section>

          {/* Inspirations sauvegardées */}
          {insp.items.length > 0 && (
            <section className="mt-8">
              <h2 className="mb-2 font-semibold">
                💡 Inspirations sauvegardées
              </h2>
              <div className="space-y-2">
                {insp.items.map((it) => (
                  <Card
                    key={it.id}
                    className="flex items-center gap-3 p-3"
                  >
                    <a
                      href={it.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="line-clamp-1 min-w-0 flex-1 text-sm hover:text-brand"
                    >
                      {it.title}
                    </a>
                    {it.ratio != null && (
                      <Badge tone="success">{formatRatio(it.ratio)}</Badge>
                    )}
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await deleteInspiration(it.id);
                        } finally {
                          insp.reload();
                        }
                      }}
                      className="text-xs text-muted hover:text-danger"
                    >
                      Retirer
                    </button>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {pending && (
        <UndoToast
          key={pending.id}
          label={pending.label}
          onUndo={() => setPending(null)}
          onExpire={confirmDelete}
        />
      )}
    </>
  );
}
