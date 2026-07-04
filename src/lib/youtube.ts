// Client YouTube Data API v3 (§2). Serveur uniquement. Conscient du quota :
// chaque appel déclare son coût en unités (search.list = 100 ; le reste = 1).

import { env } from "./env";
import { withCache, TTL } from "./cache";
import {
  extractChannelRef,
  parseISO8601Duration,
  classifyFormat,
} from "./ytParse";
import type { ChannelSnapshot, YtVideo, Thumbnails } from "./types";

const BASE = "https://www.googleapis.com/youtube/v3";
const CACHE_V = "v1"; // bump quand la forme de sortie change (§3/§7)

/* eslint-disable @typescript-eslint/no-explicit-any */
type Json = any;

export class YtError extends Error {
  status: number;
  body: string;
  constructor(status: number, body: string) {
    super(`YouTube API ${status}`);
    this.name = "YtError";
    this.status = status;
    this.body = body;
  }
  get isQuota(): boolean {
    return this.status === 403 && /quota/i.test(this.body);
  }
}

// Estimateur de quota en mémoire (le vrai compteur est côté Google).
let quotaUsed = 0;
export function getEstimatedQuota(): number {
  return quotaUsed;
}
export function resetEstimatedQuota(): void {
  quotaUsed = 0;
}

async function ytGet(
  endpoint: string,
  params: Record<string, string>,
  units: number,
  accessToken?: string,
): Promise<Json> {
  const u = new URL(`${BASE}/${endpoint}`);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  const headers: Record<string, string> = {};
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  } else {
    const key = env().youtubeApiKey;
    if (!key) throw new Error("YOUTUBE_API_KEY manquante (clé Data API v3).");
    u.searchParams.set("key", key);
  }
  quotaUsed += units;
  const res = await fetch(u.toString(), { headers });
  if (!res.ok) throw new YtError(res.status, await res.text());
  return res.json();
}

function numOrUndef(v: unknown): number | undefined {
  if (v === undefined || v === null) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}
function numOrZero(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function mapThumbs(t: Json): Thumbnails | undefined {
  if (!t) return undefined;
  const pick = (x: Json) => (x && x.url ? (x.url as string) : undefined);
  return {
    default: pick(t.default),
    medium: pick(t.medium),
    high: pick(t.high),
    standard: pick(t.standard),
    maxres: pick(t.maxres),
  };
}

function mapChannel(item: Json): ChannelSnapshot {
  return {
    channelId: item.id,
    title: item.snippet?.title ?? "",
    handle: item.snippet?.customUrl,
    subscribers: numOrUndef(item.statistics?.subscriberCount),
    totalViews: numOrUndef(item.statistics?.viewCount),
    videoCount: numOrUndef(item.statistics?.videoCount),
    country: item.snippet?.country,
    thumbnails: mapThumbs(item.snippet?.thumbnails),
    uploadsPlaylistId: item.contentDetails?.relatedPlaylists?.uploads,
  };
}

function mapVideo(item: Json): YtVideo {
  const durationSec = parseISO8601Duration(item.contentDetails?.duration ?? "");
  return {
    id: item.id,
    channelId: item.snippet?.channelId ?? "",
    channelTitle: item.snippet?.channelTitle ?? "",
    title: item.snippet?.title ?? "",
    description: item.snippet?.description,
    publishedAt: item.snippet?.publishedAt ?? "",
    durationSec,
    views: numOrZero(item.statistics?.viewCount),
    likes: numOrUndef(item.statistics?.likeCount),
    comments: numOrUndef(item.statistics?.commentCount),
    thumbnails: mapThumbs(item.snippet?.thumbnails),
    tags: item.snippet?.tags,
    format: classifyFormat(durationSec),
    madeForKids:
      item.status?.madeForKids ?? item.status?.selfDeclaredMadeForKids,
  };
}

const CHANNEL_PART = "snippet,statistics,contentDetails";

/** Résout une chaîne par le chemin le moins coûteux (id/handle/username = 1 u ; query = 100 u). */
export async function resolveChannel(
  ref: string,
  accessToken?: string,
): Promise<ChannelSnapshot | null> {
  const r = extractChannelRef(ref);
  if (r.kind === "id") {
    const d = await ytGet("channels", { part: CHANNEL_PART, id: r.value }, 1, accessToken);
    return d.items?.[0] ? mapChannel(d.items[0]) : null;
  }
  if (r.kind === "handle") {
    const d = await ytGet("channels", { part: CHANNEL_PART, forHandle: r.value }, 1, accessToken);
    return d.items?.[0] ? mapChannel(d.items[0]) : null;
  }
  if (r.kind === "username") {
    const d = await ytGet("channels", { part: CHANNEL_PART, forUsername: r.value }, 1, accessToken);
    return d.items?.[0] ? mapChannel(d.items[0]) : null;
  }
  // query → search.list (100 u) puis channels.list par id (1 u)
  const s = await ytGet(
    "search",
    { part: "snippet", type: "channel", q: r.value, maxResults: "1" },
    100,
    accessToken,
  );
  const id = s.items?.[0]?.id?.channelId ?? s.items?.[0]?.snippet?.channelId;
  if (!id) return null;
  const d = await ytGet("channels", { part: CHANNEL_PART, id }, 1, accessToken);
  return d.items?.[0] ? mapChannel(d.items[0]) : null;
}

/** Chaîne(s) du compte connecté (channels.list mine=true, 1 u). */
export async function getMyChannels(
  accessToken: string,
): Promise<ChannelSnapshot[]> {
  const d = await ytGet(
    "channels",
    { part: CHANNEL_PART, mine: "true", maxResults: "50" },
    1,
    accessToken,
  );
  return (d.items ?? []).map(mapChannel);
}

/** Recherche de chaînes par mot-clé (search.list 100 u + channels.list 1 u). */
export async function searchChannels(
  query: string,
  max = 10,
): Promise<ChannelSnapshot[]> {
  const s = await ytGet(
    "search",
    {
      part: "snippet",
      type: "channel",
      q: query,
      maxResults: String(Math.min(max, 25)),
    },
    100,
  );
  const ids = (s.items ?? [])
    .map((it: Json) => it.id?.channelId)
    .filter((x: unknown): x is string => typeof x === "string");
  if (ids.length === 0) return [];
  const d = await ytGet("channels", { part: CHANNEL_PART, id: ids.join(",") }, 1);
  return (d.items ?? []).map(mapChannel);
}

async function getUploadVideoIds(
  uploadsPlaylistId: string,
  max: number,
  accessToken?: string,
): Promise<string[]> {
  const ids: string[] = [];
  let pageToken: string | undefined;
  while (ids.length < max) {
    const params: Record<string, string> = {
      part: "contentDetails",
      playlistId: uploadsPlaylistId,
      maxResults: "50",
    };
    if (pageToken) params.pageToken = pageToken;
    const d = await ytGet("playlistItems", params, 1, accessToken);
    for (const it of d.items ?? []) {
      const vid = it.contentDetails?.videoId;
      if (vid) ids.push(vid);
    }
    pageToken = d.nextPageToken;
    if (!pageToken) break;
  }
  return ids.slice(0, max);
}

/** Détaille des vidéos par lots de 50 (videos.list, 1 u/lot). */
export async function getVideosByIds(
  ids: string[],
  accessToken?: string,
): Promise<YtVideo[]> {
  const out: YtVideo[] = [];
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50);
    if (batch.length === 0) break;
    const d = await ytGet(
      "videos",
      { part: "snippet,statistics,contentDetails,status", id: batch.join(",") },
      1,
      accessToken,
    );
    for (const it of d.items ?? []) out.push(mapVideo(it));
  }
  return out;
}

