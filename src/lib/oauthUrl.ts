// Construction d'URL OAuth Google (§2). PUR & testable (aucun I/O).

export const OAUTH_SCOPES = [
  "https://www.googleapis.com/auth/yt-analytics.readonly",
  "https://www.googleapis.com/auth/yt-analytics-monetary.readonly",
  "https://www.googleapis.com/auth/youtube.readonly",
];

export const GOOGLE_AUTH_ENDPOINT =
  "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";

/** URL de consentement. access_type=offline + prompt=consent → refresh_token. */
export function buildConsentUrl(opts: {
  clientId: string;
  redirectUri: string;
  state?: string;
  scopes?: string[];
}): string {
  const params = new URLSearchParams({
    client_id: opts.clientId,
    redirect_uri: opts.redirectUri,
    response_type: "code",
    access_type: "offline",
    include_granted_scopes: "true",
    prompt: "consent",
    scope: (opts.scopes ?? OAUTH_SCOPES).join(" "),
  });
  if (opts.state) params.set("state", opts.state);
  return `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`;
}

/** Corps x-www-form-urlencoded pour l'échange code → token. */
export function buildTokenExchangeBody(opts: {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}): string {
  return new URLSearchParams({
    code: opts.code,
    client_id: opts.clientId,
    client_secret: opts.clientSecret,
    redirect_uri: opts.redirectUri,
    grant_type: "authorization_code",
  }).toString();
}

/** Corps pour le rafraîchissement d'un access_token via refresh_token. */
export function buildTokenRefreshBody(opts: {
  refreshToken: string;
  clientId: string;
  clientSecret: string;
}): string {
  return new URLSearchParams({
    refresh_token: opts.refreshToken,
    client_id: opts.clientId,
    client_secret: opts.clientSecret,
    grant_type: "refresh_token",
  }).toString();
}
