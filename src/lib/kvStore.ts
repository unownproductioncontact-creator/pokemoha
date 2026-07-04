// Couche de persistance clé→valeur (pattern masterball-dashboard) :
//  • par défaut : fichiers dans .cache/ (100% local, zéro dépendance)
//  • si DATABASE_URL est présent (déploiement Render) : Postgres Neon,
//    table kv_state (key TEXT PRIMARY KEY, value TEXT) → survit aux
//    redéploiements (le disque Render free est éphémère).
//
// Contrat IMPORTANT : kvGet renvoie `null` UNIQUEMENT si la clé est CONFIRMÉE
// absente (ligne inexistante / fichier ENOENT). Toute panne (Neon indisponible,
// timeout, JSON illisible) est levée via KvUnavailableError plutôt que masquée
// en `null` — sinon un hoquet réseau transitoire est indistinguable d'un
// "jamais initialisé", et un store peut écraser un état existant en croyant
// qu'il n'y a encore rien à sauvegarder (voir oauthStore/competitorStore/
// inspirationStore, qui exploitent cette distinction pour ne jamais écrire
// par-dessus une lecture ambiguë).
// Serveur uniquement.

import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { neon } from '@neondatabase/serverless';

const DIR = path.join(process.cwd(), '.cache');
const NEON_TIMEOUT_MS = 8000;

export function pgConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export class KvUnavailableError extends Error {
  constructor(op: string, cause?: unknown) {
    super(
      `kvStore indisponible (${op})` +
        (cause instanceof Error ? `: ${cause.message}` : ''),
    );
    this.name = 'KvUnavailableError';
  }
}

function withTimeout<T>(p: Promise<T>, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(
      () => reject(new Error(`timeout ${label} (${NEON_TIMEOUT_MS}ms)`)),
      NEON_TIMEOUT_MS,
    );
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

/** Verrou en mémoire process, par clé — sérialise les read-modify-write d'un
 *  même store. Suffisant en pratique : Render free = 1 seule instance. */
const keyQueues = new Map<string, Promise<unknown>>();
export function withKeyLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const prev = keyQueues.get(key) ?? Promise.resolve();
  const run = prev.then(fn, fn);
  keyQueues.set(
    key,
    run.then(
      () => undefined,
      () => undefined,
    ),
  );
  return run;
}

// ───────────── Backend Postgres (Neon serverless, HTTP) ─────────────

type NeonSql = ReturnType<typeof neon>;
let neonClient: NeonSql | null = null;
let tableReady: Promise<void> | null = null;

function sql(): NeonSql {
  if (!neonClient) neonClient = neon(process.env.DATABASE_URL as string);
  return neonClient;
}

function ensureTable(): Promise<void> {
  if (!tableReady) {
    tableReady = withTimeout(
      sql()`
        CREATE TABLE IF NOT EXISTS kv_state (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        )
      `,
      'ensureTable',
    ).then(
      () => undefined,
      (e) => {
        tableReady = null; // retente au prochain appel
        throw e;
      },
    );
  }
  return tableReady;
}

// ───────────── Backend fichiers (.cache/) ─────────────

function keyToFile(key: string): string {
  const hash = createHash('sha256').update(key).digest('hex').slice(0, 32);
  return path.join(DIR, `kv-${hash}.json`);
}

/** Écriture atomique (tmp + rename) : évite un JSON tronqué en cas de crash
 *  pendant l'écriture, qui déclencherait sinon une "erreur ambiguë" au
 *  prochain kvGet (voir le contrat de kvGet ci-dessus). */
async function atomicWriteFile(file: string, data: string): Promise<void> {
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, data, 'utf8');
  await fs.rename(tmp, file);
}

interface FileWrapper {
  k: string;
  v: string;
}

// ───────────── API ─────────────

export async function kvGet(key: string): Promise<string | null> {
  if (pgConfigured()) {
    try {
      await ensureTable();
      const rows = (await withTimeout(
        sql()`SELECT value FROM kv_state WHERE key = ${key}`,
        'kvGet',
      )) as { value: string }[];
      return rows[0]?.value ?? null; // confirmé absent
    } catch (e) {
      console.error('[kvStore] kvGet pg:', e instanceof Error ? e.message : e);
      throw new KvUnavailableError('kvGet', e);
    }
  }
  let raw: string;
  try {
    raw = await fs.readFile(keyToFile(key), 'utf8');
  } catch (e) {
    if ((e as NodeJS.ErrnoException)?.code === 'ENOENT') return null; // confirmé absent
    console.error('[kvStore] kvGet fs read:', e instanceof Error ? e.message : e);
    throw new KvUnavailableError('kvGet', e);
  }
  try {
    const w = JSON.parse(raw) as FileWrapper;
    return typeof w.v === 'string' ? w.v : null;
  } catch (e) {
    // JSON corrompu : ambigu, surtout pas "absent" (éviterait un re-seed destructeur).
    console.error('[kvStore] kvGet fs parse:', e instanceof Error ? e.message : e);
    throw new KvUnavailableError('kvGet', e);
  }
}

export async function kvSet(key: string, value: string): Promise<boolean> {
  if (pgConfigured()) {
    try {
      await ensureTable();
      await withTimeout(
        sql()`
          INSERT INTO kv_state (key, value) VALUES (${key}, ${value})
          ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
        `,
        'kvSet',
      );
      return true;
    } catch (e) {
      console.error('[kvStore] kvSet pg:', e instanceof Error ? e.message : e);
      return false;
    }
  }
  try {
    await fs.mkdir(DIR, { recursive: true });
    const w: FileWrapper = { k: key, v: value };
    await atomicWriteFile(keyToFile(key), JSON.stringify(w));
    return true;
  } catch (e) {
    console.error('[kvStore] kvSet fs:', e instanceof Error ? e.message : e);
    return false;
  }
}

export async function kvDelete(key: string): Promise<void> {
  if (pgConfigured()) {
    try {
      await ensureTable();
      await withTimeout(sql()`DELETE FROM kv_state WHERE key = ${key}`, 'kvDelete');
    } catch (e) {
      console.error('[kvStore] kvDelete pg:', e instanceof Error ? e.message : e);
    }
    return;
  }
  try {
    await fs.unlink(keyToFile(key));
  } catch {
    /* déjà absent */
  }
}

/** Toutes les entrées dont la clé commence par `prefix` (Historique). Fail-safe
 *  (liste vide sur panne) : lecture d'affichage, jamais destructrice. */
export async function kvEntries(
  prefix = '',
): Promise<{ key: string; value: string }[]> {
  if (pgConfigured()) {
    try {
      await ensureTable();
      const rows = (await withTimeout(
        sql()`SELECT key, value FROM kv_state WHERE key LIKE ${prefix + '%'}`,
        'kvEntries',
      )) as { key: string; value: string }[];
      return rows;
    } catch (e) {
      console.error('[kvStore] kvEntries pg:', e instanceof Error ? e.message : e);
      return [];
    }
  }
  try {
    const files = await fs.readdir(DIR);
    const out: { key: string; value: string }[] = [];
    for (const f of files) {
      if (!f.startsWith('kv-') || !f.endsWith('.json')) continue;
      try {
        const raw = await fs.readFile(path.join(DIR, f), 'utf8');
        const w = JSON.parse(raw) as FileWrapper;
        if (typeof w.k === 'string' && typeof w.v === 'string' && w.k.startsWith(prefix)) {
          out.push({ key: w.k, value: w.v });
        }
      } catch {
        /* fichier étranger : ignore */
      }
    }
    return out;
  } catch {
    return [];
  }
}
