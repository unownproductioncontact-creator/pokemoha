// Service CTR / rétention (§5). CTR réel = Reporting API (channel_reach_basic_a1).
// La rétention vient de l'API Analytics (réel, OAuth). Concurrents = indisponible.
// Serveur uniquement.

import { listTokens } from "./oauthStore";
import { getValidAccessToken } from "./googleOAuth";
import type { CtrReport } from "./types";

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
    const a = await fetchAnalytics(at);
    return {
      status: "ok",
      ctr: {
        status: "unavailable",
        note: "Le CTR (impressions → clics) requiert le rapport Reporting API channel_reach_basic_a1. La rétention vient de l'API Analytics.",
      },
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
