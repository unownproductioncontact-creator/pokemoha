"use client";

import { useEffect, useState } from "react";
import { useDiagnostic } from "@/components/dataHooks";
import { PageHeader, Card, Badge } from "@/components/ui";
import { LoadingBlock } from "@/components/StateBlock";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NICHES } from "@/config/niches";
import { COMPETITORS } from "@/config/competitors";

export default function ParametresPage() {
  const { loading, data } = useDiagnostic();
  const [oauth, setOauth] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const o = sp.get("oauth");
    if (o === "ok")
      setOauth({ ok: true, text: `Chaîne connectée : ${sp.get("channel") ?? ""}` });
    else if (o === "error")
      setOauth({ ok: false, text: `Échec OAuth : ${sp.get("reason") ?? ""}` });
  }, []);

  return (
    <>
      <PageHeader
        title="Paramètres"
        subtitle="Connexions, clés, thème, niche et moteur d'idées. Tout est local et privé."
      />

      {oauth && (
        <div
          className={
            "mb-4 rounded-lg border px-3 py-2 text-sm " +
            (oauth.ok
              ? "border-success/30 bg-success/10 text-success"
              : "border-danger/30 bg-danger/10 text-danger")
          }
        >
          {oauth.text}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-2 font-semibold">Connexion</h2>
          <p className="text-sm text-muted">
            Connecte ta chaîne pour débloquer CTR & rétention réels (OAuth).
          </p>
          <a
            href="/api/oauth/start"
            className="mt-3 inline-block rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-brand-ink hover:opacity-90"
          >
            Connecter ma chaîne
          </a>
          {!loading && data && data.connectedChannels.length > 0 && (
            <ul className="mt-3 text-xs text-muted">
              {data.connectedChannels.map((c) => (
                <li key={c.channelId}>✓ {c.title}</li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-4">
          <h2 className="mb-2 font-semibold">Clés (.env.local)</h2>
          {loading || !data ? (
            <LoadingBlock />
          ) : (
            <ul className="space-y-1.5 text-sm">
              <li className="flex items-center justify-between">
                YOUTUBE_API_KEY
                <Badge tone={data.env.youtubeApiKey ? "success" : "muted"}>
                  {data.env.youtubeApiKey ? "présent" : "absent"}
                </Badge>
              </li>
              <li className="flex items-center justify-between">
                OAuth Google
                <Badge tone={data.env.oauth ? "success" : "muted"}>
                  {data.env.oauth ? "configuré" : "absent"}
                </Badge>
              </li>
              <li className="flex items-center justify-between">
                ANTHROPIC_API_KEY
                <Badge tone={data.env.anthropic ? "success" : "muted"}>
                  {data.env.anthropic ? "présent" : "absent"}
                </Badge>
              </li>
            </ul>
          )}
          <p className="mt-3 text-xs text-muted">
            Voir <span className="font-mono">.env.local.example</span> à la racine
            du projet.
          </p>
        </Card>

        <Card className="flex items-center justify-between p-4">
          <div>
            <h2 className="font-semibold">Thème</h2>
            <p className="text-sm text-muted">Clair / sombre (mémorisé localement).</p>
          </div>
          <ThemeToggle />
        </Card>

        <Card className="p-4">
          <h2 className="mb-2 font-semibold">Niche & concurrents</h2>
          <p className="text-sm">
            Niche : <strong>{NICHES[0]?.label}</strong> ({NICHES[0]?.queries.length}{" "}
            requêtes)
          </p>
          <p className="mt-1 text-sm">
            {COMPETITORS.length} concurrents seedés — modifiables dans l&apos;onglet
            Concurrents.
          </p>
          <p className="mt-2 text-xs text-muted">
            Édite <span className="font-mono">src/config/</span> pour personnaliser.
          </p>
        </Card>

        <Card className="p-4 sm:col-span-2">
          <h2 className="mb-1 font-semibold">Moteur d&apos;idées</h2>
          {!loading && data && (
            <p className="text-sm text-muted">
              Mode :{" "}
              <strong className="text-ink">
                {data.env.llmIdeas ? "IA (Claude)" : "Local — gratuit"}
              </strong>{" "}
              · modèle <span className="font-mono">{data.env.ideasModel}</span>.
              Active l&apos;IA avec <span className="font-mono">KIIBIKI_USE_LLM_IDEAS=1</span>{" "}
              + <span className="font-mono">ANTHROPIC_API_KEY</span>.
            </p>
          )}
        </Card>
      </div>
    </>
  );
}
