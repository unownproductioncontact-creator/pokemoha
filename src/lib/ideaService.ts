// Service du moteur d'idées (§6) : agrège des signaux (mes outliers + concurrents
// + niche) et les classe localement. Mode IA optionnel (dormant par défaut).
// Serveur uniquement.

import { analyzeMyChannel } from "./channelService";
import {
  analyzeAllCompetitors,
  flattenCompetitorOutliers,
} from "./competitorService";
import { scanNiche } from "./worldService";
import { rankIdeas, pickDaily, type IdeaSignal } from "./ideaRanking";
import { polishIdeasWithLlm } from "./ideasLlm";
import { hasYouTubeKey, llmIdeasEnabled } from "./env";
import type { IdeasResult } from "./types";

function ymdSeed(): number {
  const d = new Date();
  return d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate();
}

async function gatherSignals(): Promise<{
  signals: IdeaSignal[];
  myTitles: string[];
}> {
  const signals: IdeaSignal[] = [];
  let myTitles: string[] = [];

  const mine = await analyzeMyChannel({});
  if (mine.status === "ok" && mine.scored) {
    myTitles = mine.scored.map((s) => s.video.title);
    for (const s of mine.scored.filter(
      (s) => s.flag === "outlier" || s.flag === "emerging",
    ))
      signals.push({
        title: s.video.title,
        strength: s.ratio,
        source: "mine",
        format: s.video.format,
      });
  }

  try {
    const comps = await analyzeAllCompetitors();
    for (const o of flattenCompetitorOutliers(comps, { limit: 60 }))
      signals.push({
        title: o.sv.video.title,
        strength: o.sv.ratio,
        source: "competitor",
        sourceLabel: o.competitorLabel,
        format: o.sv.video.format,
      });
  } catch {
    /* best-effort */
  }

  try {
    const niche = await scanNiche();
    for (const w of niche.items)
      signals.push({
        title: w.video.title,
        strength: w.score / 10,
        source: "niche",
        mechanic: w.mechanic,
        format: w.video.format,
      });
  } catch {
    /* best-effort */
  }

  return { signals, myTitles };
}

export async function getIdeas(
  opts: { daily?: boolean } = {},
): Promise<IdeasResult> {
  if (!hasYouTubeKey()) {
    return {
      status: "no-credentials",
      message:
        "Ajoute YOUTUBE_API_KEY (ou connecte ta chaîne) pour générer des idées depuis tes données.",
      ideas: [],
    };
  }
  try {
    const { signals, myTitles } = await gatherSignals();
    const ranked = rankIdeas(signals, { myTitles, limit: 100 });
    const selected = opts.daily ? pickDaily(ranked, ymdSeed(), 6) : ranked;
    if (llmIdeasEnabled()) {
      return { status: "ok", ideas: await polishIdeasWithLlm(selected), usedLlm: true };
    }
    return { status: "ok", ideas: selected, usedLlm: false };
  } catch (e) {
    return {
      status: "error",
      message: e instanceof Error ? e.message : String(e),
      ideas: [],
    };
  }
}
