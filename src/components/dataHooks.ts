"use client";

import { useEffect, useState } from "react";
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

export interface AsyncState<T> {
  loading: boolean;
  data?: T;
  error?: string;
}

/** Récupère l'analyse de MA chaîne via /api/my-channel (cache fichier côté serveur). */
export function useChannelAnalysis(
  opts: { channelId?: string; demo?: boolean } = {},
) {
  const { channelId, demo } = opts;
  const [state, setState] = useState<AsyncState<ChannelAnalysis>>({
    loading: true,
  });
  useEffect(() => {
    let alive = true;
    setState({ loading: true });
    const p = new URLSearchParams();
    if (channelId) p.set("channelId", channelId);
    if (demo) p.set("demo", "1");
    const qs = p.toString();
    fetch("/api/my-channel" + (qs ? `?${qs}` : ""))
      .then((r) => r.json())
      .then((d: ChannelAnalysis) => {
        if (alive) setState({ loading: false, data: d });
      })
      .catch((e) => {
        if (alive) setState({ loading: false, error: String(e) });
      });
    return () => {
      alive = false;
    };
  }, [channelId, demo]);
  return state;
}

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

export function useCompetitors(demo?: boolean) {
  const [tick, setTick] = useState(0);
  const [state, setState] = useState<AsyncState<CompetitorsResult>>({
    loading: true,
  });
  useEffect(() => {
    let alive = true;
    setState({ loading: true });
    fetch("/api/competitors" + (demo ? "?demo=1" : ""))
      .then((r) => r.json())
      .then((d: CompetitorsResult) => {
        if (alive) setState({ loading: false, data: d });
      })
      .catch((e) => {
        if (alive) setState({ loading: false, error: String(e) });
      });
    return () => {
      alive = false;
    };
  }, [demo, tick]);
  return { ...state, reload: () => setTick((t) => t + 1) };
}

export function useCompetitorDetail(id: string, demo?: boolean) {
  const [state, setState] = useState<AsyncState<CompetitorAnalysis>>({
    loading: true,
  });
  useEffect(() => {
    let alive = true;
    setState({ loading: true });
    fetch(
      `/api/competitors/${encodeURIComponent(id)}` + (demo ? "?demo=1" : ""),
    )
      .then((r) => r.json())
      .then((d: CompetitorAnalysis) => {
        if (alive) setState({ loading: false, data: d });
      })
      .catch((e) => {
        if (alive) setState({ loading: false, error: String(e) });
      });
    return () => {
      alive = false;
    };
  }, [id, demo]);
  return state;
}

