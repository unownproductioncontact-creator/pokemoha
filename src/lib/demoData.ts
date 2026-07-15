// Données de DÉMONSTRATION (fictives) pour visualiser l'app sans configurer les
// APIs. Toujours étiquetées « démo » dans l'UI — jamais présentées comme réelles (§0).
// On passe par le VRAI moteur (analyzeChannel / scoreCompetitor) pour montrer son
// comportement.

import { analyzeChannel } from "./outlierCore";
import { scoreCompetitor } from "./competitorScore";
import { scoreWorldVideo, rankWorld } from "./worldCore";
import { analyzeAudit } from "./auditCore";
import { analyzeThumbnail } from "./thumbnailCore";
import { rankIdeas, pickDaily, type IdeaSignal } from "./ideaRanking";
import { buildAlerts } from "./alertsCore";
import type {
  AlertsResult,
  ChannelAnalysis,
  ChannelSnapshot,
  CompetitorAnalysis,
  CompetitorsResult,
  ScanResult,
  TrendsResult,
  CtrReport,
  AuditResult,
  ThumbResult,
  IdeasResult,
  TitlePatternsResult,
  YtVideo,
} from "./types";

const DAY = 86_400_000;

type Spec = [title: string, format: "short" | "long", views: number, age: number];

function makeVideo(
  now: number,
  channelId: string,
  channelTitle: string,
  idx: number,
  [title, format, views, age]: Spec,
): YtVideo {
  return {
    id: `${channelId}-${idx}`,
    channelId,
    channelTitle,
    title,
    publishedAt: new Date(now - age * DAY).toISOString(),
    durationSec: format === "short" ? 35 : 640,
    views,
    likes: Math.round(views * 0.04),
    comments: Math.round(views * 0.004),
    format,
  };
}

function build(now: number, channelId: string, title: string, specs: Spec[]): YtVideo[] {
  return specs.map((s, i) => makeVideo(now, channelId, title, i, s));
}

const MY_SPECS: Spec[] = [
  ["J'ouvre un display Écarlate & Violet en entier", "long", 45000, 60],
  ["Mon classeur de cartes Pokémon vintage", "long", 38000, 50],
  ["Test : ce coffret vaut-il le coup ?", "long", 42000, 45],
  ["Recherche du Dracaufeu en booster", "long", 48000, 40],
  ["Top 10 des cartes les plus chères 2026", "long", 55000, 35],
  ["Je refais mes packs d'enfance", "long", 40000, 30],
  ["Faut-il investir dans les cartes Pokémon ?", "long", 33000, 25],
  ["Unboxing de l'UPC Pokémon 151", "long", 60000, 22],
  ["Ma collection complète d'ETB", "long", 35000, 70],
  ["J'ouvre un carton scellé à 2000€ (1re édition)", "long", 185000, 28],
  ["Le pull de ma vie en direct", "long", 130000, 34],
  ["200 boosters pour trouver LA carte", "long", 96000, 18],
  ["Vlog : réception de colis (sans ouverture)", "long", 12000, 42],
  ["Première ouverture du nouveau set (à chaud)", "long", 29000, 2],
  ["J'achète TOUT le rayon Pokémon du magasin", "long", 52000, 3],
  ["Ce pull en 15 secondes 😱", "short", 110000, 30],
  ["La carte que tout le monde veut #shorts", "short", 120000, 25],
  ["Top 3 cartes du set", "short", 95000, 40],
  ["Réaction : pull arc-en-ciel", "short", 130000, 20],
  ["Astuce rangement de classeur", "short", 80000, 60],
  ["Le prix de cette carte va te choquer", "short", 160000, 15],
  ["Mini unboxing d'ETB", "short", 100000, 50],
  ["Il sort un Dracaufeu 1re édition 🔥", "short", 1250000, 21],
  ["Le pull du jour (tu vas halluciner)", "short", 92000, 1],
  ["Présentation de la chaîne", "short", 20000, 35],
];

export function buildDemoAnalysis(): ChannelAnalysis {
  const now = Date.now();
  const videos = build(now, "DEMO", "Chaîne de démonstration", MY_SPECS);
  const { medians, scored } = analyzeChannel(videos, now);
  return {
    status: "ok",
    demo: true,
    channel: {
      channelId: "DEMO",
      title: "Chaîne de démonstration",
      subscribers: 48200,
      totalViews: 9_650_000,
      videoCount: 213,
    },
    medians,
    scored,
    fetchedAt: now,
  };
}

