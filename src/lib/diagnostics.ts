// Diagnostic système (§5) : état des clés, chaînes connectées, quota estimé,
// cache. Serveur uniquement.

import {
  hasYouTubeKey,
  hasOAuthConfig,
  hasAnthropic,
  llmIdeasEnabled,
  env,
} from "./env";
import { listTokens } from "./oauthStore";
import { getEstimatedQuota } from "./youtube";
import { listCacheEntries } from "./cache";
import type { DiagnosticResult } from "./types";

export async function getDiagnostic(): Promise<DiagnosticResult> {
  const tokens = await listTokens();
  const cache = await listCacheEntries();
  return {
    env: {
      youtubeApiKey: hasYouTubeKey(),
      oauth: hasOAuthConfig(),
      anthropic: hasAnthropic(),
      llmIdeas: llmIdeasEnabled(),
      ideasModel: env().ideasModel,
    },
    connectedChannels: tokens.map((t) => ({
      channelId: t.channelId,
      title: t.channelTitle ?? t.channelId,
    })),
    estimatedQuota: getEstimatedQuota(),
    cacheEntries: cache.length,
    freshCacheEntries: cache.filter((c) => c.fresh).length,
  };
}