/** Recherche d'IDs vidéo (search.list 100 u). */
export async function searchVideoIds(
  query: string,
  opts: {
    regionCode?: string;
    order?: string;
    max?: number;
    publishedAfterIso?: string;
  } = {},
): Promise<string[]> {
  const params: Record<string, string> = {
    part: "snippet",
    type: "video",
    q: query,
    maxResults: String(Math.min(opts.max ?? 25, 50)),
  };
  if (opts.regionCode) params.regionCode = opts.regionCode;
  if (opts.order) params.order = opts.order;
  if (opts.publishedAfterIso) params.publishedAfter = opts.publishedAfterIso;
  const s = await ytGet("search", params, 100);
  return (s.items ?? [])
    .map((it: Json) => it.id?.videoId)
    .filter((x: unknown): x is string => typeof x === "string");
}

/** Vidéos tendances (videos?chart=mostPopular, 1 u). ⚠️ Pas de filtre par date. */
export async function getMostPopular(
  regionCode = "FR",
  max = 40,
  videoCategoryId?: string,
): Promise<YtVideo[]> {
  const params: Record<string, string> = {
    part: "snippet,statistics,contentDetails,status",
    chart: "mostPopular",
    regionCode,
    maxResults: String(Math.min(max, 50)),
  };
  if (videoCategoryId) params.videoCategoryId = videoCategoryId;
  const d = await ytGet("videos", params, 1);
  return (d.items ?? []).map(mapVideo);
}

/** Abonnés de chaînes par lots (channels.list part=statistics, 1 u/lot). */
export async function getChannelsSubsMap(
  channelIds: string[],
): Promise<Map<string, number | undefined>> {
  const map = new Map<string, number | undefined>();
  const uniq = [...new Set(channelIds.filter(Boolean))];
  for (let i = 0; i < uniq.length; i += 50) {
    const batch = uniq.slice(i, i + 50);
    const d = await ytGet(
      "channels",
      { part: "statistics", id: batch.join(",") },
      1,
    );
    for (const it of d.items ?? [])
      map.set(it.id, numOrUndef(it.statistics?.subscriberCount));
  }
  return map;
}

/** Résout une chaîne + ses N dernières vidéos. Caché (TTL chaîne 12 h). */
export async function getChannelWithVideos(
  ref: string,
  opts: { max?: number; accessToken?: string } = {},
): Promise<{ channel: ChannelSnapshot; videos: YtVideo[] } | null> {
  const max = opts.max ?? 60;
  const key = `channel:${CACHE_V}:${ref}:${max}`;
  return withCache(key, TTL.channel, async () => {
    const channel = await resolveChannel(ref, opts.accessToken);
    if (!channel) return null;
    if (!channel.uploadsPlaylistId) return { channel, videos: [] };
    const ids = await getUploadVideoIds(
      channel.uploadsPlaylistId,
      max,
      opts.accessToken,
    );
    const videos = await getVideosByIds(ids, opts.accessToken);
    return { channel, videos };
  });
}
