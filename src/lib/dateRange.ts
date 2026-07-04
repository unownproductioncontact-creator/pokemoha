// Helpers de dates. Toutes les LECTURES D'HORLOGE (now/currentRange) sont
// isolées ici pour qu'aucun composant React n'appelle Date.now()/new Date()
// pendant le rendu (règle eslint react-hooks/purity, §7).
//
// Les fonctions de calcul prennent `nowMs` en paramètre explicite → pures &
// testables. `currentRange()`/`now()` lisent l'horloge et s'appellent HORS
// rendu (handler d'événement, code serveur, init de module).

export const DAY_MS = 86_400_000;

/** Fenêtres de dates proposées (jours). 0 = tout l'historique. */
export type DateWindowDays = 7 | 14 | 30 | 90 | 180 | 365 | 0;

export const DATE_WINDOWS: { value: DateWindowDays; label: string }[] = [
  { value: 7, label: '7 jours' },
  { value: 14, label: '14 jours' },
  { value: 30, label: '30 jours' },
  { value: 90, label: '90 jours' },
  { value: 180, label: '6 mois' },
  { value: 365, label: '1 an' },
  { value: 0, label: 'Tout' },
];

/** Lecture d'horloge unique — à appeler HORS rendu. */
export function currentRange(): { now: number } {
  return { now: Date.now() };
}

/** epoch ms courant — à appeler HORS rendu. */
export function now(): number {
  return Date.now();
}

/** Âge en jours (fractionnaire). Date invalide ⇒ +Infinity (jamais récente). */
export function ageDays(publishedAtIso: string, nowMs: number): number {
  const t = Date.parse(publishedAtIso);
  if (Number.isNaN(t)) return Number.POSITIVE_INFINITY;
  return Math.max(0, (nowMs - t) / DAY_MS);
}

export function withinWindow(
  publishedAtIso: string,
  windowDays: DateWindowDays,
  nowMs: number,
): boolean {
  if (windowDays === 0) return true;
  return ageDays(publishedAtIso, nowMs) <= windowDays;
}

/** Filtre une liste datée par fenêtre. AVANT tout plafonnement (§4). */
export function filterByWindow<T extends { publishedAt: string }>(
  items: T[],
  windowDays: DateWindowDays,
  nowMs: number,
): T[] {
  if (windowDays === 0) return items.slice();
  return items.filter((it) => withinWindow(it.publishedAt, windowDays, nowMs));
}

/** Formate un âge en libellé court FR (« 3 j », « 5 sem », « 2 mois »). */
export function ageLabel(days: number): string {
  if (!Number.isFinite(days)) return '—';
  if (days < 1) return "aujourd'hui";
  if (days < 14) return `${Math.round(days)} j`;
  if (days < 60) return `${Math.round(days / 7)} sem`;
  if (days < 365) return `${Math.round(days / 30)} mois`;
  return `${(days / 365).toFixed(1)} an`;
}