export function useInspirations() {
  const [tick, setTick] = useState(0);
  const [items, setItems] = useState<InspirationItem[]>([]);
  useEffect(() => {
    let alive = true;
    fetch("/api/inspirations")
      .then((r) => r.json())
      .then((d) => {
        if (alive) setItems(d.items ?? []);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [tick]);
  return { items, reload: () => setTick((t) => t + 1) };
}

export function useCompetitorOutliers(demo?: boolean, windowDays = 0) {
  const [items, setItems] = useState<CompetitorOutlier[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasCredentials, setHasCredentials] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    const p = new URLSearchParams();
    if (demo) p.set("demo", "1");
    if (windowDays) p.set("window", String(windowDays));
    fetch("/api/competitors/outliers?" + p.toString())
      .then((r) => r.json())
      .then((d) => {
        if (alive) {
          setItems(d.items ?? []);
          setHasCredentials(d.hasCredentials !== false);
          setIsDemo(!!d.demo);
          setLoading(false);
        }
      })
      .catch(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [demo, windowDays]);
  return { items, loading, hasCredentials, isDemo };
}

export async function postCompetitor(
  action: "add" | "remove",
  payload: { ref?: string; id?: string; label?: string },
) {
  await fetch("/api/competitors", {
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
  await fetch("/api/inspirations", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(insp),
  });
}

export async function deleteInspiration(id: string) {
  await fetch(`/api/inspirations?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export function useScan(kind: "niche" | "world", demo?: boolean) {
  const [tick, setTick] = useState(0);
  const [state, setState] = useState<AsyncState<ScanResult>>({ loading: true });
  useEffect(() => {
    let alive = true;
    setState({ loading: true });
    const p = new URLSearchParams();
    p.set("kind", kind);
    if (demo) p.set("demo", "1");
    fetch("/api/scan?" + p.toString())
      .then((r) => r.json())
      .then((d: ScanResult) => {
        if (alive) setState({ loading: false, data: d });
      })
      .catch((e) => {
        if (alive) setState({ loading: false, error: String(e) });
      });
    return () => {
      alive = false;
    };
  }, [kind, demo, tick]);
  return { ...state, reload: () => setTick((t) => t + 1) };
}

export function useTrends(demo?: boolean, region = "FR") {
  const [state, setState] = useState<AsyncState<TrendsResult>>({
    loading: true,
  });
  useEffect(() => {
    let alive = true;
    setState({ loading: true });
    const p = new URLSearchParams();
    if (demo) p.set("demo", "1");
    p.set("region", region);
    fetch("/api/trends?" + p.toString())
      .then((r) => r.json())
      .then((d: TrendsResult) => {
        if (alive) setState({ loading: false, data: d });
      })
      .catch((e) => {
        if (alive) setState({ loading: false, error: String(e) });
      });
    return () => {
      alive = false;
    };
  }, [demo, region]);
  return state;
}

export function useAlerts(demo?: boolean) {
  const [state, setState] = useState<AsyncState<AlertsResult>>({ loading: true });
  useEffect(() => {
    let alive = true;
    setState({ loading: true });
    fetch("/api/alerts" + (demo ? "?demo=1" : ""))
      .then((r) => r.json())
      .then((d: AlertsResult) => {
        if (alive) setState({ loading: false, data: d });
      })
      .catch((e) => {
        if (alive) setState({ loading: false, error: String(e) });
      });
    return () => {
      alive = false;
    };
  }, [demo]);
  return state;
}

export function useDiagnostic() {
  const [tick, setTick] = useState(0);
  const [state, setState] = useState<AsyncState<DiagnosticResult>>({
    loading: true,
  });
  useEffect(() => {
    let alive = true;
    setState({ loading: true });
    fetch("/api/diagnostic")
      .then((r) => r.json())
      .then((d: DiagnosticResult) => {
        if (alive) setState({ loading: false, data: d });
      })
      .catch((e) => {
        if (alive) setState({ loading: false, error: String(e) });
      });
    return () => {
      alive = false;
    };
  }, [tick]);
  return { ...state, reload: () => setTick((t) => t + 1) };
}

export function useHistory() {
  const [state, setState] = useState<AsyncState<HistoryResult>>({
    loading: true,
  });
  useEffect(() => {
    let alive = true;
    fetch("/api/history")
      .then((r) => r.json())
      .then((d: HistoryResult) => {
        if (alive) setState({ loading: false, data: d });
      })
      .catch((e) => {
        if (alive) setState({ loading: false, error: String(e) });
      });
    return () => {
      alive = false;
    };
  }, []);
  return state;
}

export function useIdeas(demo?: boolean, daily?: boolean) {
  const [state, setState] = useState<AsyncState<IdeasResult>>({ loading: true });
  useEffect(() => {
    let alive = true;
    setState({ loading: true });
    const p = new URLSearchParams();
    if (demo) p.set("demo", "1");
    if (daily) p.set("daily", "1");
    fetch("/api/ideas?" + p.toString())
      .then((r) => r.json())
      .then((d: IdeasResult) => {
        if (alive) setState({ loading: false, data: d });
      })
      .catch((e) => {
        if (alive) setState({ loading: false, error: String(e) });
      });
    return () => {
      alive = false;
    };
  }, [demo, daily]);
  return state;
}

/** Modèles de titres appris de mes outliers + concurrents (/api/title-patterns). */
export function useTitlePatterns(demo?: boolean) {
  const [state, setState] = useState<AsyncState<TitlePatternsResult>>({
    loading: true,
  });
  useEffect(() => {
    let alive = true;
    setState({ loading: true });
    fetch("/api/title-patterns" + (demo ? "?demo=1" : ""))
      .then((r) => r.json())
      .then((d: TitlePatternsResult) => {
        if (alive) setState({ loading: false, data: d });
      })
      .catch((e) => {
        if (alive) setState({ loading: false, error: String(e) });
      });
    return () => {
      alive = false;
    };
  }, [demo]);
  return state;
}

export function useAudit(demo?: boolean, channelId?: string) {
  const [state, setState] = useState<AsyncState<AuditResult>>({ loading: true });
  useEffect(() => {
    let alive = true;
    setState({ loading: true });
    const p = new URLSearchParams();
    if (demo) p.set("demo", "1");
    if (channelId) p.set("channelId", channelId);
    fetch("/api/audit?" + p.toString())
      .then((r) => r.json())
      .then((d: AuditResult) => {
        if (alive) setState({ loading: false, data: d });
      })
      .catch((e) => {
        if (alive) setState({ loading: false, error: String(e) });
      });
    return () => {
      alive = false;
    };
  }, [demo, channelId]);
  return state;
}

export function useCtr(demo?: boolean, channelId?: string) {
  const [state, setState] = useState<AsyncState<CtrReport>>({ loading: true });
  useEffect(() => {
    let alive = true;
    setState({ loading: true });
    const p = new URLSearchParams();
    if (demo) p.set("demo", "1");
    if (channelId) p.set("channelId", channelId);
    fetch("/api/ctr?" + p.toString())
      .then((r) => r.json())
      .then((d: CtrReport) => {
        if (alive) setState({ loading: false, data: d });
      })
      .catch((e) => {
        if (alive) setState({ loading: false, error: String(e) });
      });
    return () => {
      alive = false;
    };
  }, [demo, channelId]);
  return state;
}

export function useSearch() {
  const [state, setState] = useState<AsyncState<ScanResult>>({
    loading: false,
  });
  function run(q: string, demo?: boolean) {
    if (!q.trim() && !demo) return;
    setState({ loading: true });
    const p = new URLSearchParams();
    p.set("q", q);
    if (demo) p.set("demo", "1");
    fetch("/api/search?" + p.toString())
      .then((r) => r.json())
      .then((d: ScanResult) => setState({ loading: false, data: d }))
      .catch((e) => setState({ loading: false, error: String(e) }));
  }
  return { ...state, run };
}
