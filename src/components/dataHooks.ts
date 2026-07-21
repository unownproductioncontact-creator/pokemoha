"use client";

import { useEffect, useState } from "react";
import { useResource, type Resource } from "@/components/useResource";
import type {
  ChannelAnalysis,
  CompetitorsResult,
  CompetitorAnalysis,
  CompetitorOutlier,
  ScanResult,
  TrendsResult,
  AuditResult,
  CtrReport,
  IdeasResult,
  TitlePatternsResult,
  AlertsResult,
  DiagnosticResult,
  HistoryResult,
} from "@/lib/types";

type QVal = string | number | boolean | undefined | null;

/** Construit une URL d'API en omettant les paramètres vides/false. */
function apiUrl(base: string, params: Record<string, QVal> = {}): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === false || v === "") continue;
    p.set(k, v === true ? "1" : String(v));
  }
  const qs = p.toString();
  return qs ? `${base}?${qs}` : base;
}

// ───────────────────────── Ma chaîne / outliers ─────────────────────────

/** Analyse de MA chaîne via /api/my-channel (SWR client + cache fichier serveur). */
export function useChannelAnalysis(
  opts: { channelId?: string; demo?: boolean } = {},
): Resource<ChannelAnalysis> {
  return useResource<ChannelAnalysis>(
    apiUrl("/api/my-channel", { channelId: opts.channelId, demo: opts.demo }),
  );
}

// ───────────────────────── Concurrents ─────────────────────────

export interface InspirationItem {
  id: string;
  videoId: string;
  title: string;
  channelTitle?: string;
  ratio?: number;
  thumb?: string;
  url: string;
  savedAt: number;
}

export function useCompetitors(demo?: boolean): Resource<CompetitorsResult> {
  return useResource<CompetitorsResult>(apiUrl("/api/competitors", { demo }));
}

export function useCompetitorDetail(
  id: string,
  demo?: boolean,
): Resource<CompetitorAnalysis> {
  return useResource<CompetitorAnalysis>(
    id
      ? apiUrl(`/api/competitors/${encodeURIComponent(id)}`, { demo })
      : null,
  );
}

export function useInspirations() {
  const r = useResource<{ items: InspirationItem[] }>("/api/inspirations");
  return { items: r.data?.items ?? [], reload: r.reload };
}

export function useCompetitorOutliers(demo?: boolean, windowDays = 0) {
  const r = useResource<{
    items?: CompetitorOutlier[];
    hasCredentials?: boolean;
    demo?: boolean;
  }>(apiUrl("/api/competitors/outliers", { demo, window: windowDays || undefined }));
  return {
    items: r.data?.items ?? [],
    loading: r.loading,
    hasCredentials: r.data?.hasCredentials !== false,
    isDemo: !!r.data?.demo,
    reload: r.reload,
  };
}

/** Lance une erreur si la réponse n'est pas OK — sinon une écriture échouée
 *  (500, {ok:false}) serait présentée comme un succès (viole §0). */
async function mutateApi(url: string, init: RequestInit) {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`Échec (${res.status}) sur ${url}`);
}

export async function postCompetitor(
  action: "add" | "remove",
  payload: { ref?: string; id?: string; label?: string },
) {
  await mutateApi("/api/competitors", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action, ...payload }),
  });
}

export async function saveInspiration(insp: {
  videoId: string;
  title: string;
  url: string;
  channelTitle?: string;
  ratio?: number;
  thumb?: string;
}) {
  await mutateApi("/api/inspirations", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(insp),
  });
}

export async function deleteInspiration(id: string) {
  await mutateApi(`/api/inspirations?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

// ───────────────────────── Scan / tendances / recherche ─────────────────────────

export function useScan(
  kind: "niche" | "world",
  demo?: boolean,
): Resource<ScanResult> {
  return useResource<ScanResult>(apiUrl("/api/scan", { kind, demo }));
}

export function useTrends(demo?: boolean, region = "FR"): Resource<TrendsResult> {
  return useResource<TrendsResult>(apiUrl("/api/trends", { demo, region }));
}

// ───────────────────────── Système / idées / audit / CTR ─────────────────────────

export function useAlerts(demo?: boolean): Resource<AlertsResult> {
  return useResource<AlertsResult>(apiUrl("/api/alerts", { demo }));
}

export function useDiagnostic(): Resource<DiagnosticResult> {
  return useResource<DiagnosticResult>("/api/diagnostic");
}

export function useHistory(): Resource<HistoryResult> {
  return useResource<HistoryResult>("/api/history");
}

export function useIdeas(demo?: boolean, daily?: boolean): Resource<IdeasResult> {
  return useResource<IdeasResult>(apiUrl("/api/ideas", { demo, daily }));
}

/** Modèles de titres appris de mes outliers + concurrents (/api/title-patterns). */
export function useTitlePatterns(demo?: boolean): Resource<TitlePatternsResult> {
  return useResource<TitlePatternsResult>(
    apiUrl("/api/title-patterns", { demo }),
  );
}

export function useAudit(
  demo?: boolean,
  channelId?: string,
): Resource<AuditResult> {
  return useResource<AuditResult>(apiUrl("/api/audit", { demo, channelId }));
}

export function useCtr(demo?: boolean, channelId?: string): Resource<CtrReport> {
  return useResource<CtrReport>(apiUrl("/api/ctr", { demo, channelId }));
}

/** Recherche à la demande. Garde les résultats précédents pendant une nouvelle
 *  requête (audit UX F040) : plus de blackout entre deux recherches. */
export function useSearch() {
  const [url, setUrl] = useState<string | null>(null);
  const r = useResource<ScanResult>(url);
  // Dernier résultat abouti : reste affiché pendant la requête suivante (le SWR
  // par-clé vide `r.data` au changement de requête, ce qui blankerait sinon).
  const [lastData, setLastData] = useState<ScanResult | undefined>(undefined);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (r.data !== undefined) {
      setLastData(r.data);
      setPending(false);
    } else if (r.error) {
      setPending(false);
    }
  }, [r.data, r.error]);

  function run(q: string, demo?: boolean) {
    if (!q.trim() && !demo) return;
    setPending(true);
    const next = apiUrl("/api/search", { q, demo });
    // Même requête relancée : l'URL ne change pas → React bail-out. On force
    // alors une revalidation via reload() au lieu d'un no-op silencieux.
    if (next === url) r.reload();
    else setUrl(next);
  }

  return {
    data: r.data ?? lastData,
    error: r.error,
    loading: pending && lastData === undefined,
    searching: pending,
    run,
  };
}
