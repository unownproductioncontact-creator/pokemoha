// ─── Score « monde » / niche (§5) ───────────────────────────────────────────
// PUR & autonome (types only) → testable.
//
// Score = anomalie + petite chaîne + vélocité + fraîcheur. L'anomalie ici =
// vues ÷ abonnés (PROXY de découverte d'une chaîne tierce, ≠ ratio personnel du
// §4) → score ESTIMÉ. Détecte aussi une « mécanique virale » réutilisable en FR
// (jamais une copie).

import type { YtVideo, WorldScored } from "./types";

const DAY = 86_400_000;
function ageInDays(iso: string, nowMs: number): number {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return Number.POSITIVE_INFINITY;
  return Math.max(0, (nowMs - t) / DAY);
}
function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

export const FRESH_WINDOW_DAYS = 30;

interface Mech {
  id: string;
  label: string;
  re: RegExp;
}
// Labels dupliqués volontairement (autonomie du module testé) — alignés sur config/world.ts.
const MECHANICS: Mech[] = [
  {
    id: "high-stakes",
    label: "Mise extrême",
    re: /(scell[ée]|carton|1re [ée]dition|premi[èe]re [ée]dition|\d{3,}\s?[€$]|graal)/i,
  },
  {
    id: "card-hunt",
    label: "Chasse à la carte",
    re: /(chasse|trouver|recherche du|jusqu'[àa]|chase)/i,
  },
  {
    id: "numbered-challenge",
    label: "Défi chiffré",
    re: /(j'ouvre \d+|\b\d{2,}\s?(boosters?|cartes?|displays?)\b)/i,
  },
  {
    id: "nostalgia",
    label: "Nostalgie / vintage",
    re: /(vintage|enfance|r[ée]tro|nostalg)/i,
  },
  {
    id: "verdict-test",
    label: "Test & verdict",
    re: /(vaut[- ]il|comparatif|\btest\b|lequel|le meilleur|\bavis\b)/i,
  },
  {
    id: "social-stakes",
    label: "Enjeu social",
    re: /(d[ée]fi|pari|gage|duel|\bvs\b|contre)/i,
  },
];

export function detectMechanic(
  title: string,
): { id: string; label: string } | undefined {
  for (const m of MECHANICS) {
    if (m.re.test(title)) return { id: m.id, label: m.label };
  }
  return undefined;
}

export function scoreWorldVideo(
  video: YtVideo,
  channelSubs: number | undefined,
  nowMs: number,
): WorldScored {
  const age = ageInDays(video.publishedAt, nowMs);
  const velocity = video.views / Math.max(age, 0.5);
  const anomaly =
    channelSubs && channelSubs > 0 ? video.views / channelSubs : 0;
  const freshness = clamp01(1 - age / FRESH_WINDOW_DAYS);
  const smallChannel =
    channelSubs && channelSubs > 0
      ? clamp01(1 - Math.log10(channelSubs) / 6)
      : 0.5;

  const anomalyScore = clamp01(anomaly / 20); // 20× abonnés = max
  const velocityScore = clamp01(Math.log10(velocity + 1) / Math.log10(200000));
  const score = Math.round(
    100 *
      (0.35 * anomalyScore +
        0.25 * velocityScore +
        0.2 * smallChannel +
        0.2 * freshness),
  );

  const mechanic = detectMechanic(video.title);
  const reasons: string[] = [];
  if (anomaly > 0)
    reasons.push(
      `Anomalie : ${anomaly.toFixed(1).replace(".", ",")}× ses abonnés (estimé).`,
    );
  reasons.push(`Vélocité : ${Math.round(velocity)} vues/jour.`);
  if (channelSubs)
    reasons.push(
      `Chaîne de ${channelSubs} abonnés${smallChannel > 0.6 ? " (petite — fort potentiel)" : ""}.`,
    );
  reasons.push(
    `Fraîcheur : ${age < 1 ? "moins d'un jour" : Math.round(age) + " j"}.`,
  );
  if (mechanic)
    reasons.push(
      `Mécanique virale : ${mechanic.label} — adaptable en FR (jamais copier).`,
    );

  return {
    video,
    channelSubs,
    score,
    velocity,
    anomaly,
    freshness,
    smallChannel,
    mechanic,
    reasons,
  };
}

export function rankWorld(items: WorldScored[], limit = 60): WorldScored[] {
  return [...items].sort((a, b) => b.score - a.score).slice(0, limit);
}