// ───────────────────────── Concurrents de démo ─────────────────────────

interface DemoComp {
  id: string;
  label: string;
  subs: number;
  specs: Spec[];
}

const DEMO_COMPS: DemoComp[] = [
  {
    id: "kiibiki",
    label: "Kiibiki",
    subs: 318000,
    specs: [
      ["Le plus gros pull de l'année 🔥", "long", 920000, 12],
      ["J'ouvre 10 displays d'un coup", "long", 410000, 25],
      ["200€ de boosters, ça vaut quoi ?", "long", 96000, 40],
      ["Ma collection vaut 50 000€", "long", 88000, 55],
      ["Review du dernier ETB", "long", 80000, 60],
      ["Unboxing tranquille du dimanche", "long", 72000, 48],
      ["Top cartes du set en 60s", "short", 680000, 8],
      ["Ce pull en 20 secondes", "short", 190000, 30],
      ["Nouveau set à chaud", "long", 150000, 2],
      ["Petit vlog d'achat", "long", 28000, 5],
    ],
  },
  {
    id: "pokemoniteur",
    label: "Pokémoniteur",
    subs: 94000,
    specs: [
      ["Analyse du marché des cartes Pokémon", "long", 120000, 18],
      ["Faut-il vendre maintenant ?", "long", 64000, 30],
      ["La cote des cartes EV", "long", 52000, 44],
      ["Mon avis sur le nouveau set", "long", 49000, 58],
      ["Investissement : 3 cartes à suivre", "long", 47000, 70],
      ["Récap des prix de la semaine", "short", 88000, 6],
      ["Le scellé monte encore", "short", 70000, 21],
      ["Erreurs d'investisseurs débutants", "long", 41000, 35],
    ],
  },
  {
    id: "ilan-du-bourg",
    label: "Ilan du Bourg",
    subs: 27000,
    specs: [
      ["J'ouvre mon premier carton scellé", "long", 78000, 3],
      ["Pull incroyable pour une petite chaîne", "long", 64000, 6],
      ["Mon set-up de collection", "long", 12000, 40],
      ["Routine d'ouverture du soir", "long", 9000, 55],
      ["Vlog : brocante cartes Pokémon", "long", 8000, 65],
      ["Réaction à chaud #shorts", "short", 140000, 2],
      ["Le pull du jour", "short", 22000, 30],
    ],
  },
  {
    id: "palette",
    label: "Palette",
    subs: 13500,
    specs: [
      ["Présentation de ma collection", "long", 14000, 20],
      ["Ouverture d'un coffret", "long", 11000, 35],
      ["Top 5 cartes préférées", "long", 9500, 50],
      ["Rangement et protection", "long", 8000, 62],
      ["Un petit pull sympa", "short", 30000, 10],
      ["Astuce débutant", "short", 18000, 28],
    ],
  },
];

function buildDemoCompetitor(now: number, c: DemoComp): CompetitorAnalysis {
  const videos = build(now, c.id, c.label, c.specs);
  const { medians, scored } = analyzeChannel(videos, now);
  const channel = {
    channelId: c.id,
    title: c.label,
    subscribers: c.subs,
    videoCount: c.specs.length * 9,
    totalViews: c.subs * 80,
  };
  const scores = scoreCompetitor(scored, channel);
  return {
    id: c.id,
    ref: c.label,
    label: c.label,
    status: "ok",
    channel,
    medians,
    scored,
    scores,
    fetchedAt: now,
  };
}

export function buildDemoCompetitors(): CompetitorsResult {
  const now = Date.now();
  return {
    demo: true,
    hasCredentials: true,
    competitors: DEMO_COMPS.map((c) => buildDemoCompetitor(now, c)),
  };
}

export function buildDemoCompetitorById(
  id: string,
): CompetitorAnalysis | undefined {
  const now = Date.now();
  const c = DEMO_COMPS.find((x) => x.id === id);
  return c ? buildDemoCompetitor(now, c) : undefined;
}

export function buildDemoDiscover(): ChannelSnapshot[] {
  return [
    { channelId: "sug-1", title: "Dracaufeu Master", subscribers: 54000 },
    { channelId: "sug-2", title: "PokéInvest FR", subscribers: 120000 },
    { channelId: "sug-3", title: "Le Bureau des Boosters", subscribers: 39000 },
    { channelId: "sug-4", title: "Carte Rare TV", subscribers: 210000 },
  ];
}

