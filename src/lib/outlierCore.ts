// ─── Moteur d'outliers (cœur, §4) ───────────────────────────────────────────
// Module PUR & AUTONOME (imports de TYPES uniquement) → testable par node --test.
//
// Principes :
//  • ratio = vues ÷ médiane de SA PROPRE chaîne, MÊME format (jamais vues/abonnés).
//  • Maturité : une vidéo récente n'a pas fini d'accumuler ses vues → on calcule
//    un ratio PROJETÉ à maturité. Le ratio AFFICHÉ reste le vrai (honnête, §0).
//  • « Démarrage fort » (emerging 🌱) : récente (≤21 j), ratio brut faible mais
//    projeté ≥ 1,5× → on la garde (sinon les filtres 7/14/30 j se vident).
//  • Confiance selon âge + taille d'échantillon.
//  • Exclusion YouTube Kids (madeForKids + heuristique titre).

import type {
  YtVideo,
  ScoredVideo,
  FormatMedians,
  VideoFormat,
  OutlierFlag,
  Confidence,
} from "./types";

// Seuils (ajustables) ----------------------------------------------------------
export const OUTLIER_RATIO = 1.5; // ≥ 1,5× la médiane = outlier
export const STRONG_RATIO = 3; // performance exceptionnelle
export const UNDER_RATIO = 0.5; // < 0,5× = sous-performance
export const EMERGING_MAX_AGE = 21; // jours
export const EMERGING_PROJ = 1.5; // ratio projeté pour « démarrage fort »
export const SETTLE_DAYS = 14; // âge à partir duquel une vidéo « compte » pour la médiane
export const MIN_BASELINE = 5; // taille mini d'échantillon pour une médiane fiable

// Courbe de maturité (ESTIMÉE) : fraction des vues finales accumulées selon l'âge.
// Les Shorts maturent plus vite que les vidéos longues.
export const MATURITY_TAU: Record<VideoFormat, number> = { short: 5, long: 12 };
export const MATURITY_FLOOR: Record<VideoFormat, number> = {
  short: 0.18,
  long: 0.1,
};

const DAY = 86_400_000;

function ageInDays(iso: string, nowMs: number): number {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return Number.POSITIVE_INFINITY;
  return Math.max(0, (nowMs - t) / DAY);
}

export function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/** Fraction estimée 0..1 des vues finales déjà accumulées à `ageDays`. */
export function maturityFraction(ageDays: number, format: VideoFormat): number {
  if (!Number.isFinite(ageDays)) return 1;
  if (ageDays >= 120) return 1;
  const tau = MATURITY_TAU[format];
  const floor = MATURITY_FLOOR[format];
  const f = floor + (1 - floor) * (1 - Math.exp(-Math.max(0, ageDays) / tau));
  return Math.min(1, Math.max(floor, f));
}

// Exclusion YouTube Kids -------------------------------------------------------
const KIDS_RE =
  /(comptine|berceuse|nursery rhyme|dessin anim[ée]s?|pour b[ée]b[ée]s?|for kids|for children|kids song|baby shark|cocomelon)/i;

export function isKidsVideo(v: YtVideo): boolean {
  if (v.madeForKids === true) return true;
  return KIDS_RE.test(v.title ?? "");
}
export function excludeKids(videos: YtVideo[]): YtVideo[] {
  return videos.filter((v) => !isKidsVideo(v));
}

/** Médianes de vues PAR format. Baseline = vidéos « stabilisées » (âge ≥ SETTLE_DAYS),
 *  repli sur toutes si l'échantillon mûr est trop petit. */
export function computeMedians(
  videos: YtVideo[],
  nowMs: number,
): FormatMedians {
  const out: FormatMedians = { short: 0, long: 0 };
  for (const fmt of ["short", "long"] as VideoFormat[]) {
    const all = videos.filter((v) => v.format === fmt);
    const mature = all.filter((v) => ageInDays(v.publishedAt, nowMs) >= SETTLE_DAYS);
    const base = mature.length >= MIN_BASELINE ? mature : all;
    out[fmt] = median(base.map((v) => v.views));
  }
  return out;
}

function computeConfidence(age: number, sampleSize: number): Confidence {
  if (sampleSize < MIN_BASELINE) return "low";
  if (age < 2) return "low";
  if (age < 7) return "medium";
  return "high";
}

function r1(x: number): string {
  return (Math.round(x * 10) / 10).toString();
}
function pct(x: number): string {
  return Math.round(x * 100).toString();
}

/** Score une vidéo vis-à-vis des médianes de sa chaîne. `sampleSize` = nb de
 *  vidéos du même format (pour la confiance). */
