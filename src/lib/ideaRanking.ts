// ─── Moteur d'idées local (§6) ───────────────────────────────────────────────
// PUR & autonome (types only) → testable. Synthétise des idées depuis des
// signaux (outliers : mes vidéos / concurrents / niche / monde), avec scores
// d'opportunité & qualité, anti-répétition et anti-déjà-vu. 100% gratuit.

import type { VideoFormat } from "./types";

export type IdeaSource = "mine" | "competitor" | "niche" | "world";

export interface IdeaSignal {
  title: string;
  /** Force comparable du signal (ratio d'outlier, ou score monde/10). */
  strength: number;
  source: IdeaSource;
  sourceLabel?: string;
  mechanic?: { id: string; label: string };
  format?: VideoFormat;
}

export interface Idea {
  id: string;
  title: string;
  angle: string;
  why: string;
  source: IdeaSource;
  sourceLabel: string;
  opportunity: number; // 0-100
  quality: number; // 0-100
  keywords: string[];
  format?: VideoFormat;
}

const SOURCE_WEIGHT: Record<IdeaSource, number> = {
  world: 1.0,
  niche: 0.9,
  competitor: 0.8,
  mine: 0.7,
};
const SOURCE_LABEL: Record<IdeaSource, string> = {
  mine: "Ta chaîne",
  competitor: "Concurrent",
  niche: "Niche FR",
  world: "Monde",
};

const STOP = new Set([
  "le", "la", "les", "un", "une", "des", "de", "du", "et", "en", "pour", "sur",
  "dans", "mon", "ma", "mes", "ce", "cette", "je", "qui", "que", "avec", "plus",
  "est", "son", "sa", "au", "aux", "the", "for", "you", "your", "shorts",
]);