// ───────────────────────── Scans monde / niche / tendances (démo) ─────────────────────────

type WSpec = [string, "short" | "long", number, number, number, string];

function buildWorld(now: number, specs: WSpec[]) {
  return specs.map((sp, i) => {
    const [title, format, views, age, subs, channel] = sp;
    const v: YtVideo = {
      id: `dw-${i}-${title.length}`,
      channelId: `dwc-${i}`,
      channelTitle: channel,
      title,
      publishedAt: new Date(now - age * DAY).toISOString(),
      durationSec: format === "short" ? 35 : 600,
      views,
      format,
    };
    return scoreWorldVideo(v, subs, now);
  });
}

const DEMO_NICHE: WSpec[] = [
  ["Petite chaîne, ÉNORME pull 🔥", "long", 480000, 3, 9000, "PokéNino"],
  ["J'ouvre un carton scellé Base Set", "long", 310000, 6, 15000, "VintageCards FR"],
  ["Le graal en 1 booster #shorts", "short", 620000, 2, 22000, "BoosterLuck"],
  ["200 boosters, 1 objectif", "long", 150000, 9, 40000, "Le Bureau des Boosters"],
  ["Ce coffret vaut-il le coup ?", "long", 95000, 5, 60000, "TestTCG"],
  ["Réaction : pull arc-en-ciel", "short", 240000, 4, 18000, "ShinyPull"],
  ["Mon premier display en live", "long", 80000, 2, 5000, "DébutCollec"],
  ["Top 5 cartes du nouveau set", "long", 60000, 7, 120000, "PokéActu"],
];

const DEMO_WORLD: WSpec[] = [
  ["I pulled the $10,000 card", "long", 2100000, 2, 30000, "CardHunterUS"],
  ["ポケカ 開封 神引き", "short", 1500000, 3, 80000, "PokeKa JP"],
  ["Opening a sealed 1st edition box", "long", 980000, 5, 150000, "UK Collector"],
  ["He found the chase card!", "short", 1200000, 1, 45000, "PullKings"],
  ["Cartas Pokémon: abertura insana", "long", 430000, 4, 20000, "BR Cartas"],
  ["Vintage booster from 1999", "long", 760000, 8, 210000, "RetroPacks"],
  ["The smallest channel, biggest pull", "long", 540000, 2, 7000, "TinyTuber"],
];

export function buildDemoScan(kind: "niche" | "world"): ScanResult {
  const now = Date.now();
  const items = rankWorld(
    buildWorld(now, kind === "world" ? DEMO_WORLD : DEMO_NICHE),
    60,
  );
  return { demo: true, status: "ok", items };
}

const DEMO_TRENDS: [string, number, number, string][] = [
  ["Le clip qui casse YouTube", 5400000, 2, "Artiste FR"],
  ["Test de la nouvelle console", 1200000, 1, "TechReview"],
  ["Le sketch du moment", 980000, 3, "Humour FR"],
  ["Recette express en 5 minutes", 640000, 1, "Cuisine"],
  ["Vlog voyage au Japon", 420000, 4, "Globe-Trotteur"],
  ["Pokémon : ouverture display 151", 310000, 2, "Kiibiki"],
];

export function buildDemoTrends(): TrendsResult {
  const now = Date.now();
  const items: YtVideo[] = DEMO_TRENDS.map((sp, i) => {
    const [title, views, age, channel] = sp;
    return {
      id: `dt-${i}`,
      channelId: `dtc-${i}`,
      channelTitle: channel,
      title,
      publishedAt: new Date(now - age * DAY).toISOString(),
      durationSec: 600,
      views,
      format: "long",
    };
  });
  return { demo: true, status: "ok", regionCode: "FR", items };
}

// ───────────────────────── Audit / CTR / Miniature (démo) ─────────────────────────

export function buildDemoCtr(): CtrReport {
  return {
    demo: true,
    status: "ok",
    ctr: { status: "real", value: 0.061, unit: "%", source: "Reporting API (démo)" },
    retention: { status: "real", value: 0.41, unit: "%", source: "Analytics (démo)" },
    watchTimeMin: { status: "real", value: 128400, unit: "min", source: "Analytics (démo)" },
    views28: { status: "real", value: 540000, unit: "vues", source: "Analytics (démo)" },
  };
}

