// Service YouTube Reporting API (§5) — CTR RÉEL (impressions → clics).
// Flux : trouver/créer un job `channel_reach_basic_a1` → lister ses rapports
// (générés 1×/jour par Google, backfill ~24-48 h après création) → télécharger
// les CSV de la fenêtre → agréger un CTR pondéré. Serveur uniquement.
//
// Ne LÈVE JAMAIS : renvoie toujours un statut exploité par l'UI (§0, pas d'invention).

import { withCache } from "./cache";
import {
  parseReachCsv,
  pickReportsForWindow,
  combineCtr,
  type ReportMeta,
} from "./reportingCore";

const REPORTING_BASE = "https://youtubereporting.googleapis.com/v1";
const REPORT_TYPE = "channel_reach_basic_a1";
const WINDOW_DAYS = 28;
const CACHE_TTL_MS = 30 * 60_000; // 30 min : les données Reporting changent 1×/jour
const HTTP_TIMEOUT_MS = 12_000;

export type CtrOutcome =
  | { status: "real"; ctr: number; impressions: number; days: number }
  | { status: "pending"; note: string }
  | { status: "unavailable"; note: string };

interface Job {
  id: string;
  reportTypeId: string;
}
interface ReportApi extends ReportMeta {
  id: string;
}

async function authFetch(
  url: string,
  at: string,
  init?: RequestInit,
): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), HTTP_TIMEOUT_MS);
  try {
    return await fetch(url, {
      ...init,
      signal: ctrl.signal,
      headers: { Authorization: `Bearer ${at}`, ...(init?.headers ?? {}) },
    });
  } finally {
    clearTimeout(t);
  }
}

/** Trouve un job existant pour le type de rapport, ou le crée. */
async function findOrCreateJob(
  at: string,
): Promise<{ jobId?: string; error?: string }> {
  const listRes = await authFetch(`${REPORTING_BASE}/jobs`, at);
  if (listRes.ok) {
    const data = (await listRes.json()) as { jobs?: Job[] };
    const existing = (data.jobs ?? []).find((j) => j.reportTypeId === REPORT_TYPE);
    if (existing?.id) return { jobId: existing.id };
  } else if (listRes.status === 403) {
    return {
      error:
        "Accès Reporting refusé (403). Reconnecte ta chaîne pour accorder l'accès Analytics.",
    };
  }
  // Créer le job (idempotent côté Google si un même type existe déjà : renvoie l'existant).
  const createRes = await authFetch(`${REPORTING_BASE}/jobs`, at, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ reportTypeId: REPORT_TYPE, name: "pokemoha-ctr" }),
  });
  if (!createRes.ok) {
    const body = (await createRes.text()).slice(0, 160);
    return { error: `Création du job Reporting échouée (${createRes.status}). ${body}` };
  }
  const job = (await createRes.json()) as Job;
  return job.id ? { jobId: job.id } : { error: "Job Reporting sans identifiant." };
}

/** Liste tous les rapports d'un job (pagination bornée). */
async function listReports(at: string, jobId: string): Promise<ReportApi[]> {
  const out: ReportApi[] = [];
  let pageToken: string | undefined;
  do {
    const u = new URL(`${REPORTING_BASE}/jobs/${jobId}/reports`);
    u.searchParams.set("pageSize", "100");
    if (pageToken) u.searchParams.set("pageToken", pageToken);
    const res = await authFetch(u.toString(), at);
    if (!res.ok) break;
    const data = (await res.json()) as {
      reports?: ReportApi[];
      nextPageToken?: string;
    };
    out.push(...(data.reports ?? []));
    pageToken = data.nextPageToken;
  } while (pageToken && out.length < 400);
  return out;
}

async function computeCtr(at: string): Promise<CtrOutcome> {
  const { jobId, error } = await findOrCreateJob(at);
  if (error) return { status: "unavailable", note: error };
  if (!jobId) return { status: "unavailable", note: "Job Reporting indisponible." };

  const reports = await listReports(at, jobId);
  if (reports.length === 0) {
    return {
      status: "pending",
      note: "Rapport CTR en cours de génération par Google (~24-48 h après la 1re connexion). Reviens demain — aucune valeur n'est inventée en attendant.",
    };
  }

  const picked = pickReportsForWindow(reports, WINDOW_DAYS);
  const parts = await Promise.all(
    picked.map(async (r) => {
      try {
        const res = await authFetch(r.downloadUrl, at);
        if (!res.ok) return { impressions: 0, clicks: 0 };
        return parseReachCsv(await res.text());
      } catch {
        return { impressions: 0, clicks: 0 };
      }
    }),
  );

  const agg = combineCtr(parts);
  if (agg.ctr == null || agg.impressions <= 0) {
    return {
      status: "pending",
      note: "Rapports CTR présents mais encore sans impressions exploitables (données du jour non finalisées par Google). Reviens un peu plus tard.",
    };
  }
  return {
    status: "real",
    ctr: agg.ctr,
    impressions: agg.impressions,
    days: picked.length,
  };
}

/** CTR réel, caché 30 min par chaîne. Ne lève jamais. */
export async function getRealCtr(
  accessToken: string,
  channelId: string,
): Promise<CtrOutcome> {
  try {
    return await withCache<CtrOutcome>(`ctr-reach:${channelId}`, CACHE_TTL_MS, () =>
      computeCtr(accessToken),
    );
  } catch (e) {
    return {
      status: "unavailable",
      note: `CTR indisponible : ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}
