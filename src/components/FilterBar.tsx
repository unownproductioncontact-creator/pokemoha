"use client";

import type { DateWindowDays } from "@/lib/dateRange";
import { DATE_WINDOWS } from "@/lib/dateRange";
import { cn } from "@/lib/cn";

export type FormatFilter = "all" | "short" | "long";
export type SortKey = "ratio" | "views" | "recent";

const SELECT_CLASS =
  "rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40";

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: [T, string][];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-line bg-surface p-0.5">
      {options.map(([val, label]) => (
        <button
          key={val}
          type="button"
          onClick={() => onChange(val)}
          className={cn(
            "rounded-md px-2.5 py-1 text-sm transition-colors",
            value === val
              ? "bg-brand/10 font-medium text-brand"
              : "text-muted hover:text-ink",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function FilterBar({
  format,
  onFormat,
  window,
  onWindow,
  sort,
  onSort,
}: {
  format: FormatFilter;
  onFormat: (v: FormatFilter) => void;
  window: DateWindowDays;
  onWindow: (v: DateWindowDays) => void;
  sort: SortKey;
  onSort: (v: SortKey) => void;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <Segmented
        options={[
          ["all", "Tous"],
          ["long", "Longues"],
          ["short", "Shorts"],
        ]}
        value={format}
        onChange={onFormat}
      />
      <select
        value={window}
        onChange={(e) => onWindow(Number(e.target.value) as DateWindowDays)}
        className={SELECT_CLASS}
        aria-label="Fenêtre de dates"
      >
        {DATE_WINDOWS.map((w) => (
          <option key={w.value} value={w.value}>
            {w.label}
          </option>
        ))}
      </select>
      <select
        value={sort}
        onChange={(e) => onSort(e.target.value as SortKey)}
        className={SELECT_CLASS}
        aria-label="Tri"
      >
        <option value="ratio">Tri : ratio</option>
        <option value="views">Tri : vues</option>
        <option value="recent">Tri : récent</option>
      </select>
    </div>
  );
}
