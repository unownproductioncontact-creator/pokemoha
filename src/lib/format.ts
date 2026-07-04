// Formatage FR. PUR & autonome → testable, et utilisable côté client (pas d'I/O).

function dec(x: number): string {
  const r = Math.round(x * 10) / 10;
  return (Number.isInteger(r) ? r.toString() : r.toFixed(1)).replace(".", ",");
}

/** Nombre compact FR : 1234 → « 1,2 k », 1 500 000 → « 1,5 M ». */
export function formatCompact(n: number): string {
  if (!Number.isFinite(n)) return "—";
  const sign = n < 0 ? "-" : "";
  const a = Math.abs(n);
  if (a >= 1e9) return sign + dec(a / 1e9) + " Md";
  if (a >= 1e6) return sign + dec(a / 1e6) + " M";
  if (a >= 1e3) return sign + dec(a / 1e3) + " k";
  return sign + Math.round(a).toString();
}

/** Entier avec séparateur de milliers (espace fine insécable). */
export function formatInt(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/** Ratio d'outlier : 3 → « 3× », 1,25 → « 1,3× ». */
export function formatRatio(r: number): string {
  if (!Number.isFinite(r) || r <= 0) return "—";
  return dec(r) + "×";
}

export function formatPercent(x: number, digits = 0): string {
  if (!Number.isFinite(x)) return "—";
  return (x * 100).toFixed(digits).replace(".", ",") + " %";
}
