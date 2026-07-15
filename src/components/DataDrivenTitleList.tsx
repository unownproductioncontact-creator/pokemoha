"use client";

import { useState } from "react";
import type { DataDrivenTitle } from "@/lib/titlePatterns";
import { Badge } from "./ui";

/** Liste de titres data-driven : chaque item montre sa PREUVE (ratio) + sa
 *  provenance (ma chaîne / concurrent) + le vrai titre d'origine (§0). Copie au clic. */
export function DataDrivenTitleList({ items }: { items: DataDrivenTitle[] }) {
  const [copied, setCopied] = useState<number | null>(null);
  return (
    <div className="grid gap-2">
      {items.map((it, i) => (
        <button
          key={i}
          type="button"
          onClick={() => {
            navigator.clipboard
              ?.writeText(it.title)
              .then(() => {
                setCopied(i);
                setTimeout(() => setCopied(null), 1200);
              })
              .catch(() => {});
          }}
          className="rounded-lg border border-line bg-surface px-3 py-2 text-left transition-colors hover:border-brand/40"
        >
          <div className="flex items-start justify-between gap-2">
            <span className="text-sm">{it.title}</span>
            <span
              className="shrink-0 text-xs font-semibold text-brand tabular-nums"
              title="Vues vs médiane du même format sur la chaîne d'origine"
            >
              ×{it.strength.toFixed(1)}
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-muted">
            <Badge tone={it.source === "mine" ? "accent" : "muted"}>
              {it.sourceLabel}
            </Badge>
            <span>{it.isShort ? "Short" : "Long"}</span>
            <span className="min-w-0 truncate">· d&apos;après « {it.original} »</span>
            {copied === i && <span className="text-success">copié ✓</span>}
          </div>
        </button>
      ))}
    </div>
  );
}