function keywords(text: string): string[] {
  return (text || "")
    .toLowerCase()
    .split(/[^a-zà-ÿ0-9]+/)
    .filter((w) => w.length >= 3 && !STOP.has(w));
}
function normKey(kws: string[]): string {
  return kws.slice(0, 4).sort().join("|");
}
function cap(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

const MECH_TEMPLATE: Record<string, (c: string) => string> = {
  "high-stakes": (c) => `J'ouvre le plus cher : ${c}`,
  "card-hunt": (c) => `Je n'arrête pas ${c} avant LE graal`,
  "numbered-challenge": (c) => `100 × ${c} : le défi`,
  nostalgia: (c) => `${cap(c)} de mon enfance : ça vaut quoi aujourd'hui ?`,
  "verdict-test": (c) => `${cap(c)} : le verdict honnête`,
  "social-stakes": (c) => `Duel : ${c} (le perdant a un gage)`,
  "story-arc": (c) => `${cap(c)} : épisode 1 de ma quête`,
};

function adaptTitle(s: IdeaSignal): string {
  const core = keywords(s.title).slice(0, 3).join(" ") || s.title.trim();
  if (s.mechanic && MECH_TEMPLATE[s.mechanic.id])
    return MECH_TEMPLATE[s.mechanic.id](core);
  // Audit UX F020 : pas de suffixe boilerplate dupliqué sur chaque carte —
  // le sujet propre suffit, le « pourquoi » porte déjà la preuve. Mais si le
  // noyau se réduit à un seul mot (signal dégénéré), on garde le titre d'origine
  // nettoyé plutôt qu'un titre à un mot inutilisable comme graine de génération.
  if (core.includes(" ")) return cap(core);
  const full = s.title.trim();
  return cap(full.length >= core.length ? full : core);
}

function angleFor(s: IdeaSignal): string {
  if (s.mechanic)
    return `Mécanique « ${s.mechanic.label} » adaptée en FR (jamais une copie).`;
  // Générique identique partout = bruit (audit UX F020) → vide, masqué par l'UI.
  return "";
}

function whyFor(s: IdeaSignal): string {
  const label = s.sourceLabel ?? SOURCE_LABEL[s.source];
  return `Inspiré d'un signal fort (${s.strength.toFixed(1).replace(".", ",")}) — source : ${label}.`;
}

function qualityOf(title: string): number {
  let q = 0.4;
  if (/\d/.test(title)) q += 0.15;
  if (/(secret|jamais|graal|incroyable|plus|record|défi|verdict)/i.test(title))
    q += 0.2;
  if (title.length >= 25 && title.length <= 70) q += 0.15;
  if (keywords(title).length >= 3) q += 0.1;
  return clamp01(q);
}

export function rankIdeas(
  signals: IdeaSignal[],
  opts: { myTitles?: string[]; limit?: number } = {},
): Idea[] {
  const myKeys = new Set(
    (opts.myTitles ?? []).map((t) => normKey(keywords(t))),
  );
  const seen = new Set<string>();
  const ideas: Idea[] = [];

  for (const s of [...signals].sort((a, b) => b.strength - a.strength)) {
    const kws = keywords(s.title);
    const nk = normKey(kws);
    if (!nk || seen.has(nk)) continue; // anti-répétition
    if (myKeys.has(nk)) continue; // anti-déjà-vu (déjà couvert par moi)
    seen.add(nk);

    const title = adaptTitle(s);
    const opportunity = Math.round(
      clamp01(
        (Math.log10(s.strength + 1) / Math.log10(12)) * SOURCE_WEIGHT[s.source],
      ) * 100,
    );
    const quality = Math.round(qualityOf(title) * 100);

    ideas.push({
      id: nk.slice(0, 28) || `idea-${ideas.length}`,
      title,
      angle: angleFor(s),
      why: whyFor(s),
      source: s.source,
      sourceLabel: s.sourceLabel ?? SOURCE_LABEL[s.source],
      opportunity,
      quality,
      keywords: kws.slice(0, 5),
      format: s.format,
    });
  }

  ideas.sort(
    (a, b) => b.opportunity + b.quality - (a.opportunity + a.quality),
  );
  return opts.limit ? ideas.slice(0, opts.limit) : ideas;
}

// ───────────────────────── Analyser une idée (hors-ligne) ─────────────────────────

export interface IdeaAnalysis {
  score: number; // 0-100
  breakdown: { label: string; ok: boolean; tip?: string }[];
  angles: string[];
}

export function analyzeIdea(text: string): IdeaAnalysis {
  const kws = keywords(text);
  const breakdown = [
    {
      label: "Sujet clair (≥ 2 mots-clés)",
      ok: kws.length >= 2,
      tip: "Précise le sujet (produit, set, enjeu).",
    },
    {
      label: "Enjeu / curiosité",
      ok: /(secret|jamais|pourquoi|incroyable|graal|\d|€|\$|fou|record)/i.test(text),
      tip: "Ajoute un enjeu : un chiffre, un superlatif, un mystère.",
    },
    {
      label: "Format identifiable",
      ok: /(ouvre|ouverture|test|d[ée]fi|top|vs|j'ai|comparatif|verdict)/i.test(text),
      tip: "Indique le format (ouverture, test, défi, comparatif…).",
    },
    {
      label: "Longueur adaptée",
      ok: text.trim().length >= 12 && text.trim().length <= 90,
      tip: "Vise 5 à 12 mots.",
    },
    {
      label: "Suffisamment spécifique",
      ok: kws.length >= 3,
      tip: "Cite un élément précis (un set, un prix, une carte).",
    },
  ];
  const score = Math.round(
    (breakdown.filter((c) => c.ok).length / breakdown.length) * 100,
  );
  const core = kws.slice(0, 3).join(" ") || text.trim() || "cette idée";
  const angles = [
    `Enjeu max : « J'ai dépensé 1000 € sur ${core} »`,
    `Personnel : « ${cap(core)} a changé ma collection »`,
    `Défi : « 24 h pour réussir ${core} »`,
    `Comparatif : « ${cap(core)} : avant / après »`,
    `Preuve sociale : « Pourquoi tout le monde parle de ${core} »`,
  ];
  return { score, breakdown, angles };
}

// ───────────────────────── Idées du jour ─────────────────────────

/** Sélection quotidienne déterministe (daySeed = ex. AAAAMMJJ, passé par le service). */
export function pickDaily(ideas: Idea[], daySeed: number, n = 5): Idea[] {
  if (ideas.length === 0) return [];
  const pool = ideas.slice(0, Math.max(n * 4, 20));
  const start = ((daySeed % pool.length) + pool.length) % pool.length;
  const res: Idea[] = [];
  for (let i = 0; i < n && i < pool.length; i++) {
    res.push(pool[(start + i) % pool.length]);
  }
  return res;
}