export function buildDemoAudit(): AuditResult {
  const now = Date.now();
  const videos = build(now, "DEMO", "Chaîne de démonstration", MY_SPECS);
  const { medians, scored } = analyzeChannel(videos, now);
  const report = analyzeAudit({
    scored,
    medians,
    nowMs: now,
    competitorOutlierRate: 0.28,
  });
  return {
    demo: true,
    status: "ok",
    channelTitle: "Chaîne de démonstration",
    report,
  };
}

export function buildDemoThumb(): ThumbResult {
  const w = 160,
    h = 90;
  const data = new Uint8Array(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const v = 28 + (i % 36);
    data[i * 4] = Math.round(v * 0.6);
    data[i * 4 + 1] = Math.round(v * 0.6);
    data[i * 4 + 2] = v;
    data[i * 4 + 3] = 255;
  }
  return {
    demo: true,
    status: "ok",
    analysis: analyzeThumbnail({ width: w, height: h, data }),
  };
}

export function buildDemoIdeas(daily = false): IdeasResult {
  const now = Date.now();
  const signals: IdeaSignal[] = [];

  const mine = analyzeChannel(build(now, "DEMO", "Démo", MY_SPECS), now);
  const myTitles = mine.scored.map((s) => s.video.title);
  for (const s of mine.scored.filter(
    (s) => s.flag === "outlier" || s.flag === "emerging",
  ))
    signals.push({
      title: s.video.title,
      strength: s.ratio,
      source: "mine",
      format: s.video.format,
    });

  for (const c of DEMO_COMPS) {
    const a = analyzeChannel(build(now, c.id, c.label, c.specs), now);
    for (const s of a.scored.filter(
      (s) => s.flag === "outlier" || s.flag === "emerging",
    ))
      signals.push({
        title: s.video.title,
        strength: s.ratio,
        source: "competitor",
        sourceLabel: c.label,
        format: s.video.format,
      });
  }

  for (const w of buildWorld(now, DEMO_NICHE))
    signals.push({
      title: w.video.title,
      strength: w.score / 10,
      source: "niche",
      mechanic: w.mechanic,
      format: w.video.format,
    });

  const ranked = rankIdeas(signals, { myTitles, limit: 100 });
  return {
    demo: true,
    status: "ok",
    usedLlm: false,
    ideas: daily ? pickDaily(ranked, 20260629, 6) : ranked,
  };
}

export function buildDemoAlerts(): AlertsResult {
  const now = Date.now();
  const mine = analyzeChannel(build(now, "DEMO", "Démo", MY_SPECS), now);
  const competitorOutliers = DEMO_COMPS.flatMap((c) => {
    const a = analyzeChannel(build(now, c.id, c.label, c.specs), now);
    return a.scored
      .filter(
        (s) =>
          (s.flag === "outlier" || s.flag === "emerging") && s.ageDays <= 7,
      )
      .map((s) => ({ sv: s, competitorLabel: c.label }));
  });
  return {
    demo: true,
    status: "ok",
    alerts: buildAlerts({
      scored: mine.scored,
      competitorOutliers,
      nowMs: now,
    }),
  };
}

export function buildDemoTitlePatterns(): TitlePatternsResult {
  return {
    demo: true,
    status: "ok",
    patterns: [
      {
        template: "J'ai ouvert un display {X} en entier",
        source: "mine",
        sourceLabel: "Ta chaîne",
        strength: 4.1,
        isShort: false,
        original: "J'ai ouvert un display Écarlate & Violet 151 en entier",
      },
      {
        template: "POURQUOI {X} explose en ce moment",
        source: "competitor",
        sourceLabel: "Pokémoniteur",
        strength: 3.3,
        isShort: false,
        original: "POURQUOI Dracaufeu explose en ce moment",
      },
      {
        template: "{X} : mon plus gros pull de l'année",
        source: "mine",
        sourceLabel: "Ta chaîne",
        strength: 2.8,
        isShort: true,
        original: "Prismatic Evolutions : mon plus gros pull de l'année",
      },
      {
        template: "J'ai dépensé 1000 € en {X}",
        source: "competitor",
        sourceLabel: "Ilan du Bourg",
        strength: 2.4,
        isShort: false,
        original: "J'ai dépensé 1000 € en boosters Pokémon",
      },
      {
        template: "Personne ne fait ça avec {X}",
        source: "competitor",
        sourceLabel: "Palette",
        strength: 1.9,
        isShort: true,
        original: "Personne ne fait ça avec les displays scellés",
      },
    ],
  };
}
