// Kiibiki — types de domaine partagés (« directeur YouTube IA »).
//
// Module de TYPES uniquement : aucun runtime, sûr à `import type` partout
// (client, serveur, modules lib testés). Ne jamais y mettre de logique.
//
// Principe §0 : chaque donnée est RÉELLE (api), ESTIMÉE (estimated) ou
// INDISPONIBLE (unavailable). Le statut accompagne toujours les métriques
// qui ne sont pas mesurées directement.

// ───────────────────────── Statuts & énum « string union » ─────────────────────────
// (Pas d'`enum` TS : incompatible avec le strip-types de `node --test`.)

import type { AuditReport } from './auditCore';
import type { ThumbAnalysis } from './thumbnailCore';
import type { Idea } from './ideaRanking';
import type { Alert } from './alertsCore';

export type VideoFormat = 'short' | 'long';
export type DataStatus = 'real' | 'estimated' | 'unavailable';
export type Confidence = 'high' | 'medium' | 'low';

/** Drapeau d'outlier d'une vidéo vis-à-vis de sa propre chaîne / format. */
export type OutlierFlag = 'outlier' | 'emerging' | 'normal' | 'under';

// ───────────────────────── Vidéos & chaînes ─────────────────────────

export interface Thumbnails {
  default?: string;
  medium?: string;
  high?: string;
  standard?: string;
  maxres?: string;
}

export interface YtVideo {
  id: string;
  channelId: string;
  channelTitle: string;
  title: string;
  description?: string;
  /** ISO 8601 (UTC). */
  publishedAt: string;
  /** Durée en secondes (sert à classer short ≤ 60 s vs long). */
  durationSec: number;
  views: number;
  likes?: number;
  comments?: number;
  thumbnails?: Thumbnails;
  tags?: string[];
  format: VideoFormat;
  /** status.madeForKids de l'API (exclusion YouTube Kids, §4). */
  madeForKids?: boolean;
}

export interface ChannelSnapshot {
  channelId: string;
  title: string;
  handle?: string;
  subscribers?: number;
  totalViews?: number;
  videoCount?: number;
  country?: string;
  thumbnails?: Thumbnails;
  /** Playlist « uploads » (UU…) pour lister les vidéos à 1 u/quota. */
  uploadsPlaylistId?: string;
}

/** Médiane des vues PAR format, sur la propre chaîne (base du ratio d'outlier). */
export interface FormatMedians {
  short: number;
  long: number;
}

/** Jeu de vidéos d'une chaîne + médianes calculées, prêt pour le moteur d'outliers. */
export interface ChannelVideoSet {
  channel: ChannelSnapshot;
  videos: YtVideo[];
  medians: FormatMedians;
  /** epoch ms — quand ce jeu a été récupéré (mémoire/cache). */
  fetchedAt: number;
}

// ───────────────────────── Outliers (cœur, §4) ─────────────────────────

export interface ScoredVideo {
  video: YtVideo;
  /** Vrai ratio HONNÊTE affiché : vues ÷ médiane du même format de SA chaîne. */
  ratio: number;
  /** Ratio PROJETÉ à maturité (ESTIMÉ) — sert à l'inclusion, jamais à l'affichage. */
  projectedRatio: number;
  /** Fraction des vues finales déjà accumulées selon l'âge, 0..1 (ESTIMÉ). */
  maturityFraction: number;
  /** Âge en jours (fractionnaire) au moment du calcul. */
  ageDays: number;
  /** Vidéo récente à démarrage fort (ratio brut faible mais projeté ≥ seuil), §4. */
  isEmerging: boolean;
  flag: OutlierFlag;
  /** Confiance selon âge + taille d'échantillon. */
  confidence: Confidence;
  /** Preuves lisibles « pourquoi » (§0.6) — impact + raison, pas qu'un score. */
  reasons: string[];
}

// ───────────────────────── Métriques étiquetées ─────────────────────────

/** Valeur numérique toujours accompagnée de son statut (réel/estimé/indispo). */
export interface LabeledMetric {
  status: DataStatus;
  value?: number;
  /** Unité d'affichage (%, vues, s…). */
  unit?: string;
  /** Source courte (ex : « Reporting API », « estimé vues/abonnés »). */
  source?: string;
  note?: string;
}

// ───────────────────────── Configuration (src/config) ─────────────────────────

export interface NicheDef {
  id: string;
  label: string;
  /** Requêtes de découverte / scan pour cette niche. */
  queries: string[];
  lang?: string;
  regionCode?: string;
}

