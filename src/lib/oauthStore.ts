// Store de tokens OAuth, un par chaîne (§3). Persistance via kvStore :
// fichiers .cache/ en local, Postgres Neon si DATABASE_URL (Render).
// Serveur uniquement.
//
// ⚠️ read() distingue trouvé / vide-confirmé / erreur (kvGet throw sur panne) :
// une panne Neon transitoire ne doit jamais faire écrire un état vide par-dessus
// des tokens existants (readForMutation() lève plutôt que de continuer).

import { kvGet, kvSet, withKeyLock } from './kvStore';

const KEY = 'state:oauth-tokens';

export interface OAuthToken {
  channelId: string;
  channelTitle?: string;
  handle?: string;
  accessToken: string;
  refreshToken?: string;
  scope?: string;
  tokenType?: string;
  /** epoch ms d'expiration de l'access_token. */
  expiresAt: number;
  obtainedAt: number;
}

interface Store {
  version: number;
  tokens: Record<string, OAuthToken>;
}

const EMPTY: Store = { version: 1, tokens: {} };

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
    return s.tokens ? { status: 'found', store: s } : { status: 'empty' };
  } catch {
    return { status: 'error' }; // JSON corrompu : ambigu, pas "vide"
  }
}

/** Pour l'affichage (getToken/listTokens) : dégrade en liste vide sur panne,
 *  ne persiste jamais rien. */
async function readForList(): Promise<Store> {
  const r = await readOutcome();
  return r.status === 'found' ? r.store : EMPTY;
}

/** Pour une écriture : une panne/ambiguïté lève plutôt que de laisser
 *  saveToken()/deleteToken() écrire un état vide par-dessus des tokens réels. */
async function readForMutation(): Promise<Store> {
  const r = await readOutcome();
  if (r.status === 'found') return r.store;
  if (r.status === 'empty') return { version: 1, tokens: {} };
  throw new Error('Stockage des connexions indisponible — réessaie.');
}

async function write(s: Store): Promise<void> {
  const ok = await kvSet(KEY, JSON.stringify(s));
  if (!ok) throw new Error('Échec de sauvegarde du token OAuth (stockage indisponible).');
}

export async function saveToken(token: OAuthToken): Promise<void> {
  return withKeyLock(KEY, async () => {
    const s = await readForMutation();
    const prev = s.tokens[token.channelId];
    // Google ne renvoie le refresh_token qu'au 1er consentement : on conserve l'ancien.
    s.tokens[token.channelId] = {
      ...token,
      refreshToken: token.refreshToken ?? prev?.refreshToken,
    };
    await write(s);
  });
}

export async function getToken(
  channelId: string,
): Promise<OAuthToken | undefined> {
  return (await readForList()).tokens[channelId];
}

export async function listTokens(): Promise<OAuthToken[]> {
  return Object.values((await readForList()).tokens);
}

export async function deleteToken(channelId: string): Promise<void> {
  return withKeyLock(KEY, async () => {
    const s = await readForMutation();
    delete s.tokens[channelId];
    await write(s);
  });
}