export function scoreVideo(
  video: YtVideo,
  medians: FormatMedians,
  nowMs: number,
  sampleSize: number,
): ScoredVideo {
  const med = medians[video.format] || 0;
  const age = ageInDays(video.publishedAt, nowMs);
  const ratio = med > 0 ? video.views / med : 0;
  const frac = maturityFraction(age, video.format);
  const projected = frac > 0 ? ratio / frac : ratio;
  const isEmerging =
    age <= EMERGING_MAX_AGE && ratio < OUTLIER_RATIO && projected >= EMERGING_PROJ;

  let flag: OutlierFlag;
  if (ratio >= OUTLIER_RATIO) flag = "outlier";
  else if (isEmerging) flag = "emerging";
  else if (ratio > 0 && ratio < UNDER_RATIO) flag = "under";
  else flag = "normal";

  const confidence = computeConfidence(age, sampleSize);
  const fmtPlural = video.format === "short" ? "Shorts" : "vidéos longues";

  const reasons: string[] = [];
  if (med > 0) {
    if (flag === "outlier") {
      reasons.push(
        `Vues à ${r1(ratio)}× la médiane ${fmtPlural} de la chaîne (médiane ${Math.round(med)}).`,
      );
      if (ratio >= STRONG_RATIO)
        reasons.push(`Performance exceptionnelle (${r1(ratio)}×) — angle à rejouer.`);
    } else if (flag === "emerging") {
      reasons.push(
        `Démarrage fort : projeté à ${r1(projected)}× la médiane à maturité (≈${pct(frac)}% des vues estimées déjà là, ${r1(age)} j).`,
      );
      reasons.push(`Ratio réel actuel : ${r1(ratio)}× (honnête, non projeté).`);
    } else if (flag === "under") {
      reasons.push(`Sous la médiane : ${r1(ratio)}× — format/angle à éviter ou retravailler.`);
    } else {
      reasons.push(`Dans la norme de la chaîne (${r1(ratio)}×).`);
    }
  } else {
    reasons.push(
      `Médiane ${fmtPlural} indisponible (échantillon insuffisant) — ratio non calculé.`,
    );
  }
  if (confidence === "low") {
    reasons.push(
      sampleSize < MIN_BASELINE
        ? `Confiance faible : seulement ${sampleSize} ${fmtPlural} comparables.`
        : `Confiance faible : vidéo très récente (${r1(age)} j), vues non stabilisées.`,
    );
  }

  return {
    video,
    ratio,
    projectedRatio: projected,
    maturityFraction: frac,
    ageDays: age,
    isEmerging,
    flag,
    confidence,
    reasons,
  };
}

/** Analyse complète d'une chaîne : exclut Kids (par défaut), calcule médianes &
 *  score chaque vidéo. */
export function analyzeChannel(
  videos: YtVideo[],
  nowMs: number,
  opts: { excludeKids?: boolean } = {},
): { medians: FormatMedians; scored: ScoredVideo[] } {
  const clean = (opts.excludeKids ?? true) ? excludeKids(videos) : videos;
  const medians = computeMedians(clean, nowMs);
  const counts = {
    short: clean.filter((v) => v.format === "short").length,
    long: clean.filter((v) => v.format === "long").length,
  };
  const scored = clean.map((v) =>
    scoreVideo(v, medians, nowMs, counts[v.format]),
  );
  return { medians, scored };
}

/** Sélection des outliers : filtrage par dates AVANT plafonnement, avec quota de
 *  récence pour ne pas écraser les « démarrages forts » (§4). win=0 → tout. */
export function selectTopOutliers(
  scored: ScoredVideo[],
  opts: { windowDays?: number; limit?: number; recencyQuota?: number },
): ScoredVideo[] {
  const win = opts.windowDays ?? 0;
  const inWindow = win <= 0 ? scored.slice() : scored.filter((s) => s.ageDays <= win);
  const hits = inWindow.filter(
    (s) => s.flag === "outlier" || s.flag === "emerging",
  );
  const byRatio = [...hits].sort((a, b) => b.ratio - a.ratio);
  const limit = opts.limit ?? byRatio.length;
  if (byRatio.length <= limit) return byRatio;

  const quota = Math.min(opts.recencyQuota ?? 0, limit);
  const chosen = byRatio.slice(0, limit - quota);
  const chosenIds = new Set(chosen.map((s) => s.video.id));

  // Réserve `quota` places aux plus récents non encore retenus.
  const recent = [...hits]
    .filter((s) => !chosenIds.has(s.video.id))
    .sort((a, b) => a.ageDays - b.ageDays);
  for (const s of recent) {
    if (chosen.length >= limit) break;
    chosen.push(s);
    chosenIds.add(s.video.id);
  }
  // Complète par ratio si le quota n'était pas plein.
  for (const s of byRatio) {
    if (chosen.length >= limit) break;
    if (!chosenIds.has(s.video.id)) {
      chosen.push(s);
      chosenIds.add(s.video.id);
    }
  }
  return chosen.sort((a, b) => b.ratio - a.ratio);
}
