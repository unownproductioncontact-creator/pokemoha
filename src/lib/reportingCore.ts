// Cœur PUR de la Reporting API (§5) — parsing CSV + agrégation du CTR.
// Aucun I/O : 100 % testable. Le rapport channel_reach_basic_a1 fournit
// `video_thumbnail_impressions` (impressions de miniatures) et
// `video_thumbnail_impressions_ctr` (taux de clic). Le CTR agrégé correct est
// pondéré par les impressions : Σ(imp·ctr) / Σ(imp), et NON une moyenne des taux.

/** Métadonnées minimales d'un rapport listé par l'API (le reste est ignoré). */
export interface ReportMeta {
  /** Début de la plage de DONNÉES (jour couvert). Sert de clé de dédup. */
  startTime: string;
  /** Date de GÉNÉRATION : à jour égal, on garde le rapport le plus récent. */
  createTime: string;
  downloadUrl: string;
}

/** Découpe une ligne CSV en respectant les guillemets doubles (RFC 4180 léger). */
export function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQuotes = false;
      } else cur += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") {
      out.push(cur);
      cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out;
}

/**
 * Parse un CSV de rapport `channel_reach_basic_a1` et agrège impressions/clics.
 * Robuste à l'ordre/au nombre de colonnes : les métriques sont trouvées par NOM.
 * `clicks` est reconstruit ligne à ligne (imp·ctr) → permet une pondération
 * exacte lors de la combinaison de plusieurs jours.
 */
export function parseReachCsv(csv: string): { impressions: number; clicks: number } {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return { impressions: 0, clicks: 0 };

  const header = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const impIdx = header.indexOf("video_thumbnail_impressions");
  const ctrIdx = header.indexOf("video_thumbnail_impressions_ctr");
  if (impIdx < 0 || ctrIdx < 0) return { impressions: 0, clicks: 0 };

  let impressions = 0;
  let clicks = 0;
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    if (cols.length <= Math.max(impIdx, ctrIdx)) continue;
    const imp = Number(cols[impIdx]);
    const ctr = Number(cols[ctrIdx]);
    if (!Number.isFinite(imp) || imp <= 0) continue;
    impressions += imp;
    if (Number.isFinite(ctr) && ctr > 0) clicks += imp * ctr;
  }
  return { impressions, clicks };
}

/**
 * Sélectionne les rapports du fenêtrage : un seul par jour (le plus récemment
 * généré), triés du plus récent au plus ancien, limités à `windowDays`.
 */
export function pickReportsForWindow(
  reports: ReportMeta[],
  windowDays: number,
): ReportMeta[] {
  const latestPerDay = new Map<string, ReportMeta>();
  for (const r of reports) {
    if (!r.startTime || !r.downloadUrl) continue;
    const prev = latestPerDay.get(r.startTime);
    if (!prev || r.createTime > prev.createTime) latestPerDay.set(r.startTime, r);
  }
  return [...latestPerDay.values()]
    .sort((a, b) => (a.startTime < b.startTime ? 1 : a.startTime > b.startTime ? -1 : 0))
    .slice(0, Math.max(1, windowDays));
}

/**
 * Combine des (impressions, clics) journaliers en un CTR global pondéré.
 * `ctr` est une FRACTION (0..1) pour coller à la convention d'affichage
 * (formatPercent × 100). Normalise si la source exprimait un pourcentage.
 */
export function combineCtr(
  parts: Array<{ impressions: number; clicks: number }>,
): { impressions: number; clicks: number; ctr: number | null } {
  let impressions = 0;
  let clicks = 0;
  for (const p of parts) {
    impressions += p.impressions;
    clicks += p.clicks;
  }
  if (impressions <= 0) return { impressions: 0, clicks: 0, ctr: null };
  let ctr = clicks / impressions;
  if (ctr > 1) ctr /= 100; // garde-fou : source en % plutôt qu'en fraction
  return { impressions, clicks, ctr };
}
