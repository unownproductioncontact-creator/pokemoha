// Service du feed d'alertes (§5). Serveur uniquement.

import { analyzeMyChannel } from "./channelService";
import {
  analyzeAllCompetitors,
  flattenCompetitorOutliers,
} from "./competitorService";
import { buildAlerts } from "./alertsCore";
import type { AlertsResult, ScoredVideo } from "./types";

export async function getAlerts(): Promise<AlertsResult> {
  try {
    const mine = await analyzeMyChannel({});
    let competitorOutliers: { sv: ScoredVideo; competitorLabel: string }[] = [];
    try {
      const comps = await analyzeAllCompetitors();
      competitorOutliers = flattenCompetitorOutliers(comps, {
        windowDays: 7,
        limit: 20,
      }).map((o) => ({ sv: o.sv, competitorLabel: o.competitorLabel }));
    } catch {
      /* best-effort */
    }

    if (mine.status !== "ok" && competitorOutliers.length === 0) {
      return {
        status: mine.status === "no-credentials" ? "no-credentials" : "error",
        message: mine.message ?? "Aucune source de données.",
        alerts: [],
      };
    }

    const alerts = buildAlerts({
      scored: mine.scored,
      competitorOutliers,
      nowMs: Date.now(),
    });
    return { status: "ok", alerts };
  } catch (e) {
    return {
      status: "error",
      message: e instanceof Error ? e.message : String(e),
      alerts: [],
    };
  }
}
