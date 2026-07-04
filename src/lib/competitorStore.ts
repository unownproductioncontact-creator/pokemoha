// Store persistant des concurrents (§5). Persistance via kvStore : fichiers
// .cache/ en local, Postgres Neon si DATABASE_URL (Render). Seedé depuis
// config/competitors.ts au premier accès CONFIRMÉ vide. Serveur uniquement.
//
// ⚠️ Le seed automatique ne doit se déclencher QUE sur une absence confirmée
// (kvGet renvoie null), jamais sur une erreur de lecture (Neon indisponible) —
// sinon un hoquet réseau transitoire écrase silencieusement les concurrents
// déjà ajoutés par un re-seed depuis la config par défaut.

import { kvGet, kvSet, withKeyLock } from './kvStore';
import { COMPETITORS } from '@/config/competitors';
import type { CompetitorDef } from './types';

const KEY = 'state:competitors';

export interface StoredCompetitor extends CompetitorDef {
  id: string;
  addedAt: number;
}

interface Store {
  version: number;
  items: StoredCompetitor[];
}

type Outcome =
  | { status: 'found'; store: Store }
  | { status: 'empty' }
  | { status: 'error' };

function slug(ref: string): string {
  return (
    ref
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || 'c'
  );
}

function uniqueId(base: string, items: StoredCompetitor[]): string {
  let id = base;
  let n = 2;
  while (items.some((i) => i.id === id)) id = `${base}-${n++}`;
  return id;
}

function seedStore(): Store {
  const items: StoredCompetitor[] = [];
  for (const c of COMPETITORS) {
    items.push({ ...c, id: uniqueId(slug(c.ref), items), addedAt: 0 });
  }
  return { version: 1, items };
}

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

async function write(s: Store): Promise<void> {
  const ok = await kvSet(KEY, JSON.stringify(s));
  if (!ok) throw new Error('Échec de sauvegarde des concurrents (stockage indisponible).');
}

/** Pour l'affichage : dégrade en liste vide sur panne (rien n'est persisté).
 *  Sur absence CONFIRMÉE, seede depuis la config et persiste (comportement
 *  historique, mais protégé de la fausse "absence" causée par une erreur). */
async function readForList(): Promise<Store> {
  const r = await readOutcome();
  if (r.status === 'found') return r.store;
  if (r.status === 'error') return { version: 1, items: [] };
  const seeded = seedStore();
  await write(seeded);
  return seeded;
}

/** Pour une écriture (add/remove) : une panne lève plutôt que d'opérer sur un
 *  état vide qui écraserait ensuite les concurrents réels au write(). */
async function readForMutation(): Promise<Store> {
  const r = await readOutcome();
  if (r.status === 'found') return r.store;
  if (r.status === 'error')
    throw new Error('Stockage des concurrents indisponible — réessaie.');
  const seeded = seedStore();
  await write(seeded);
  return seeded;
}

export async function listCompetitors(): Promise<StoredCompetitor[]> {
  return (await readForList()).items;
}

export async function getCompetitor(
  id: string,
): Promise<StoredCompetitor | undefined> {
  return (await readForList()).items.find((i) => i.id === id);
}

export async function addCompetitor(
  ref: string,
  label?: string,
  nicheId?: string,
): Promise<StoredCompetitor> {
  return withKeyLock(KEY, async () => {
    const s = await readForMutation();
    const existing = s.items.find(
      (i) => i.ref.toLowerCase() === ref.toLowerCase(),
    );
    if (existing) return existing;
    const item: StoredCompetitor = {
      id: uniqueId(slug(ref), s.items),
      ref,
      label: label ?? ref,
      nicheId,
      addedAt: Date.now(),
    };
    s.items.push(item);
    await write(s);
    return item;
  });
}

export async function removeCompetitor(id: string): Promise<void> {
  return withKeyLock(KEY, async () => {
    const s = await readForMutation();
    s.items = s.items.filter((i) => i.id !== id);
    await write(s);
  });
}
