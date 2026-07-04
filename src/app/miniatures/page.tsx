"use client";

import { useEffect, useState } from "react";
import { PageHeader, Card, Badge, DataBadge } from "@/components/ui";
import { LoadingBlock, ErrorBlock, DemoBanner } from "@/components/StateBlock";
import type { ThumbResult } from "@/lib/types";

const SUBTITLE =
  "Analyse visuelle 100% locale & gratuite (jpeg-js) — aucune IA, aucune clé. Colle une URL ou un ID de vidéo.";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-elevated px-3 py-2">
      <div className="text-xs text-muted">{label}</div>
      <div className="text-base font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function AnalysisView({ data }: { data: ThumbResult }) {
  const a = data.analysis;
  if (!a) return null;
  const m = a.metrics;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Card className="p-3">
        {data.thumbUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.thumbUrl}
            alt=""
            className="aspect-video w-full rounded-lg object-cover"
          />
        ) : (
          <div className="grid aspect-video w-full place-items-center rounded-lg bg-elevated text-xs text-muted">
            aperçu démo (image synthétique)
          </div>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge tone={a.faceLikely ? "success" : "muted"}>
            {a.faceLikely ? "Visage probable" : "Pas de visage"}
          </Badge>
          <Badge tone={a.textHeavy ? "warning" : "muted"}>
            {a.textHeavy ? "Beaucoup de détails" : "Épuré"}
          </Badge>
        </div>
      </Card>
      <Card className="p-3">
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Luminosité" value={`${Math.round(m.brightness)}/255`} />
          <Stat label="Contraste" value={`${Math.round(m.contrast)}`} />
          <Stat label="Colorimétrie" value={`${Math.round(m.colorfulness)}`} />
          <Stat label="Saturation" value={`${Math.round(m.saturation * 100)}%`} />
        </div>
      </Card>
      <Card className="p-3 sm:col-span-2">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium">
          Recommandations <DataBadge status="estimated" />
        </div>
        <ul className="space-y-1.5 text-sm text-muted">
          {a.recommendations.map((r, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-brand">•</span>
              {r}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

export default function MiniaturesPage() {
  const [demo, setDemo] = useState(false);
  const [input, setInput] = useState("");
  const [state, setState] = useState<{
    loading: boolean;
    data?: ThumbResult;
    error?: string;
  }>({ loading: false });

  async function run(q: string, isDemo: boolean) {
    setState({ loading: true });
    const p = new URLSearchParams();
    if (isDemo) p.set("demo", "1");
    else p.set("url", q);
    try {
      const r = await fetch("/api/thumbnail?" + p.toString());
      const d = (await r.json()) as ThumbResult;
      setState({ loading: false, data: d });
    } catch (e) {
      setState({ loading: false, error: String(e) });
    }
  }

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("demo") === "1") {
      setDemo(true);
      run("", true);
      return;
    }
    const url = sp.get("url");
    if (url) {
      setInput(url);
      run(url, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (input.trim()) run(input.trim(), false);
  }

  return (
    <>
      <PageHeader
        title="Miniatures"
        subtitle={SUBTITLE}
        actions={demo ? <Badge tone="accent">Démo</Badge> : undefined}
      />
      {demo && <DemoBanner />}
      <form onSubmit={submit} className="mb-4 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="URL YouTube ou ID de vidéo"
          className="flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        />
        <button
          type="submit"
          className="rounded-lg bg-brand px-3 py-2 text-sm font-medium text-brand-ink hover:opacity-90"
        >
          Analyser
        </button>
      </form>
      {state.loading ? (
        <LoadingBlock label="Analyse locale…" />
      ) : state.error ? (
        <ErrorBlock message={state.error} />
      ) : state.data ? (
        state.data.status === "error" ? (
          <ErrorBlock message={state.data.message} />
        ) : (
          <AnalysisView data={state.data} />
        )
      ) : (
        <p className="text-sm text-muted">
          Colle une miniature à analyser (une de tes vidéos ou d&apos;un
          concurrent).
        </p>
      )}
    </>
  );
}
