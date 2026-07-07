import type { NextRequest } from "next/server";

/**
 * Origine PUBLIQUE de la requête. Derrière un proxy (Render, etc.),
 * `req.nextUrl.origin` renvoie l'hôte INTERNE (ex. https://localhost:10000) →
 * on privilégie les en-têtes `x-forwarded-*` posés par le proxy avec le vrai
 * domaine. Indispensable pour l'URI de redirection OAuth, qui doit correspondre
 * EXACTEMENT à celle enregistrée côté Google (sinon redirect_uri_mismatch).
 * En local (pas de proxy), l'en-tête Host suffit et vaut localhost:3000.
 */
export function publicOrigin(req: NextRequest): string {
  const proto = req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const host =
    req.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    req.headers.get("host")?.trim();
  if (host) return `${proto || "https"}://${host}`;
  return req.nextUrl.origin;
}
