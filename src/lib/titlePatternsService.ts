// Service des modèles de titres (§6, extension data-driven). Serveur uniquement.
// Réutilise la plomberie du moteur d'idées : mes outliers + outliers concurrents.
// Chaque titre gagnant est transformé en modèle {X} (titlePatterns.inducePattern),
// avec son ratio comme preuve. Aucune invention (§0) : que du réel étiqueté.

import { analyzeMyChannel } from "./channelService";
import {
  analyzeAllCompetitors,
  flattenCompetitorOutliers,
} from "./competitorService";
import { withCache } from "./cache";
import { inducePattern } from "./titlePatterns";
import { hasYouTubeKey } from "./env";
import type { TitlePattern, TitlePatternsResult } from "./types";

const CACHE_TTL_MS = 30 * 60_000;
const MAX_PATTERNS = 40;

async function gatherPatterns(): Promise<TitlePattern[]> {
  const raw: TitlePattern[] = [];

  // Mes titres qui sur-performent (outliers + emerging).
  const mine = await analyzeMyChannel({});
  if (mine.status === "ok" && mine.scored) {
    for (const s of mine.scored) {
      if (s.flag !== "outlier" && s.flag !== "emerging") continue;
      const template = inducePattern(s.video.title);
      if (!template) continue;
      raw.push({
        template,
        source: "mine",
        sourceLabel: "Ta chaîne",
        strength: s.ratio,
        isShort: s.video.format === "short",
        original: s.video.title,
      });
    }
  }

  // Outliers des concurrents (best-effort : mes modèles suffisent si ça échoue).
  try {
    const comps = await analyzeAllCompetitors();
    for (const o of flattenCompetitorOutliers(comps, { limit: 80 })) {
      const template = inducePattern(o.sv.video.title);
      if (!template) continue;
      raw.push({
        template,
        source: "competitor",
        sourceLabel: o.competitorLabel,
        strength: o.sv.ratio,
        isShort: o.sv.video.format === "short",
        original: o.sv.video.title,
      });
    }
  } catch {
    /* best-effort */
  }

  // Dédup par modèle (garde la preuve la plus forte), tri par ratio décroissant.
  const byTemplate = new Map<string, TitlePattern>();
  for (const p of raw) {
    const prev = byTemplate.get(p.template);
    if (!prev || p.strength > prev.strength) byTemplate.set(p.template, p);
  }
  return [...byTemplate.values()]
    .sort((a, b) => b.strength - a.strength)
    .slice(0, MAX_PATTERNS);
}

export async function getTitlePatterns(): Promise<TitlePatternsResult> {
  if (!hasYouTubeKey()) {
    return {
      status: "no-credentials",
      message:
        "Connecte ta chaîne (ou ajoute YOUTUBE_API_KEY) pour apprendre des modèles à partir de tes titres qui cartonnent.",
      patterns: [],
    };
  }
  try {
    const patterns = await withCache(
      "title-patterns",
      CACHE_TTL_MS,
      gatherPatterns,
    );
    return { status: "ok", patterns };
  } catch (e) {
    return {
      status: "error",
      message: e instanceof Error ? e.message : String(e),
      patterns: [],
    };
  }
}
