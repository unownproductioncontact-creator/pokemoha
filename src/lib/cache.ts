// Cache applicatif (§3/§4) — withCache(key, ttlMs, fn), enveloppes TTL.
// Persistance via kvStore : fichiers .cache/ en local, Postgres Neon si
// DATABASE_URL (Render). Serveur uniquement : ne jamais importer côté client.

import { kvGet, kvSet, kvEntries, kvDelete } from './kvStore';
import type { CacheEntryInfo } from './types';

const PREFIX = 'cache:';

interface CacheEnvelope<T> {
  key: string;
  savedAt: number;
  ttlMs: number;
  value: T;
}

function parseEnvelope<T>(raw: string | null): CacheEnvelope<T> | undefined {
  if (!raw) return undefined;
  try {
    const env = JSON.parse(raw) as CacheEnvelope<T>;
    if (typeof env.savedAt !== 'number' || typeof env.ttlMs !== 'number')
      return undefined;
    return env;
  } catch {
    return undefined;
  }
}

/** Lecture brute : renvoie undefined si absent ou périmé. */
export async function getCache<T>(key: string): Promise<T | undefined> {
  const env = parseEnvelope<T>(await kvGet(PREFIX + key));
  if (!env) return undefined;
  if (env.ttlMs > 0 && Date.now() - env.savedAt > env.ttlMs) return undefined;
  return env.value;
}

export async function setCache<T>(key: string, value: T, ttlMs: number): Promise<void> {
  const env: CacheEnvelope<T> = { key, savedAt: Date.now(), ttlMs, value };
  await kvSet(PREFIX + key, JSON.stringify(env));
}

// Dédup des calculs concurrents sur une même clé (anti-stampede) : si deux
// requêtes ratent le cache en même temps pour la même clé, une seule appelle
// réellement fn() — protège le quota YouTube (§2 : "cache agressif").
const inflight = new Map<string, Promise<unknown>>();

/** Mémo persistante : sert le cache frais, sinon exécute fn et le stocke. */
export async function withCache<T>(
  key: string,
  ttlMs: number,
  fn: () => Promise<T>,
): Promise<T> {
  const hit = await getCache<T>(key);
  if (hit !== undefined) return hit;

  const existing = inflight.get(key) as Promise<T> | undefined;
  if (existing) return existing;

  const promise = (async () => {
    try {
      const value = await fn();
      await setCache(key, value, ttlMs);
      return value;
    } finally {
      inflight.delete(key);
    }
  })();
  inflight.set(key, promise);
  return promise;
}

/** Métadonnées d'une entrée (Diagnostic), sans exposer la valeur. */
export async function cacheInfo(
  key: string,
): Promise<{ exists: boolean; savedAt?: number; ttlMs?: number; fresh?: boolean }> {
  const env = parseEnvelope<unknown>(await kvGet(PREFIX + key));
  if (!env) return { exists: false };
  const fresh = env.ttlMs <= 0 || Date.now() - env.savedAt <= env.ttlMs;
  return { exists: true, savedAt: env.savedAt, ttlMs: env.ttlMs, fresh };
}

// TTL recommandés (ms) — §3. Bumpe la VERSION de la clé quand la forme change.
export const TTL = {
  trends: 3 * 3_600_000, //  3 h
  channel: 12 * 3_600_000, // 12 h
  competitor: 12 * 3_600_000, // 12 h
  world: 20 * 3_600_000, // 20 h
  niche: 24 * 3_600_000, // 24 h
} as const;

/** Liste les entrées de cache (Historique). Les états (tokens/concurrents/
 *  inspirations) vivent sous `state:` et ne sont pas listés ici. Nettoie au
 *  passage les entrées périmées (pas de cron : kv_state ne grossirait sinon
 *  jamais tout seul). */
export async function listCacheEntries(): Promise<CacheEntryInfo[]> {
  const entries = await kvEntries(PREFIX);
  const out: CacheEntryInfo[] = [];
  const stale: string[] = [];
  for (const e of entries) {
    const env = parseEnvelope<unknown>(e.value);
    if (!env) continue;
    const fresh = env.ttlMs <= 0 || Date.now() - env.savedAt <= env.ttlMs;
    if (!fresh) stale.push(e.key);
    out.push({
      key: env.key ?? e.key.slice(PREFIX.length),
      savedAt: env.savedAt,
      ttlMs: env.ttlMs,
      fresh,
      sizeBytes: e.value.length,
    });
  }
  if (stale.length) {
    void Promise.all(stale.map((k) => kvDelete(k))).catch(() => {});
  }
  out.sort((a, b) => b.savedAt - a.savedAt);
  return out;
}
