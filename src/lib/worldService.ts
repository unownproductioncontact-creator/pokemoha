// Service serveur : scans niche / monde, tendances, recherche (§5). Public via
// clé API. Cache agressif (search.list au minimum, §2).

import {
  searchVideoIds,
  getVideosByIds,
  getChannelsSubsMap,
  getMostPopular,
} from "./youtube";
import { scoreWorldVideo, rankWorld } from "./worldCore";
import { excludeKids } from "./outlierCore";
import { hasYouTubeKey } from "./env";
import { withCache, TTL } from "./cache";
import { getNiche, DEFAULT_NICHE_ID } from "@/config/niches";
import { REGION_PACKS } from "@/config/world";
import type { ScanResult, TrendsResult, WorldScored, YtVideo } from "./types";

async function scoreWithSubs(videos: YtVideo[]): Promise<WorldScored[]> {
  const subs = await getChannelsSubsMap(videos.map((v) => v.channelId));
  const now = Date.now();
  return videos.map((v) => scoreWorldVideo(v, subs.get(v.channelId), now));
}

async function collect(
  queries: string[],
  opts: { regionCode?: string; perQuery?: number },
): Promise<YtVideo[]> {
  const ids = new Set<string>();
  for (const q of queries) {
    const found = await searchVideoIds(q, {
      regionCode: opts.regionCode,
      order: "viewCount",
      max: opts.perQuery ?? 15,
    });
    found.forEach((id) => ids.add(id));
  }
  return ids.size ? getVideosByIds([...ids]) : [];
}

function noCreds(): {
  status: "no-credentials";
  message: string;
  items: never[];
} {
  return {
    status: "no-credentials",
    message:
      "Ajoute YOUTUBE_API_KEY dans .env.local pour scanner YouTube, ou utilise la démo.",
    items: [],
  };
}

export async function scanNiche(
  nicheId = DEFAULT_NICHE_ID,
): Promise<ScanResult> {
  if (!hasYouTubeKey()) return noCreds();
  const niche = getNiche(nicheId);
  if (!niche) return { status: "error", message: "Niche inconnue.", items: [] };
  try {
    const items = await withCache(`niche:v1:${nicheId}`, TTL.niche, async () => {
      const videos = excludeKids(
        await collect(niche.queries.slice(0, 4), {
          regionCode: niche.regionCode,
          perQuery: 20,
        }),
      );
      return rankWorld(await scoreWithSubs(videos), 80);
    });
    return { status: "ok", items };
  } catch (e) {
    return {
      status: "error",
      message: e instanceof Error ? e.message : String(e),
      items: [],
    };
  }
}

export async function scanWorld(): Promise<ScanResult> {
  if (!hasYouTubeKey()) return noCreds();
  try {
    const items = await withCache("world:v1", TTL.world, async () => {
      const all: YtVideo[] = [];
      for (const pack of REGION_PACKS.slice(0, 4)) {
        all.push(
          ...(await collect(pack.queries.slice(0, 2), {
            regionCode: pack.regionCode,
            perQuery: 12,
          })),
        );
      }
      const dedup = new Map(all.map((v) => [v.id, v]));
      return rankWorld(await scoreWithSubs(excludeKids([...dedup.values()])), 80);
    });
    return { status: "ok", items };
  } catch (e) {
    return {
      status: "error",
      message: e instanceof Error ? e.message : String(e),
      items: [],
    };
  }
}

export async function getTrends(regionCode = "FR"): Promise<TrendsResult> {
  if (!hasYouTubeKey())
    return {
      status: "no-credentials",
      message: "Ajoute YOUTUBE_API_KEY ou utilise la démo.",
      items: [],
      regionCode,
    };
  try {
    const items = await withCache(`trends:v1:${regionCode}`, TTL.trends, () =>
      getMostPopular(regionCode, 40),
    );
    return { status: "ok", regionCode, items };
  } catch (e) {
    return {
      status: "error",
      message: e instanceof Error ? e.message : String(e),
      items: [],
      regionCode,
    };
  }
}

export async function searchVideos(query: string): Promise<ScanResult> {
  if (!hasYouTubeKey()) return noCreds();
  const q = query.trim();
  if (!q) return { status: "ok", items: [] };
  try {
    const items = await withCache(`search:v1:${q.toLowerCase()}`, TTL.trends, async () => {
      const ids = await searchVideoIds(q, { order: "relevance", max: 25 });
      const videos = await getVideosByIds(ids);
      return rankWorld(await scoreWithSubs(videos), 50);
    });
    return { status: "ok", items };
  } catch (e) {
    return {
      status: "error",
      message: e instanceof Error ? e.message : String(e),
      items: [],
    };
  }
}
