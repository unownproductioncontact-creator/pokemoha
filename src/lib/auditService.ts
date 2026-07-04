// Service d'audit (§5) : assemble l'analyse de MA chaîne + le taux d'outliers
// moyen des concurrents pour produire un AuditReport. Serveur uniquement.

import { analyzeMyChannel } from "./channelService";
import { analyzeAllCompetitors } from "./competitorService";
import { analyzeAudit } from "./auditCore";
import type { AuditResult } from "./types";

export async function getAuditReport(
  opts: { channelId?: string } = {},
): Promise<AuditResult> {
  const ch = await analyzeMyChannel({ channelId: opts.channelId });
  if (ch.status !== "ok" || !ch.scored || !ch.medians) {
    return { status: ch.status, message: ch.message };
  }

  let competitorOutlierRate: number | undefined;
  try {
    const comps = await analyzeAllCompetitors();
    const rates = comps.competitors
      .filter((c) => c.status === "ok" && c.scored)
      .map((c) => {
        const scored = c.scored ?? [];
        const hits = scored.filter(
          (s) => s.flag === "outlier" || s.flag === "emerging",
        ).length;
        return scored.length ? hits / scored.length : 0;
      });
    if (rates.length)
      competitorOutlierRate = rates.reduce((s, x) => s + x, 0) / rates.length;
  } catch {
    /* best-effort, on continue sans comparatif */
  }

  const report = analyzeAudit({
    scored: ch.scored,
    medians: ch.medians,
    channel: ch.channel,
    nowMs: Date.now(),
    competitorOutlierRate,
  });
  return { status: "ok", channelTitle: ch.channel?.title, report };
}
