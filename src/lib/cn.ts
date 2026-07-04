// Concatène des classes conditionnelles sans dépendance (clsx-like minimal).
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
