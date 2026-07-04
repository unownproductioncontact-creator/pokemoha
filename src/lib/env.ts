// Lecture centralisée de l'environnement (§2). Serveur uniquement.

export interface KiibikiEnv {
  youtubeApiKey: string;
  googleClientId: string;
  googleClientSecret: string;
  anthropicApiKey: string;
  ideasModel: string;
  useLlmIdeas: boolean;
}

export function env(): KiibikiEnv {
  return {
    youtubeApiKey: process.env.YOUTUBE_API_KEY ?? "",
    googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
    ideasModel: process.env.KIIBIKI_IDEAS_MODEL ?? "claude-sonnet-4-6",
    // IA payante OFF par défaut : moteur d'idées 100% local & gratuit (§0/§6).
    useLlmIdeas: process.env.KIIBIKI_USE_LLM_IDEAS === "1",
  };
}

export function hasYouTubeKey(): boolean {
  return !!process.env.YOUTUBE_API_KEY;
}
export function hasOAuthConfig(): boolean {
  return !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;
}
export function hasAnthropic(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}
/** Le mode IA n'est réellement actif que si le flag ET la clé sont présents. */
export function llmIdeasEnabled(): boolean {
  return process.env.KIIBIKI_USE_LLM_IDEAS === "1" && hasAnthropic();
}
