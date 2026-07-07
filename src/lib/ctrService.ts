// Service CTR / rétention (§5). CTR réel = Reporting API (channel_reach_basic_a1).
// La rétention vient de l'API Analytics (réel, OAuth). Concurrents = indisponible.
// Serveur uniquement.

import { listTokens } from "./oauthStore";
import { getValidAccessToken } from "./googleOAuth";
import { getRealCtr, type CtrOutcome } from "./reportingService";
import type { CtrReport, LabeledMetric } from "./types";

/** Traduit le résultat Reporting en métrique étiquetée pour l'UI (§0). */
function mapCtr(o: CtrOutcome): LabeledMetric {
  if (o.status === "real") {
    return {
      status: "real",
      value: o.ctr, // fraction 0..1 (formatPercent × 100 à l'affichage)
      unit: "%",
      source: `YouTube Reporting (${o.days} j, ${o.impressions.toLocaleString(
        "fr-FR",
      )} impressions)`,
    };
  }
  // pending / unavailable → jamais de valeur inventée, juste une note claire.
  return { status: "unavailable", note: o.note };
}

const DAY = 86_400_000;
function ymd(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

async function fetchAnalytics(accessToken: string, days = 28) {
  const end = Date.now() - DAY; // latence des données YT
  const start = end - days * DAY;
  const url = new URL("https://youtubeanalytics.googleapis.com/v2/reports");
  url.searchParams.set("ids", "channel==MINE");
  url.searchParams.set("startDate", ymd(start));
  url.searchParams.set("endDate", ymd(end));
  url.searchParams.set(
    "metrics",
    "views,estimatedMinutesWatched,averageViewPercentage",
  );
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok)
    throw new Error(`Analytics API ${res.status} : ${await res.text()}`);
  const j = await res.json();
  const row = (j.rows && j.rows[0]) || [];
  return {
    views: typeof row[0] === "number" ? row[0] : undefined,
    watchMin: typeof row[1] === "number" ? row[1] : undefined,
    avgViewPct: typeof row[2] === "number" ? row[2] : undefined,
  };
}

export async function getCtrReport(
  opts: { channelId?: string } = {},
): Promise<CtrReport> {
  const tokens = await listTokens();
  const tok = opts.channelId
    ? tokens.find((t) => t.channelId === opts.channelId)
    : tokens[0];
  const unavailable: CtrReport = {
    status: "no-credentials",
    message: "Connecte ta chaîne (OAuth) pour le CTR et la rétention réels.",
    ctr: { status: "unavailable" },
    retention: { status: "unavailable" },
  };
  if (!tok) return unavailable;
  try {
    const at = await getValidAccessToken(tok.channelId);
    if (!at) return unavailable;
    // CTR (Reporting API) et rétention (Analytics API) en parallèle.
    // getRealCtr ne lève jamais → un échec CTR ne casse pas la rétention.
    const [a, ctrOutcome] = await Promise.all([
      fetchAnalytics(at),
      getRealCtr(at, tok.channelId),
    ]);
    return {
      status: "ok",
      ctr: mapCtr(ctrOutcome),
      retention: {
        status: "real",
        value: a.avgViewPct != null ? a.avgViewPct / 100 : undefined,
        unit: "%",
        source: "YouTube Analytics (28 j)",
      },
      watchTimeMin: {
        status: "real",
        value: a.watchMin,
        unit: "min",
        source: "YouTube Analytics (28 j)",
      },
      views28: {
        status: "real",
        value: a.views,
        unit: "vues",
        source: "YouTube Analytics (28 j)",
      },
    };
  } catch (e) {
    return {
      status: "error",
      message: e instanceof Error ? e.message : String(e),
      ctr: { status: "unavailable" },
      retention: { status: "unavailable" },
    };
  }
}
