// Échange / rafraîchissement de tokens OAuth Google (§2). Serveur uniquement.

import {
  GOOGLE_TOKEN_ENDPOINT,
  buildTokenExchangeBody,
  buildTokenRefreshBody,
} from "./oauthUrl";
import { env } from "./env";
import { getToken, saveToken, type OAuthToken } from "./oauthStore";

export interface TokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
}

export async function exchangeCodeForToken(
  code: string,
  redirectUri: string,
): Promise<TokenResponse> {
  const { googleClientId, googleClientSecret } = env();
  const res = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: buildTokenExchangeBody({
      code,
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      redirectUri,
    }),
  });
  if (!res.ok) {
    throw new Error(`Échange OAuth échoué (${res.status}) : ${await res.text()}`);
  }
  return (await res.json()) as TokenResponse;
}

export async function refreshAccessToken(
  refreshToken: string,
): Promise<TokenResponse> {
  const { googleClientId, googleClientSecret } = env();
  const res = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: buildTokenRefreshBody({
      refreshToken,
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    }),
  });
  if (!res.ok) {
    throw new Error(
      `Rafraîchissement OAuth échoué (${res.status}) : ${await res.text()}`,
    );
  }
  return (await res.json()) as TokenResponse;
}

/** access_token valide pour une chaîne (rafraîchit si expiré). null si non connectée. */
export async function getValidAccessToken(
  channelId: string,
): Promise<string | null> {
  const tok = await getToken(channelId);
  if (!tok) return null;
  if (Date.now() < tok.expiresAt - 60_000) return tok.accessToken;
  if (!tok.refreshToken) return null;
  const refreshed = await refreshAccessToken(tok.refreshToken);
  const now = Date.now();
  const updated: OAuthToken = {
    ...tok,
    accessToken: refreshed.access_token,
    refreshToken: refreshed.refresh_token ?? tok.refreshToken,
    expiresAt: now + (refreshed.expires_in ?? 3600) * 1000,
    obtainedAt: now,
  };
  await saveToken(updated);
  return updated.accessToken;
}
