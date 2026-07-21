"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { segmentGroupFor } from "@/config/segments";
import { cn } from "@/lib/cn";

/** Barre de segments d'un hub (audit UX F001). Auto-détecte le groupe depuis la
 *  route courante ; ne rend rien hors d'un hub. Conserve le mode démo (F003). */
export function SegmentNav() {
  const pathname = usePathname();
  const [demo, setDemo] = useState(false);
  useEffect(() => {
    setDemo(new URLSearchParams(window.location.search).get("demo") === "1");
  }, [pathname]);

  const group = segmentGroupFor(pathname);
  if (!group) return null;

  return (
    <nav
      aria-label={group.title}
      className="mb-5 flex flex-wrap gap-x-1 gap-y-0 border-b border-line"
    >
      {group.segments.map((s) => {
        const active = pathname === s.href;
        return (
          <Link
            key={s.href}
            href={demo ? `${s.href}?demo=1` : s.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "border-brand text-brand"
                : "border-transparent text-muted hover:text-ink",
            )}
          >
            {s.label}
          </Link>
        );
      })}
    </nav>
  );
}
