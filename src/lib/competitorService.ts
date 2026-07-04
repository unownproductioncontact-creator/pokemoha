// Service serveur : analyse des concurrents (§5). Public via clé API (les
// métriques propriétaire — CTR/rétention — restent indisponibles/estimées).

import {
  listCompetitors,
  getCompetitor,
} from "./competitorStore";
import { getChannelWithVideos, searchChannels } from "./youtube";
import { analyzeChannel } from "./outlierCore";
import { scoreCompetitor } from "./competitorScore";
import { hasYouTubeKey } from "./env";
import { withCache, TTL } from "./cache";
import { DISCOVERY_QUERIES } from "@/config/competitors";
import type {
  ChannelSnapshot,
  CompetitorAnalysis,
  CompetitorsResult,
  CompetitorOutlier,
} from "./types";

async function analyzeOne(c: {
  id: string;
  ref: string;
  label: string;
}): Promise<CompetitorAnalysis> {
  if (!hasYouTubeKey()) {
    return {
      id: c.id,
      ref: c.ref,
      label: c.label,
      status: "unconfigured",
      message: "Ajoute YOUTUBE_API_KEY pour analyser les concurrents.",
    };
  }
  try {
    const res = await getChannelWithVideos(c.ref, { max: 60 });
    if (!res) {
      return {
        id: c.id,
        ref: c.ref,
        label: c.label,
        status: "unconfigured",
        message: `Chaîne introuvable : ${c.ref}`,
      };
    }
    const now = Date.now();
    const { medians, scored } = analyzeChannel(res.videos, now);
    const scores = scoreCompetitor(scored, res.channel);
    return {
      id: c.id,
      ref: c.ref,
      label: res.channel.title || c.label,
      status: "ok",
      channel: res.channel,
      medians,
      scored,
      scores,
      fetchedAt: now,
    };
  } catch (e) {
    return {
      id: c.id,
      ref: c.ref,
      label: c.label,
      status: "error",
      message: e instanceof Error ? e.message : String(e),
    };
  }
}

export async function analyzeAllCompetitors(): Promise<CompetitorsResult> {
  const items = await listCompetitors();
  if (!hasYouTubeKey()) {
    return {
      hasCredentials: false,
      competitors: items.map((i) => ({
        id: i.id,
        ref: i.ref,
        label: i.label,
        status: "unconfigured" as const,
      })),
    };
  }
  const competitors = await Promise.all(items.map(analyzeOne));
  return { hasCredentials: true, competitors };
}

export async function analyzeCompetitorById(
  id: string,
): Promise<CompetitorAnalysis | null> {
  const c = await getCompetitor(id);
  if (!c) return null;
  return analyzeOne({ id: c.id, ref: c.ref, label: c.label });
}

/** Top N des outliers les plus RÉCENTS de TOUS les concurrents — 0 quota en
 *  plus (réutilise les analyses déjà calculées/cachées). §5. */
export function flattenCompetitorOutliers(
  result: CompetitorsResult,
  opts: { windowDays?: number; limit?: number } = {},
): CompetitorOutlier[] {
  const win = opts.windowDays ?? 0;
  const out: CompetitorOutlier[] = [];
  for (const c of result.competitors) {
    if (c.status !== "ok" || !c.scored) continue;
    for (const s of c.scored) {
      if (
        (s.flag === "outlier" || s.flag === "emerging") &&
        (win <= 0 || s.ageDays <= win)
      ) {
        out.push({ sv: s, competitorId: c.id, competitorLabel: c.label });
      }
    }
  }
  out.sort((a, b) => a.sv.ageDays - b.sv.ageDays); // les plus récents d'abord
  return out.slice(0, opts.limit ?? 50);
}

/** Découverte de chaînes similaires (§5) via les requêtes de la niche. Coûteux
 *  (search.list 100 u) → caché 24 h, limité à 2 requêtes. */
export async function discoverSimilar(): Promise<ChannelSnapshot[]> {
  if (!hasYouTubeKey()) return [];
  const tracked = new Set(
    (await listCompetitors()).flatMap((c) => [
      c.ref.toLowerCase(),
      c.label.toLowerCase(),
    ]),
  );
  const found = new Map<string, ChannelSnapshot>();
  for (const q of DISCOVERY_QUERIES.slice(0, 2)) {
    const chans = await withCache(`discover:v1:${q}`, TTL.niche, () =>
      searchChannels(q, 10),
    );
    for (const ch of chans) found.set(ch.channelId, ch);
  }
  return [...found.values()]
    .filter(
      (ch) =>
        !tracked.has(ch.title.toLowerCase()) &&
        !tracked.has((ch.handle ?? "").toLowerCase()),
    )
    .slice(0, 12);
}
