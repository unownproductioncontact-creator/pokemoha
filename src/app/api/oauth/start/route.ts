import { NextResponse, type NextRequest } from "next/server";
import { buildConsentUrl } from "@/lib/oauthUrl";
import { hasOAuthConfig, env } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;

  if (!hasOAuthConfig()) {
    // Pas de JSON brut : on renvoie vers Paramètres avec un message lisible.
    const reason =
      "OAuth non configuré — ajoute GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET dans .env.local, puis relance le serveur.";
    return NextResponse.redirect(
      `${origin}/parametres?oauth=error&reason=${encodeURIComponent(reason)}`,
    );
  }

  const redirectUri = `${origin}/api/oauth/callback`;
  const state = crypto.randomUUID();
  const url = buildConsentUrl({
    clientId: env().googleClientId,
    redirectUri,
    state,
  });

  const res = NextResponse.redirect(url);
  // Cookie anti-CSRF, vérifié au retour.
  res.cookies.set("kiibiki_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return res;
}
