// Protection par mot de passe (pattern masterball-dashboard), pour l'hébergement.
// DASHBOARD_PASSWORD vide (défaut local) → aucun changement, tout passe.
// Sinon : Basic Auth (boîte de dialogue du navigateur) → cookie de session
// signé HMAC avec expiration VÉRIFIÉE côté serveur (60 j, non glissante),
// comparaison à temps constant, verrou anti-bruteforce 10 essais / 15 min.
//
// Crypto via Web Crypto (crypto.subtle) — disponible EN NODE COMME EN EDGE, donc
// portable sur tout hébergeur (Render/Node, Vercel Edge ou Node, Cloudflare…).
// Le proxy est asynchrone (Web Crypto l'est).

import { NextResponse, type NextRequest } from 'next/server';

const COOKIE = 'pkm_auth';
const SESSION_MAX_AGE_S = 60 * 24 * 3600; // 60 jours, fixe (vérifié côté serveur)
const AUTH_MAX_FAILS = 10;
const AUTH_LOCK_MS = 15 * 60_000;

const authFails = new Map<string, { count: number; until: number }>();
const TE = new TextEncoder();

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Comparaison à temps constant de deux chaînes de MÊME longueur. */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function sha256Hex(s: string): Promise<string> {
  return toHex(await crypto.subtle.digest('SHA-256', TE.encode(s)));
}

/** Compare le mot de passe saisi au mot de passe attendu à temps constant
 *  (on compare les empreintes SHA-256 pour ne pas fuiter la longueur). */
async function safeEqualPw(given: string, expected: string): Promise<boolean> {
  const [ga, gb] = await Promise.all([sha256Hex(given), sha256Hex(expected)]);
  return constantTimeEqual(ga, gb);
}

/**
 * Secret de signature des sessions. SESSION_SECRET (recommandé en hébergement,
 * généré une fois avec `openssl rand -hex 32`) est indépendant du mot de passe :
 * un cookie volé ne permet alors pas de retrouver DASHBOARD_PASSWORD hors-ligne.
 * À défaut, repli sur une dérivation du mot de passe (moins bien, mais la
 * session reste quand même bornée par une expiration vérifiée côté serveur).
 */
function sessionSecret(pw: string): string {
  return process.env.SESSION_SECRET || `pokemoha-fallback|${pw}`;
}

async function hmacHex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    TE.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return toHex(await crypto.subtle.sign('HMAC', key, TE.encode(payload)));
}

/** Cookie = "<issuedAt>.<signature>" — l'expiration est recalculée à CHAQUE
 *  requête à partir de issuedAt, indépendamment du maxAge (côté client) du
 *  cookie. Session non glissante : expire réellement 60 j après connexion. */
async function makeSessionCookie(pw: string): Promise<string> {
  const issuedAt = Date.now();
  return `${issuedAt}.${await hmacHex(sessionSecret(pw), String(issuedAt))}`;
}

async function verifySessionCookie(
  pw: string,
  cookie: string | undefined,
): Promise<boolean> {
  if (!cookie) return false;
  const dot = cookie.indexOf('.');
  if (dot < 0) return false;
  const issuedAtStr = cookie.slice(0, dot);
  const sig = cookie.slice(dot + 1);
  const issuedAt = Number(issuedAtStr);
  if (!Number.isFinite(issuedAt) || issuedAt <= 0) return false;
  if (Date.now() - issuedAt > SESSION_MAX_AGE_S * 1000) return false; // expiration serveur
  const expected = await hmacHex(sessionSecret(pw), issuedAtStr);
  return constantTimeEqual(sig, expected);
}

export default async function proxy(req: NextRequest) {
  const pw = process.env.DASHBOARD_PASSWORD ?? '';
  if (!pw) {
    // En hébergement, un mot de passe manquant NE DOIT PAS rendre l'app
    // publique par défaut (oubli de variable d'env) : on bloque plutôt que de
    // fail-open. En local (`next dev`), rien ne change.
    if (process.env.NODE_ENV === 'production') {
      return new NextResponse(
        "DASHBOARD_PASSWORD manquant : configure cette variable dans les paramètres de ton hébergeur pour activer l'accès.",
        { status: 503 },
      );
    }
    return NextResponse.next();
  }

  // 1) Cookie de session valide (signature + expiration vérifiées côté serveur).
  if (await verifySessionCookie(pw, req.cookies.get(COOKIE)?.value)) {
    return NextResponse.next();
  }

  const ip = (req.headers.get('x-forwarded-for') ?? 'local').split(',')[0].trim();
  const now = Date.now();
  const f = authFails.get(ip);
  if (f && f.count >= AUTH_MAX_FAILS && now < f.until) {
    return new NextResponse('Trop de tentatives — réessaie plus tard.', {
      status: 429,
      headers: { 'Retry-After': String(Math.ceil((f.until - now) / 1000)) },
    });
  }

  // 2) Basic Auth (le navigateur affiche sa boîte de dialogue).
  const hdr = req.headers.get('authorization') ?? '';
  if (hdr.startsWith('Basic ')) {
    let given = '';
    try {
      // atob() est dispo en Node comme en Edge (pas de Buffer, non portable Edge).
      const decoded = atob(hdr.slice(6));
      given = decoded.slice(decoded.indexOf(':') + 1);
    } catch {
      /* en-tête illisible → traité comme échec */
    }
    if (given && (await safeEqualPw(given, pw))) {
      authFails.delete(ip);
      const res = NextResponse.next();
      res.cookies.set(COOKIE, await makeSessionCookie(pw), {
        httpOnly: true,
        sameSite: 'lax',
        secure: req.nextUrl.protocol === 'https:',
        maxAge: SESSION_MAX_AGE_S,
        path: '/',
      });
      return res;
    }
    // Échec réel (mauvais mot de passe) → compteur anti-bruteforce.
    const prev = f && now < f.until + AUTH_LOCK_MS ? f.count : 0;
    authFails.set(ip, { count: prev + 1, until: now + AUTH_LOCK_MS });
  }

  // 3) Défi Basic Auth.
  return new NextResponse('Authentification requise', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Pokemoha"' },
  });
}

export const config = {
  // Tout protéger SAUF : assets Next, favicon, keep-alive public et fichiers PWA
  // (manifest + icônes, requis pour l'installation sans session).
  matcher: [
    '/((?!_next/|favicon\\.ico|healthz|manifest\\.webmanifest|icon$|apple-icon$).*)',
  ],
};
