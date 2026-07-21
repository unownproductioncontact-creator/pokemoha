"use client";

import { useDiagnostic } from "@/components/dataHooks";
import { PageHeader, Card, Badge } from "@/components/ui";
import { LoadingBlock, ErrorBlock } from "@/components/StateBlock";

function StatusRow({
  label,
  ok,
  okText = "présent",
  noText = "absent",
}: {
  label: string;
  ok: boolean;
  okText?: string;
  noText?: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-line py-2 last:border-0">
      <span className="text-sm">{label}</span>
      <Badge tone={ok ? "success" : "muted"}>{ok ? okText : noText}</Badge>
    </div>
  );
}

export default function DiagnosticPage() {
  const { loading, data, reload } = useDiagnostic();

  const header = (
    <PageHeader
      title="Diagnostic"
      subtitle="État des clés, des connexions, du quota estimé et du cache local."
      actions={
        <button
          type="button"
          onClick={reload}
          className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium hover:bg-elevated"
        >
          Rafraîchir
        </button>
      }
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

  return (
    <>
      {header}
      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-1 font-semibold">Clés & APIs</h2>
          <StatusRow label="YOUTUBE_API_KEY (Data v3)" ok={data.env.youtubeApiKey} />
          <StatusRow label="OAuth (Analytics / Reporting)" ok={data.env.oauth} okText="configuré" noText="non configuré" />
          <StatusRow label="ANTHROPIC_API_KEY" ok={data.env.anthropic} />
          <StatusRow
            label="Mode IA des idées"
            ok={data.env.llmIdeas}
            okText="actif"
            noText="local (gratuit)"
          />
          <div className="mt-2 text-xs text-muted">
            Modèle d&apos;idées : <span className="font-mono">{data.env.ideasModel}</span>
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="mb-1 font-semibold">État</h2>
          <div className="flex items-center justify-between border-b border-line py-2">
            <span className="text-sm">Chaînes connectées (OAuth)</span>
            <Badge tone={data.connectedChannels.length ? "success" : "muted"}>
              {data.connectedChannels.length}
            </Badge>
          </div>
          {data.connectedChannels.length > 0 && (
            <ul className="border-b border-line py-2 text-xs text-muted">
              {data.connectedChannels.map((c) => (
                <li key={c.channelId}>• {c.title}</li>
              ))}
            </ul>
          )}
          <div className="flex items-center justify-between border-b border-line py-2">
            <span className="text-sm">Quota estimé (session)</span>
            <span className="text-sm tabular-nums">{data.estimatedQuota} u</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm">Cache local</span>
            <span className="text-sm tabular-nums">
              {data.freshCacheEntries}/{data.cacheEntries} frais
            </span>
          </div>
        </Card>
      </div>
      <p className="mt-3 text-xs text-muted">
        Le quota est une estimation locale des unités consommées depuis le
        démarrage du serveur (le vrai compteur est côté Google, ~10 000 u/jour).
      </p>
    </>
  );
}