export interface MyChannelDef {
  /** UC… ou @handle ou nom — RÉSOLU via l'API (jamais d'ID inventé, §0). */
  ref: string;
  label: string;
  nicheId: string;
  /** true tant que la vraie valeur n'a pas été renseignée. */
  placeholder?: boolean;
}

export interface CompetitorDef {
  /** @handle / UC… / nom / URL — résolu via l'API. */
  ref: string;
  label: string;
  nicheId?: string;
  note?: string;
  placeholder?: boolean;
}

export interface RegionPack {
  regionCode: string;
  label: string;
  queries: string[];
}

export interface AnchorChannel {
  ref: string;
  label: string;
  regionCode?: string;
  note?: string;
}

export interface ViralMechanic {
  id: string;
  label: string;
  /** Le concept réutilisable (adaptation FR, jamais une copie, §5). */
  description: string;
}

// ───────────────────────── Analyse de chaîne (service ↔ client) ─────────────────────────

export type AnalysisStatus = "ok" | "no-credentials" | "unconfigured" | "error";

export interface ChannelAnalysis {
  status: AnalysisStatus;
  message?: string;
  /** true si les données sont de DÉMONSTRATION (fictives, jamais réelles, §0). */
  demo?: boolean;
  source?: "oauth" | "apiKey";
  channel?: ChannelSnapshot;
  medians?: FormatMedians;
  scored?: ScoredVideo[];
  fetchedAt?: number;
}

// ───────────────────────── Concurrents (§5) ─────────────────────────

export interface CompetitorAnalysis {
  id: string;
  ref: string;
  label: string;
  status: "ok" | "unconfigured" | "error";
  message?: string;
  channel?: ChannelSnapshot;
  medians?: FormatMedians;
  scored?: ScoredVideo[];
  /** Scores ESTIMÉS (jamais réels, §0/§5). */
  scores?: { menace: number; inspiration: number; reasons: string[] };
  fetchedAt?: number;
}

export interface CompetitorsResult {
  demo?: boolean;
  hasCredentials: boolean;
  competitors: CompetitorAnalysis[];
}

export interface CompetitorOutlier {
  sv: ScoredVideo;
  competitorId: string;
  competitorLabel: string;
}

// ───────────────────────── Monde / niche / tendances (§5) ─────────────────────────

export interface WorldScored {
  video: YtVideo;
  channelSubs?: number;
  /** Score « monde » 0-100. L'anomalie = vues/abonnés (PROXY de découverte), donc ESTIMÉ. */
  score: number;
  velocity: number; // vues/jour
  anomaly: number; // vues/abonnés
  freshness: number; // 0-1
  smallChannel: number; // 0-1
  mechanic?: { id: string; label: string };
  reasons: string[];
}

export interface ScanResult {
  demo?: boolean;
  status: "ok" | "no-credentials" | "error";
  message?: string;
  items: WorldScored[];
}

export interface TrendsResult {
  demo?: boolean;
  status: "ok" | "no-credentials" | "error";
  message?: string;
  regionCode?: string;
  items: YtVideo[];
}

// ───────────────────────── Audit / CTR / Miniatures (§5) ─────────────────────────

export interface CtrReport {
  demo?: boolean;
  status: "ok" | "no-credentials" | "error";
  message?: string;
  ctr: LabeledMetric;
  retention: LabeledMetric;
  watchTimeMin?: LabeledMetric;
  views28?: LabeledMetric;
}

export interface AuditResult {
  demo?: boolean;
  status: "ok" | "no-credentials" | "unconfigured" | "error";
  message?: string;
  channelTitle?: string;
  report?: AuditReport;
}

export interface ThumbResult {
  demo?: boolean;
  status: "ok" | "error";
  message?: string;
  thumbUrl?: string;
  analysis?: ThumbAnalysis;
}

export interface IdeasResult {
  demo?: boolean;
  status: "ok" | "no-credentials" | "error";
  message?: string;
  usedLlm?: boolean;
  ideas: Idea[];
}

// ───────────────────────── Système : alertes / historique / diagnostic ─────────────────────────

export interface AlertsResult {
  demo?: boolean;
  status: "ok" | "no-credentials" | "error";
  message?: string;
  alerts: Alert[];
}

export interface CacheEntryInfo {
  key: string;
  savedAt: number;
  ttlMs: number;
  fresh: boolean;
  sizeBytes: number;
}

export interface HistoryResult {
  entries: CacheEntryInfo[];
}

export interface DiagnosticResult {
  env: {
    youtubeApiKey: boolean;
    oauth: boolean;
    anthropic: boolean;
    llmIdeas: boolean;
    ideasModel: string;
  };
  connectedChannels: { channelId: string; title: string }[];
  estimatedQuota: number;
  cacheEntries: number;
  freshCacheEntries: number;
}
