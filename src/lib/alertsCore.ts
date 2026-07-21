// Construction du feed d'alertes actionnables (§5). PUR & autonome → testable.

import type { ScoredVideo } from "./types";

export type AlertKind = "emerging" | "outlier" | "under" | "competitor" | "info";

export interface Alert {
  id: string;
  kind: AlertKind;
  severity: "high" | "medium" | "low";
  title: string;
  detail: string;
  href?: string;
  ageDays?: number;
  /** Sujet propre (titre de la vidéo) → alimente les CTA internes (F015). */
  subject?: string;
  /** Id vidéo → CTA « Analyser la miniature ». */
  videoId?: string;
}

const SEV_RANK: Record<Alert["severity"], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function r1(x: number): string {
  return (Math.round(x * 10) / 10).toString().replace(".", ",");
}
function watchUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`;
}

export function buildAlerts(input: {
  scored?: ScoredVideo[];
  competitorOutliers?: { sv: ScoredVideo; competitorLabel: string }[];
  nowMs: number;
}): Alert[] {
  const alerts: Alert[] = [];

  for (const s of input.scored ?? []) {
    if (s.flag === "emerging" && s.ageDays <= 21) {
      alerts.push({
        id: `em-${s.video.id}`,
        kind: "emerging",
        severity: "high",
        title: `🌱 Démarrage fort : ${s.video.title}`,
        detail: `Projeté à ${r1(s.projectedRatio)}× la médiane (actuel ${r1(s.ratio)}×, ${Math.round(s.ageDays)} j). Pousse-la (commentaire épinglé, Short teaser).`,
        href: watchUrl(s.video.id),
        ageDays: s.ageDays,
        subject: s.video.title,
        videoId: s.video.id,
      });
    } else if (s.flag === "outlier" && s.ratio >= 3 && s.ageDays <= 21) {
      alerts.push({
        id: `ol-${s.video.id}`,
        kind: "outlier",
        severity: "medium",
        title: `🔥 Outlier : ${s.video.title}`,
        detail: `${r1(s.ratio)}× ta médiane — rejoue cet angle / décline-le en Short.`,
        href: watchUrl(s.video.id),
        ageDays: s.ageDays,
        subject: s.video.title,
        videoId: s.video.id,
      });
    } else if (s.flag === "under" && s.ageDays <= 30) {
      alerts.push({
        id: `un-${s.video.id}`,
        kind: "under",
        severity: "low",
        title: `Sous-performance : ${s.video.title}`,
        detail: `${r1(s.ratio)}× ta médiane — analyse le hook (onglet Hooks) et la miniature.`,
        href: watchUrl(s.video.id),
        ageDays: s.ageDays,
        subject: s.video.title,
        videoId: s.video.id,
      });
    }
  }

  for (const o of input.competitorOutliers ?? []) {
    if (o.sv.ageDays <= 7) {
      alerts.push({
        id: `co-${o.sv.video.id}`,
        kind: "competitor",
        severity: "medium",
        title: `Concurrent ${o.competitorLabel} : ${o.sv.video.title}`,
        detail: `${r1(o.sv.ratio)}× sa médiane, il y a ${Math.round(o.sv.ageDays)} j — concept à surveiller / adapter en FR.`,
        href: watchUrl(o.sv.video.id),
        ageDays: o.sv.ageDays,
        subject: o.sv.video.title,
        videoId: o.sv.video.id,
      });
    }
  }

  // Dédup par id : deux outliers concurrents peuvent porter la même vidéo →
  // même id `co-<videoId>` → clés React dupliquées à l'affichage.
  const seen = new Set<string>();
  const deduped = alerts.filter((a) => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });

  deduped.sort(
    (a, b) =>
      SEV_RANK[a.severity] - SEV_RANK[b.severity] ||
      (a.ageDays ?? 999) - (b.ageDays ?? 999),
  );
  return deduped.slice(0, 40);
}
