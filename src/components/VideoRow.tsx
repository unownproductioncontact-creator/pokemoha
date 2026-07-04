"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import type { ScoredVideo } from "@/lib/types";
import { FlagBadge, ConfidenceBadge, RatioPill } from "@/components/outlierUi";
import { Card } from "@/components/ui";
import { formatCompact } from "@/lib/format";
import { ageLabel } from "@/lib/dateRange";

export function VideoRow({
  sv,
  action,
}: {
  sv: ScoredVideo;
  action?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const v = sv.video;
  const thumb =
    v.thumbnails?.medium ?? v.thumbnails?.high ?? v.thumbnails?.default;
  const watch = `https://www.youtube.com/watch?v=${v.id}`;

  return (
    <Card className="p-3">
      <div className="flex gap-3">
        <a
          href={watch}
          target="_blank"
          rel="noopener noreferrer"
          className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-lg bg-elevated sm:w-40"
        >
          {thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumb}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : null}
          <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1 text-[10px] font-medium text-white">
            {v.format === "short" ? "Short" : "Long"}
          </span>
        </a>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <a
              href={watch}
              target="_blank"
              rel="noopener noreferrer"
              className="line-clamp-2 text-sm font-medium hover:text-brand"
            >
              {v.title}
            </a>
            <RatioPill
              ratio={sv.ratio}
              flag={sv.flag}
              projected={sv.projectedRatio}
            />
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted">
            <span className="tabular-nums">{formatCompact(v.views)} vues</span>
            <span>·</span>
            <span>{ageLabel(sv.ageDays)}</span>
            <FlagBadge flag={sv.flag} />
            <ConfidenceBadge c={sv.confidence} />
            {action && <span className="ml-auto">{action}</span>}
          </div>

          {sv.reasons.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="mt-1.5 text-xs font-medium text-brand hover:underline"
              >
                {open ? "Masquer le pourquoi" : "Pourquoi ?"}
              </button>
              {open && (
                <ul className="mt-1.5 space-y-1 text-xs text-muted">
                  {sv.reasons.map((r, i) => (
                    <li key={i} className="flex gap-1.5">
                      <span className="text-brand">•</span>
                      {r}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
