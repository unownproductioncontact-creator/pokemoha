// Inspirations sauvegardées (§5). Persistance via kvStore : fichiers .cache/
// en local, Postgres Neon si DATABASE_URL (Render). Serveur uniquement.
//
// ⚠️ Même garde-fou que oauthStore/competitorStore : une panne de lecture ne
// doit jamais faire écrire une liste vide par-dessus des inspirations réelles.

import { kvGet, kvSet, withKeyLock } from './kvStore';

const KEY = 'state:inspirations';

export interface Inspiration {
  id: string; // = videoId (dédup)
  videoId: string;
  title: string;
  channelTitle?: string;
  ratio?: number;
  thumb?: string;
  url: string;
  note?: string;
  savedAt: number;
}

interface Store {
  version: number;
  items: Inspiration[];
}

type Outcome =
  | { status: 'found'; store: Store }
  | { status: 'empty' }
  | { status: 'error' };

async function readOutcome(): Promise<Outcome> {
  let raw: string | null;
  try {
    raw = await kvGet(KEY);
  } catch {
    return { status: 'error' };
  }
  if (!raw) return { status: 'empty' };
  try {
    const s = JSON.parse(raw) as Store;
    return s.items ? { status: 'found', store: s } : { status: 'empty' };
  } catch {
    return { status: 'error' };
  }
}

/** Pour l'affichage : dégrade en liste vide sur panne, rien n'est persisté. */
async function readForList(): Promise<Store> {
  const r = await readOutcome();
  return r.status === 'found' ? r.store : { version: 1, items: [] };
}

/** Pour une écriture : une panne lève plutôt que d'écraser des inspirations
 *  réelles avec une liste vide reconstituée à tort. */
async function readForMutation(): Promise<Store> {
  const r = await readOutcome();
  if (r.status === 'found') return r.store;
  if (r.status === 'empty') return { version: 1, items: [] };
  throw new Error('Stockage des inspirations indisponible — réessaie.');
}

async function write(s: Store): Promise<void> {
  const ok = await kvSet(KEY, JSON.stringify(s));
  if (!ok) throw new Error('Échec de sauvegarde de l’inspiration (stockage indisponible).');
}

export async function listInspirations(): Promise<Inspiration[]> {
  return (await readForList()).items;
}

export async function addInspiration(
  i: Omit<Inspiration, 'id' | 'savedAt'>,
): Promise<Inspiration> {
  return withKeyLock(KEY, async () => {
    const s = await readForMutation();
    const item: Inspiration = { ...i, id: i.videoId, savedAt: Date.now() };
    if (!s.items.some((x) => x.id === item.id)) {
      s.items.unshift(item);
      await write(s);
    }
    return item;
  });
}

export async function removeInspiration(id: string): Promise<void> {
  return withKeyLock(KEY, async () => {
    const s = await readForMutation();
    s.items = s.items.filter((i) => i.id !== id);
    await write(s);
  });
}
