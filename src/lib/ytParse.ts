// Parsing pur YouTube : durées ISO8601, classification de format, extraction
// de référence de chaîne. AUTONOME (aucun import runtime local) → testable
// par `node --test` (§7).

// Heuristique Short ≤ 60 s. Les Shorts peuvent aller jusqu'à ~3 min, mais sans
// signal d'aspect dans l'API Data v3, 60 s reste le seuil le plus fiable.
// Ajustable ici sans toucher au reste.
export const SHORT_MAX_SEC = 60;

const DURATION_RE =
  /^P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/;

/** Durée ISO8601 (PT1H2M3S, P1DT2H…) → secondes. 0 si invalide. */
export function parseISO8601Duration(iso: string): number {
  if (typeof iso !== "string") return 0;
  const m = iso.match(DURATION_RE);
  if (!m) return 0;
  const [, w, d, h, mi, s] = m;
  return n(w) * 604800 + n(d) * 86400 + n(h) * 3600 + n(mi) * 60 + n(s);
}
function n(v: string | undefined): number {
  return v ? parseInt(v, 10) : 0;
}

/** Durée inconnue (0) → traitée comme « long » pour ne pas polluer les Shorts. */
export function classifyFormat(durationSec: number): "short" | "long" {
  return durationSec > 0 && durationSec <= SHORT_MAX_SEC ? "short" : "long";
}

export type ChannelRefKind = "id" | "handle" | "username" | "query";
export interface ChannelRef {
  kind: ChannelRefKind;
  value: string;
}

const URL_RE =
  /youtube\.com\/(?:channel\/(UC[\w-]{20,})|(@[\w.\-]+)|(?:c|user)\/([\w.\-]+))/i;

/**
 * Détermine la façon la moins coûteuse d'identifier une chaîne (§2 quota) :
 * - id / handle / username → channels.list (1 u)
 * - query (texte libre) → search.list (100 u), en dernier recours.
 */
export function extractChannelRef(input: string): ChannelRef {
  const raw = (input ?? "").trim();
  if (!raw) return { kind: "query", value: "" };
  const um = raw.match(URL_RE);
  if (um) {
    if (um[1]) return { kind: "id", value: um[1] };
    if (um[2]) return { kind: "handle", value: um[2] };
    if (um[3]) return { kind: "username", value: um[3] };
  }
  if (/^@[\w.\-]+$/.test(raw)) return { kind: "handle", value: raw };
  if (/^UC[\w-]{20,}$/.test(raw)) return { kind: "id", value: raw };
  return { kind: "query", value: raw };
}
