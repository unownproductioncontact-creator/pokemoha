import { NextResponse, type NextRequest } from "next/server";
import { exchangeCodeForToken } from "@/lib/googleOAuth";
import { getMyChannels } from "@/lib/youtube";
import { saveToken } from "@/lib/oauthStore";
import { OAUTH_SCOPES } from "@/lib/oauthUrl";

export const dynamic = "force-dynamic";

function back(origin: string, params: Record<string, string>): NextResponse {
  const qs = new URLSearchParams(params).toString();
  return NextResponse.redirect(`${origin}/parametres?${qs}`);
}

export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;

  const oauthError = searchParams.get("error");
  if (oauthError) return back(origin, { oauth: "error", reason: oauthError });

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const cookieState = req.cookies.get("kiibiki_oauth_state")?.value;

  if (!code) return back(origin, { oauth: "error", reason: "nocode" });
  if (!state || state !== cookieState)
    return back(origin, { oauth: "error", reason: "state" });

  try {
    const redirectUri = `${origin}/api/oauth/callback`;
    const tok = await exchangeCodeForToken(code, redirectUri);
    const channels = await getMyChannels(tok.access_token);
    if (channels.length === 0)
      return back(origin, { oauth: "error", reason: "nochannel" });

    const now = Date.now();
    for (const ch of channels) {
      await saveToken({
        channelId: ch.channelId,
        channelTitle: ch.title,
        handle: ch.handle,
        accessToken: tok.access_token,
        refreshToken: tok.refresh_token,
        scope: tok.scope ?? OAUTH_SCOPES.join(" "),
        tokenType: tok.token_type,
        expiresAt: now + (tok.expires_in ?? 3600) * 1000,
        obtainedAt: now,
      });
    }

    const res = back(origin, { oauth: "ok", channel: channels[0].title });
    res.cookies.delete("kiibiki_oauth_state");
    return res;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return back(origin, { oauth: "error", reason: msg.slice(0, 140) });
  }
}
