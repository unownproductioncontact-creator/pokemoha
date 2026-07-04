"use client";

import { useState } from "react";
import { analyzeIdea } from "@/lib/ideaRanking";
import { generateTitles } from "@/lib/titleGen";
import { PageHeader, Card } from "@/components/ui";
import { TitleList } from "@/components/TitleList";

type Result = { a: ReturnType<typeof analyzeIdea>; titles: string[] };

export default function AnalyserIdeePage() {
  const [text, setText] = useState("");
  const [res, setRes] = useState<Result | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    setRes({ a: analyzeIdea(t), titles: generateTitles(t, { n: 30 }) });
  }

  return (
    <>
      <PageHeader
        title="Analyser une idée"
        subtitle="Idée brute → note/100 + escalade d'angle + ~30 titres. 100% hors-ligne et gratuit."
      />
      <form onSubmit={submit} className="mb-6">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="Ton idée brute (ex : j'ouvre un carton scellé Base Set pour trouver le Dracaufeu)"
          className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        />
        <button
          type="submit"
          className="mt-2 rounded-lg bg-brand px-3 py-2 text-sm font-medium text-brand-ink hover:opacity-90"
        >
          Analyser
        </button>
      </form>

      {res && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="flex flex-col justify-center p-4">
              <div className="text-xs uppercase tracking-wide text-muted">
                Note
              </div>
              <div className="text-3xl font-bold tabular-nums">
                {res.a.score}
                <span className="text-base text-muted">/100</span>
              </div>
            </Card>
            <Card className="p-4 sm:col-span-2">
              <ul className="space-y-1.5 text-sm">
                {res.a.breakdown.map((c, i) => (
                  <li key={i} className="flex gap-2">
                    <span className={c.ok ? "text-success" : "text-danger"}>
                      {c.ok ? "✓" : "✗"}
                    </span>
                    <span>
                      {c.label}
                      {!c.ok && c.tip && (
                        <span className="text-muted"> — {c.tip}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <h2 className="mb-2 mt-6 font-semibold">Escalade d&apos;angle</h2>
          <Card className="p-4">
            <ul className="space-y-1.5 text-sm text-muted">
              {res.a.angles.map((x, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-brand">→</span>
                  {x}
                </li>
              ))}
            </ul>
          </Card>

          <h2 className="mb-2 mt-6 font-semibold">~30 titres (clique pour copier)</h2>
          <TitleList titles={res.titles} />
        </>
      )}
    </>
  );
}
