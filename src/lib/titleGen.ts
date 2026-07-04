// Générateur de titres FR (§6). PUR & autonome → testable & utilisable côté
// client (hors-ligne, gratuit). Combine des modèles d'accroche éprouvés avec
// les mots-clés de l'idée.

const STOP = new Set([
  "le", "la", "les", "un", "une", "des", "de", "du", "et", "en", "pour", "sur",
  "dans", "mon", "ma", "mes", "ce", "cette", "je", "qui", "que", "avec", "plus",
  "est", "son", "sa", "au", "aux", "the", "for", "you", "your", "a", "à",
]);

export function keywordsOf(text: string): string[] {
  return (text || "")
    .toLowerCase()
    .split(/[^a-zà-ÿ0-9]+/)
    .filter((w) => w.length >= 3 && !STOP.has(w));
}

function cap(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

const TEMPLATES: ((k: string) => string)[] = [
  (k) => `J'ai testé ${k} (le résultat va te surprendre)`,
  (k) => `${cap(k)} : ce que personne ne te dit`,
  (k) => `J'ouvre ${k} jusqu'à trouver LE graal`,
  (k) => `Pourquoi ${k} explose en ce moment`,
  (k) => `${cap(k)} — mon plus gros pull ?`,
  (k) => `J'ai dépensé 1000 € en ${k}`,
  (k) => `Le secret de ${k} (enfin révélé)`,
  (k) => `${cap(k)} : ça vaut vraiment le coup ?`,
  (k) => `10 minutes de ${k} = ce résultat`,
  (k) => `Tout le monde se trompe sur ${k}`,
  (k) => `${cap(k)} : du pire au meilleur`,
  (k) => `J'ai ouvert 100 × ${k}`,
  (k) => `${cap(k)}, mais je ne m'arrête pas avant LA carte`,
  (k) => `Personne ne fait ça avec ${k}…`,
];

export interface TitleGenOptions {
  n?: number;
}

export function generateTitles(idea: string, opts: TitleGenOptions = {}): string[] {
  const kws = keywordsOf(idea);
  const cores = [
    kws.slice(0, 3).join(" "),
    kws[0] ?? "",
    kws.slice(0, 2).join(" "),
    (idea || "").trim(),
  ].filter((c) => c && c.length > 0);
  const uniqueCores = [...new Set(cores)].slice(0, 3);
  if (uniqueCores.length === 0) uniqueCores.push("cette idée");

  const seen = new Set<string>();
  const res: string[] = [];
  for (const core of uniqueCores) {
    for (const t of TEMPLATES) {
      const title = t(core);
      const key = title.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        res.push(title);
      }
    }
  }
  return res.slice(0, opts.n ?? 30);
}
