"use client";

import { useState } from "react";

export function TitleList({ titles }: { titles: string[] }) {
  const [copied, setCopied] = useState<number | null>(null);
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {titles.map((t, i) => (
        <button
          key={i}
          type="button"
          onClick={() => {
            navigator.clipboard
              ?.writeText(t)
              .then(() => {
                setCopied(i);
                setTimeout(() => setCopied(null), 1200);
              })
              .catch(() => {});
          }}
          className="rounded-lg border border-line bg-surface px-3 py-2 text-left text-sm transition-colors hover:border-brand/40"
        >
          <span className="mr-1 text-xs text-muted">{i + 1}.</span>
          {t}
          {copied === i && (
            <span className="ml-2 text-xs text-success">copié ✓</span>
          )}
        </button>
      ))}
    </div>
  );
}
