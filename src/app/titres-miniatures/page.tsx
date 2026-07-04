"use client";

import { useState } from "react";
import { analyzeIdea } from "@/lib/ideaRanking";
import { PageHeader, Card, Badge } from "@/components/ui";
import { LoadingBlock } from "@/components/StateBlock";
import type { ThumbResult } from "@/lib/types";

const INPUT =
  "rounded-lg border border-line bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40";
const BTN =
  "rounded-lg bg-brand px-3 py-2 text-sm font-medium text-brand-ink hover:opacity-90";

function thumbScore(r?: ThumbResult): number {
  const a = r?.analysis;
  if (!a) return 0;
  return (
    (a.faceLikely ? 20 : 0) +
    Math.min(40, a.metrics.contrast / 2) +
    Math.min(40, a.metrics.colorfulness)
  );
}

function ThumbCol({
  label,
  r,
  winner,
}: {
  label: string;
  r?: ThumbResult;
  winner: boolean;
}) {
  const a = r?.analysis;
  return (
    <Card className="p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        {winner && <Badge tone="success">gagnant</Badge>}
      </div>
      {r?.thumbUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={r.thumbUrl}
          alt=""
          className="mt-2 aspect-video w-full rounded-lg object-cover"
        />
      )}
      {a ? (
        <ul className="mt-2 space-y-1 text-xs text-muted">
          <li>Luminosité {Math.round(a.metrics.brightness)}/255</li>
          <li>Contraste {Math.round(a.metrics.contrast)}</li>
          <li>Colorimétrie {Math.round(a.metrics.colorfulness)}</li>
          <li>{a.faceLikely ? "Visage probable" : "Pas de visage"}</li>
        </ul>
      ) : (
        <p className="mt-2 text-xs text-muted">Pas d&apos;analyse (URL invalide ?).</p>
      )}
    </Card>
  );
}

export default function TitresMiniaturesPage() {
  const [ta, setTa] = useState("");
  const [tb, setTb] = useState("");
  const [tRes, setTRes] = useState<{ a: number; b: number } | null>(null);

  const [ua, setUa] = useState("");
  const [ub, setUb] = useState("");
  const [tt, setTt] = useState<{
    a?: ThumbResult;
    b?: ThumbResult;
    loading: boolean;
    done: boolean;
  }>({ loading: false, done: false });

  function cmpTitles(e: React.FormEvent) {
    e.preventDefault();
    setTRes({ a: analyzeIdea(ta).score, b: analyzeIdea(tb).score });
  }

  async function fetchThumb(u: string): Promise<ThumbResult | undefined> {
    if (!u.trim()) return undefined;
    try {
      const r = await fetch("/api/thumbnail?url=" + encodeURIComponent(u.trim()));
      return (await r.json()) as ThumbResult;
    } catch {
      return undefined;
    }
  }
  async function cmpThumbs(e: React.FormEvent) {
    e.preventDefault();
    setTt({ loading: true, done: false });
    const [a, b] = await Promise.all([fetchThumb(ua), fetchThumb(ub)]);
    setTt({ a, b, loading: false, done: true });
  }

  const tWinner = tRes
    ? tRes.a === tRes.b
      ? null
      : tRes.a > tRes.b
        ? "A"
        : "B"
    : null;
  const sa = thumbScore(tt.a);
  const sb = thumbScore(tt.b);
  const thumbWinner =
    tt.done && (tt.a?.analysis || tt.b?.analysis)
      ? Math.round(sa) === Math.round(sb)
        ? null
        : sa > sb
          ? "A"
          : "B"
      : null;

  return (
    <>
      <PageHeader
        title="Titres & miniatures"
        subtitle="Compare deux titres (note hors-ligne) et deux miniatures (analyse locale gratuite)."
      />

      <h2 className="mb-2 font-semibold">A/B Titres</h2>
      <form onSubmit={cmpTitles} className="mb-3 grid gap-2 sm:grid-cols-2">
        <input
          value={ta}
          onChange={(e) => setTa(e.target.value)}
          placeholder="Titre A"
          className={INPUT}
        />
        <input
          value={tb}
          onChange={(e) => setTb(e.target.value)}
          placeholder="Titre B"
          className={INPUT}
        />
        <button type="submit" className={`${BTN} w-fit sm:col-span-2`}>
          Comparer les titres
        </button>
      </form>
      {tRes && (
        <div className="mb-8 grid gap-3 sm:grid-cols-2">
          <Card className="p-4">
            <div className="text-xs uppercase tracking-wide text-muted">
              Titre A
            </div>
            <div className="text-2xl font-bold tabular-nums">{tRes.a}/100</div>
            {tWinner === "A" && <Badge tone="success">gagnant</Badge>}
          </Card>
          <Card className="p-4">
            <div className="text-xs uppercase tracking-wide text-muted">
              Titre B
            </div>
            <div className="text-2xl font-bold tabular-nums">{tRes.b}/100</div>
            {tWinner === "B" && <Badge tone="success">gagnant</Badge>}
          </Card>
        </div>
      )}

      <h2 className="mb-2 font-semibold">A/B Miniatures</h2>
      <form onSubmit={cmpThumbs} className="mb-3 grid gap-2 sm:grid-cols-2">
        <input
          value={ua}
          onChange={(e) => setUa(e.target.value)}
          placeholder="URL ou ID vidéo A"
          className={INPUT}
        />
        <input
          value={ub}
          onChange={(e) => setUb(e.target.value)}
          placeholder="URL ou ID vidéo B"
          className={INPUT}
        />
        <button type="submit" className={`${BTN} w-fit sm:col-span-2`}>
          Comparer les miniatures
        </button>
      </form>
      {tt.loading ? (
        <LoadingBlock label="Analyse locale…" />
      ) : tt.done && (tt.a?.analysis || tt.b?.analysis) ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <ThumbCol label="Miniature A" r={tt.a} winner={thumbWinner === "A"} />
          <ThumbCol label="Miniature B" r={tt.b} winner={thumbWinner === "B"} />
        </div>
      ) : null}
    </>
  );
}
