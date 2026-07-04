// Scores Menace & Inspiration d'un concurrent — ESTIMÉS (§5), jamais réels.
// PUR & autonome (imports de TYPES uniquement) → testable.
//
//  • Menace = à quel point ce concurrent est une menace concurrentielle
//    (cadence + taux d'outliers récents + audience + momentum).
//  • Inspiration = combien d'idées gagnantes réutilisables il offre
//    (force + volume de ses outliers, indépendamment de son audience).

import type { ScoredVideo, ChannelSnapshot } from "./types";

export interface CompetitorScores {
  menace: number; // 0-100 (ESTIMÉ)
  inspiration: number; // 0-100 (ESTIMÉ)
  reasons: string[];
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

const isHit = (s: ScoredVideo): boolean =>
  s.flag === "outlier" || s.flag === "emerging";

export function scoreCompetitor(
  scored: ScoredVideo[],
  channel: ChannelSnapshot | undefined,
  opts: { recentDays?: number } = {},
): CompetitorScores {
  const recentDays = opts.recentDays ?? 30;
  const recent = scored.filter((s) => s.ageDays <= recentDays);
  const recentHits = recent.filter(isHit);
  const allHits = scored.filter(isHit);
  const subs = channel?.subscribers ?? 0;

  // Menace
  const cadence = clamp01(recent.length / 12); // 12+ vidéos/mois = max
  const recentOutlierRate = recent.length
    ? recentHits.length / recent.length
    : 0;
  const audience = subs > 0 ? clamp01(Math.log10(subs) / 6) : 0; // 1 M abonnés = max
  const momentum = clamp01(recentHits.length / 5);
  const menace = Math.round(
    100 *
      (0.3 * cadence +
        0.25 * recentOutlierRate +
        0.25 * audience +
        0.2 * momentum),
  );

  // Inspiration
  const top = [...allHits].sort((a, b) => b.ratio - a.ratio).slice(0, 5);
  const avgTop = top.length
    ? top.reduce((s, v) => s + v.ratio, 0) / top.length
    : 0;
  const strength = clamp01((avgTop - 1) / 4); // ratio moyen 5× = max
  const volume = clamp01(allHits.length / 10);
  const inspiration = Math.round(100 * (0.6 * strength + 0.4 * volume));

  const reasons = [
    `Menace ${menace}/100 (estimé) : ~${recent.length} vidéo(s) sur ${recentDays} j, ${recentHits.length} outlier(s) récent(s)${subs ? `, ${subs} abonnés` : ""}.`,
    `Inspiration ${inspiration}/100 (estimé) : ${allHits.length} outlier(s), ratio top moyen ${avgTop ? avgTop.toFixed(1).replace(".", ",") : "—"}×.`,
  ];

  return { menace, inspiration, reasons };
}
