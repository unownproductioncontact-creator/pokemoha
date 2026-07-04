// Analyse des accroches de titres (§5 « Hooks »). PUR & autonome → testable.
// Détecte les motifs présents dans les titres performants et leur « lift »
// (ratio moyen avec le motif ÷ sans le motif).

export interface HookPattern {
  id: string;
  label: string;
  count: number;
  share: number; // part des titres analysés
  avgRatioWith: number;
  avgRatioWithout: number;
  lift: number; // avgWith / avgWithout
  examples: string[];
}

export interface HookAnalysis {
  total: number;
  patterns: HookPattern[];
  powerWords: { word: string; count: number }[];
}

interface Detector {
  id: string;
  label: string;
  test: (t: string) => boolean;
}

const DETECTORS: Detector[] = [
  { id: "number", label: "Un chiffre (10, 1re, 200…)", test: (t) => /\d/.test(t) },
  {
    id: "money",
    label: "Un montant (€/$)",
    test: (t) => /(\d+\s?[€$]|[€$]\s?\d+)/.test(t),
  },
  {
    id: "emoji",
    label: "Un emoji",
    test: (t) => /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(t),
  },
  {
    id: "brackets",
    label: "Crochets / parenthèses",
    test: (t) => /[[\](){}]/.test(t),
  },
  { id: "question", label: "Une question", test: (t) => /\?/.test(t) },
  {
    id: "caps",
    label: "Un mot en MAJUSCULES",
    test: (t) => /\b[A-ZÀ-Ÿ]{3,}\b/.test(t),
  },
  {
    id: "superlative",
    label: "Un superlatif (énorme, incroyable…)",
    test: (t) =>
      /(plus|meilleur|[ée]norme|incroyable|fou|jamais|ultime|insane|secret|choquant|dingue|record)/i.test(
        t,
      ),
  },
  {
    id: "personal",
    label: "Adresse au spectateur (tu / vous)",
    test: (t) => /\b(tu|toi|ton|ta|tes|vous|votre)\b/i.test(t),
  },
  {
    id: "curiosity",
    label: "Curiosity gap (ce que, pourquoi…)",
    test: (t) =>
      /(ce que|pourquoi|comment|voici|le secret|tu vas|vous n'allez)/i.test(t),
  },
];

/** Renvoie les ids de motifs présents dans un titre (pour « Optimiser mes vidéos »). */
export function detectHookPatterns(title: string): string[] {
  return DETECTORS.filter((d) => d.test(title)).map((d) => d.id);
}

const STOP = new Set([
  "le", "la", "les", "un", "une", "des", "de", "du", "et", "en", "pour", "sur",
  "dans", "mon", "ma", "mes", "ce", "cette", "je", "qui", "que", "avec", "plus",
  "est", "son", "sa", "the", "for", "you", "your",
]);

function mean(a: number[]): number {
  return a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0;
}

export function analyzeHooks(
  items: { title: string; ratio: number }[],
): HookAnalysis {
  const total = items.length;
  const patterns: HookPattern[] = DETECTORS.map((d) => {
    const withIt = items.filter((i) => d.test(i.title));
    const without = items.filter((i) => !d.test(i.title));
    const avgWith = mean(withIt.map((i) => i.ratio));
    const avgWithout = mean(without.map((i) => i.ratio));
    return {
      id: d.id,
      label: d.label,
      count: withIt.length,
      share: total ? withIt.length / total : 0,
      avgRatioWith: avgWith,
      avgRatioWithout: avgWithout,
      lift: avgWithout > 0 ? avgWith / avgWithout : avgWith > 0 ? Infinity : 0,
      examples: [...withIt]
        .sort((a, b) => b.ratio - a.ratio)
        .slice(0, 2)
        .map((i) => i.title),
    };
  });

  patterns.sort((a, b) => {
    const la = a.lift === Infinity ? 9 : a.lift;
    const lb = b.lift === Infinity ? 9 : b.lift;
    return lb - la || b.count - a.count;
  });

  const counts = new Map<string, number>();
  for (const i of items) {
    for (const w of i.title
      .toLowerCase()
      .split(/[^a-zà-ÿ0-9]+/)
      .filter((w) => w.length >= 4 && !STOP.has(w))) {
      counts.set(w, (counts.get(w) ?? 0) + 1);
    }
  }
  const powerWords = [...counts.entries()]
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  return { total, patterns, powerWords };
}
