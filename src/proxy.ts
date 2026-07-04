// Protection par mot de passe (pattern masterball-dashboard), pour l'hébergement.
// DASHBOARD_PASSWORD vide (défaut local) → aucun changement, tout passe.
// Sinon : Basic Auth (boîte de dialogue du navigateur) → cookie de session
// signé HMAC avec expiration VÉRIFIÉE côté serveur (60 j, non glissante),
// comparaison à temps constant, verrou anti-bruteforce 10 essais / 15 min.
// Next 16 : ce fichier remplace middleware.ts et tourne en runtime Node.js.

import { NextResponse, type NextRequest } from 'next/server';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

const COOKIE = 'pkm_auth';
const SESSION_MAX_AGE_S = 60 * 24 * 3600; // 60 jours, fixe (vérifié côté serveur)
const AUTH_MAX_FAILS = 10;
const AUTH_LOCK_MS = 15 * 60_000;

const authFails = new Map<string, { count: number; until: number }>();

function sha(s: string): Buffer {
  return createHash('sha256').update(s).digest();
}
/** Comparaison du mot de passe saisi (Basic Auth) à temps constant. */
function safeEqual(a: string, b: string): boolean {
  return timingSafeEqual(sha(a), sha(b));
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

function sign(secret: string, payload: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

/** Cookie = "<issuedAt>.<signature>" — l'expiration est recalculée à CHAQUE
 *  requête à partir de issuedAt, indépendamment du maxAge (côté client) du
 *  cookie. Session non glissante : expire réellement 60 j après connexion. */
function makeSessionCookie(pw: string): string {
  const issuedAt = Date.now();
  return `${issuedAt}.${sign(sessionSecret(pw), String(issuedAt))}`;
}

function verifySessionCookie(pw: string, cookie: string | undefined): boolean {
  if (!cookie) return false;
  const dot = cookie.indexOf('.');
  if (dot < 0) return false;
  const issuedAtStr = cookie.slice(0, dot);
  const sig = cookie.slice(dot + 1);
  const issuedAt = Number(issuedAtStr);
  if (!Number.isFinite(issuedAt) || issuedAt <= 0) return false;
  if (Date.now() - issuedAt > SESSION_MAX_AGE_S * 1000) return false; // expiration serveur
  const expected = sign(sessionSecret(pw), issuedAtStr);
  try {
    return (
      sig.length === expected.length &&
      timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'))
    );
  } catch {
    return false;
  }
}

export default function proxy(req: NextRequest) {
  const pw = process.env.DASHBOARD_PASSWORD ?? '';
  if (!pw) {
    // En hébergement, un mot de passe manquant NE DOIT PAS rendre l'app
    // publique par défaut (oubli de variable d'env sur Render) : on bloque
    // plutôt que de fail-open. En local (`next dev`), rien ne change.
    if (process.env.NODE_ENV === 'production') {
      return new NextResponse(
        "DASHBOARD_PASSWORD manquant : configure cette variable dans les paramètres de ton hébergeur pour activer l'accès.",
        { status: 503 },
      );
    }
    return NextResponse.next();
  }

  // 1) Cookie de session valide (signature + expiration vérifiées côté serveur).
  if (verifySessionCookie(pw, req.cookies.get(COOKIE)?.value)) {
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
      const decoded = Buffer.from(hdr.slice(6), 'base64').toString('utf8');
      given = decoded.slice(decoded.indexOf(':') + 1);
    } catch {
      /* en-tête illisible → traité comme échec */
    }
    if (given && safeEqual(given, pw)) {
      authFails.delete(ip);
      const res = NextResponse.next();
      res.cookies.set(COOKIE, makeSessionCookie(pw), {
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
