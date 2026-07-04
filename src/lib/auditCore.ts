// ─── Audit de chaîne (§5) ────────────────────────────────────────────────────
// PUR & autonome (types only) → testable. Diagnostic complet : scores
// réel/estimé, tranche de durée qui surperforme, meilleur jour, audit Shorts,
// comparatif concurrents, recommandations (preuve + impact + action), plan 4 sem.

import type {
  ScoredVideo,
  FormatMedians,
  ChannelSnapshot,
  DataStatus,
} from "./types";

export interface AuditScore {
  key: string;
  label: string;
  value: number; // 0-100
  status: DataStatus;
  note?: string;
}
export interface AuditRec {
  title: string;
  proof: string;
  impact: string;
  action: string;
  severity: "high" | "medium" | "low";
}
export interface DurationBucket {
  label: string;
  minSec: number;
  maxSec: number;
  count: number;
  avgRatio: number;
}
export interface DayPerf {
  day: string;
  count: number;
  avgRatio: number;
}
export interface WeekPlan {
  week: number;
  focus: string;
  tasks: string[];
}
export interface FormatStat {
  count: number;
  median: number;
  outlierRate: number;
}
export interface AuditReport {
  scores: AuditScore[];
  durationBuckets: DurationBucket[];
  bestDuration?: DurationBucket;
  days: DayPerf[];
  bestDay?: DayPerf;
  shorts: FormatStat;
  longs: FormatStat;
  recommendations: AuditRec[];
  plan: WeekPlan[];
}

const DAYS_FR = [
  "dimanche",
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
];
const BUCKETS: { label: string; min: number; max: number }[] = [
  { label: "Shorts (≤ 1 min)", min: 0, max: 60 },
  { label: "1–5 min", min: 60, max: 300 },
  { label: "5–10 min", min: 300, max: 600 },
  { label: "10–20 min", min: 600, max: 1200 },
  { label: "20 min +", min: 1200, max: Infinity },
];

function mean(a: number[]): number {
  return a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0;
}
function isHit(s: ScoredVideo): boolean {
  return s.flag === "outlier" || s.flag === "emerging";
}
function outlierRate(list: ScoredVideo[]): number {
  return list.length ? list.filter(isHit).length / list.length : 0;
}
function r1(x: number): string {
  return (Math.round(x * 10) / 10).toString().replace(".", ",");
}

