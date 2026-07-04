// Service serveur : analyse de MA chaîne (vidéos + outliers). OAuth prioritaire
// (données propriétaire), sinon clé API publique. Ne lève jamais : renvoie un
// statut explicite (§0 : réel / estimé / indisponible).

import { listTokens } from "./oauthStore";
import { getValidAccessToken } from "./googleOAuth";
import { getChannelWithVideos } from "./youtube";
import { analyzeChannel } from "./outlierCore";
import { hasYouTubeKey } from "./env";
import { DEFAULT_CHANNEL_REF } from "@/config/channels";
import type { ChannelAnalysis } from "./types";

export async function analyzeMyChannel(
  opts: { ref?: string; channelId?: string; max?: number } = {},
): Promise<ChannelAnalysis> {
  const tokens = await listTokens();

  let accessToken: string | undefined;
  let ref = opts.ref;

  // OAuth d'abord : la chaîne connectée EST ma chaîne (données propriétaire).
  if (tokens.length > 0) {
    const tok = opts.channelId
      ? tokens.find((t) => t.channelId === opts.channelId)
      : tokens[0];
    if (tok) {
      try {
        accessToken = (await getValidAccessToken(tok.channelId)) ?? undefined;
      } catch {
        // Stockage temporairement indisponible pendant un refresh de token :
        // on retente au prochain appel plutôt que de faire échouer toute
        // l'analyse de chaîne (repli sur la clé API si présente).
        accessToken = undefined;
      }
      ref = ref ?? tok.channelId;
    }
  }

  if (!ref) ref = DEFAULT_CHANNEL_REF;

  if (!accessToken && !hasYouTubeKey()) {
    return {
      status: "no-credentials",
      message:
        "Aucune source de données : ajoute YOUTUBE_API_KEY dans .env.local ou connecte ta chaîne (OAuth).",
    };
  }

  try {
    const res = await getChannelWithVideos(ref, {
      max: opts.max ?? 80,
      accessToken,
    });
    if (!res) {
      return {
        status: "unconfigured",
        message: `Chaîne introuvable pour « ${ref} ». Renseigne src/config/channels.ts ou connecte ta chaîne.`,
      };
    }
    const now = Date.now();
    const { medians, scored } = analyzeChannel(res.videos, now);
    return {
      status: "ok",
      source: accessToken ? "oauth" : "apiKey",
      channel: res.channel,
      medians,
      scored,
      fetchedAt: now,
    };
  } catch (e) {
    return {
      status: "error",
      message: e instanceof Error ? e.message : String(e),
    };
  }
}