export function analyzeAudit(input: {
  scored: ScoredVideo[];
  medians: FormatMedians;
  channel?: ChannelSnapshot;
  nowMs: number;
  ctr?: { value: number; status: DataStatus };
  competitorOutlierRate?: number;
}): AuditReport {
  const { scored, medians } = input;
  const shortsList = scored.filter((s) => s.video.format === "short");
  const longsList = scored.filter((s) => s.video.format === "long");

  const shorts: FormatStat = {
    count: shortsList.length,
    median: medians.short,
    outlierRate: outlierRate(shortsList),
  };
  const longs: FormatStat = {
    count: longsList.length,
    median: medians.long,
    outlierRate: outlierRate(longsList),
  };

  const durationBuckets: DurationBucket[] = BUCKETS.map((b) => {
    const inB = scored.filter(
      (s) => s.video.durationSec >= b.min && s.video.durationSec < b.max,
    );
    return {
      label: b.label,
      minSec: b.min,
      maxSec: b.max,
      count: inB.length,
      avgRatio: mean(inB.map((s) => s.ratio)),
    };
  });
  const bestDuration = durationBuckets
    .filter((b) => b.count >= 2)
    .sort((a, b) => b.avgRatio - a.avgRatio)[0];

  const dayMap = new Map<number, ScoredVideo[]>();
  for (const s of scored) {
    const d = new Date(s.video.publishedAt).getUTCDay();
    if (Number.isNaN(d)) continue;
    const arr = dayMap.get(d) ?? [];
    arr.push(s);
    dayMap.set(d, arr);
  }
  const days: DayPerf[] = [...dayMap.entries()]
    .map(([d, list]) => ({
      day: DAYS_FR[d],
      count: list.length,
      avgRatio: mean(list.map((s) => s.ratio)),
    }))
    .sort((a, b) => b.avgRatio - a.avgRatio);
  const bestDay = days.filter((d) => d.count >= 2)[0];

  const cadence30 = scored.filter((s) => s.ageDays <= 30).length;
  const scores: AuditScore[] = [
    {
      key: "cadence",
      label: "Régularité",
      value: Math.round(100 * Math.min(1, cadence30 / 8)),
      status: "real",
      note: `${cadence30} vidéos / 30 j`,
    },
    {
      key: "outliers-long",
      label: "Taux d'outliers (longues)",
      value: Math.round(longs.outlierRate * 100),
      status: "real",
    },
    {
      key: "shorts",
      label: "Santé des Shorts",
      value: Math.round(shorts.outlierRate * 100),
      status: "real",
      note: `${shorts.count} Shorts`,
    },
    input.ctr
      ? {
          key: "ctr",
          label: "CTR",
          value: Math.round(input.ctr.value * 100),
          status: input.ctr.status,
        }
      : {
          key: "ctr",
          label: "CTR",
          value: 0,
          status: "unavailable" as const,
          note: "Connecte OAuth (Reporting API) pour le CTR réel.",
        },
  ];

  const recommendations: AuditRec[] = [];
  if (bestDuration)
    recommendations.push({
      title: `Privilégie le format « ${bestDuration.label} »`,
      proof: `Tes vidéos ${bestDuration.label} font ${r1(bestDuration.avgRatio)}× ta médiane en moyenne (${bestDuration.count} vidéos).`,
      impact: "Concentre la production sur la durée qui convertit le mieux.",
      action: `Planifie 2 vidéos « ${bestDuration.label} » ce mois-ci.`,
      severity: "high",
    });
  if (bestDay)
    recommendations.push({
      title: `Publie le ${bestDay.day}`,
      proof: `Tes vidéos du ${bestDay.day} font ${r1(bestDay.avgRatio)}× ta médiane (${bestDay.count} vidéos).`,
      impact: "Aligne la sortie sur le créneau où ton audience répond le mieux.",
      action: `Cale ta prochaine sortie un ${bestDay.day}.`,
      severity: "medium",
    });
  if (shorts.count === 0)
    recommendations.push({
      title: "Lance des Shorts",
      proof: "Aucun Short détecté sur la période analysée.",
      impact:
        "Les Shorts captent une audience de découverte que les longues ne touchent pas.",
      action: "Publie 3 Shorts (extraits de tes meilleurs moments) cette semaine.",
      severity: "high",
    });
  else if (shorts.outlierRate < longs.outlierRate)
    recommendations.push({
      title: "Resserre l'accroche de tes Shorts",
      proof: `Tes Shorts performent moins (${Math.round(shorts.outlierRate * 100)}% d'outliers vs ${Math.round(longs.outlierRate * 100)}% en longues).`,
      impact: "Un hook fort dans la 1re seconde change tout sur les Shorts.",
      action: "Place le payoff dans les 2 premières secondes de tes 3 prochains Shorts.",
      severity: "medium",
    });
  if (
    input.competitorOutlierRate != null &&
    longs.outlierRate < input.competitorOutlierRate
  )
    recommendations.push({
      title: "Tu es sous le taux d'outliers de tes concurrents",
      proof: `Toi ${Math.round(longs.outlierRate * 100)}% vs concurrents ${Math.round(input.competitorOutlierRate * 100)}% (estimé).`,
      impact: "Des concepts qui marchent dans ta niche restent inexploités.",
      action: "Adapte (sans copier) 1 concept outlier d'un concurrent ce mois-ci.",
      severity: "medium",
    });
  if (!input.ctr)
    recommendations.push({
      title: "Connecte ta chaîne pour le CTR réel",
      proof: "CTR (impressions → clics) indisponible sans OAuth (Reporting API).",
      impact: "Le CTR est le levier #1 des vues ; sans lui l'audit reste partiel.",
      action: "Configure OAuth dans Paramètres pour débloquer CTR & rétention réels.",
      severity: "low",
    });

  const plan: WeekPlan[] = [
    {
      week: 1,
      focus: "Capitaliser sur ce qui marche",
      tasks: [
        bestDuration
          ? `Produire 1 vidéo « ${bestDuration.label} »`
          : "Reproduire ton meilleur format",
        "Réutiliser l'angle de ton meilleur outlier récent",
      ],
    },
    {
      week: 2,
      focus: "Importer un concept gagnant",
      tasks: [
        "Adapter en FR 1 mécanique virale repérée (Outliers du monde)",
        "Soigner le hook des 5 premières secondes",
      ],
    },
    {
      week: 3,
      focus: "Optimiser titres & miniatures",
      tasks: [
        "Appliquer les hooks gagnants (onglet Hooks)",
        "A/B tester 2 miniatures (onglet Miniatures)",
      ],
    },
    {
      week: 4,
      focus: "Tenir la cadence & sérialiser",
      tasks: [
        bestDay ? `Publier un ${bestDay.day}` : "Fixer un jour de sortie régulier",
        "Transformer ton meilleur sujet en série",
      ],
    },
  ];

  return {
    scores,
    durationBuckets,
    bestDuration,
    days,
    bestDay,
    shorts,
    longs,
    recommendations,
    plan,
  };
}
