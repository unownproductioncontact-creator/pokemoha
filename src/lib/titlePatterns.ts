// Modèles de titres APPRIS de vrais titres outliers (§6, extension data-driven).
// PUR & autonome (import type only) → testable + utilisable côté client.
//
// Principe : on prend un vrai titre qui a sur-performé (le mien ou d'un concurrent),
// on remplace son « sujet » (la plus longue suite de mots de contenu) par le
// marqueur {X}, ce qui isole l'OSSATURE d'accroche transférable. On réinjecte
// ensuite le sujet de l'utilisateur dans {X}. Aucune donnée inventée : chaque
// modèle garde son titre d'origine + son ratio comme preuve (§0).

import type { TitlePattern } from "./types";

/** Mots vides — ni sujet, ni accroche : on les garde comme ossature. */
const STOP = new Set([
  "le", "la", "les", "un", "une", "des", "de", "du", "d", "et", "en", "pour",
  "sur", "dans", "ce", "cette", "ces", "qui", "que", "quoi", "avec", "plus",
  "sans", "au", "aux", "à", "mais", "ou", "où", "si", "ne", "pas", "the",
  "for", "you", "your", "a", "my", "of", "to", "is", "it",
]);

/** Mots d'accroche / objets récurrents (TCG) : ossature transférable, PAS le sujet. */
const HOOK = new Set([
  // pronoms / auxiliaires
  "j", "je", "tu", "on", "nous", "vous", "ai", "as", "ont", "est", "sont",
  "me", "te", "se", "mon", "ma", "mes", "ton", "ta", "tes", "son", "sa", "ses",
  // verbes d'accroche
  "ouvre", "ouvert", "ouvrir", "teste", "testé", "tester", "essaie", "essayé",
  "achète", "acheté", "acheter", "dépense", "dépensé", "trouve", "trouvé",
  "trouver", "cherche", "montre", "révèle", "révélé", "découvre", "découvert",
  "explique", "compare", "classe", "note", "ouvrent", "explose", "explosent",
  "cartonne", "arrive", "arrivent", "revient", "débarque", "existe", "marche",
  "fonctionne", "change",
  // mots interrogatifs / d'amorce (préfixes d'accroche très courants)
  "pourquoi", "comment", "quand", "combien", "quel", "quelle", "quels",
  "quelles", "voici", "voilà", "attention", "stop", "alerte", "urgent",
  "exclusif", "avis", "unboxing", "review", "guide", "astuce", "astuces",
  "erreur", "erreurs",
  // adjectifs / noms d'accroche
  "top", "meilleur", "meilleure", "meilleurs", "pire", "pires", "secret",
  "secrets", "nouveau", "nouvelle", "nouveaux", "gros", "grosse", "énorme",
  "incroyable", "dingue", "fou", "folle", "ultime", "rare", "rarissime",
  "graal", "résultat", "surprise", "jamais", "enfin", "personne", "tout",
  "monde", "vraiment", "vaut", "coup", "minutes", "heure", "euros", "jour",
  "défi", "challenge",
  // objets TCG
  "display", "displays", "booster", "boosters", "box", "boîte", "coffret",
  "coffrets", "etb", "upc", "bundle", "blister", "blisters", "carte", "cartes",
  "pull", "pulls", "deck", "decks", "collection",
]);

interface Seg {
  text: string;
  word: boolean;
}

function tokenize(s: string): Seg[] {
  const segs: Seg[] = [];
  const re = /[\p{L}\p{N}]+/gu;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) {
    if (m.index > last) segs.push({ text: s.slice(last, m.index), word: false });
    segs.push({ text: m[0], word: true });
    last = m.index + m[0].length;
  }
  if (last < s.length) segs.push({ text: s.slice(last), word: false });
  return segs;
}

/** Un mot est « sujet » (candidat à {X}) s'il n'est ni vide, ni accroche, ni nombre. */
function isTopicWord(w: string): boolean {
  if (/^\d+$/.test(w)) return false; // nombres (« top 10 », « 100 boosters ») = ossature
  const lw = w.toLowerCase();
  if (lw.length < 3) return false;
  return !STOP.has(lw) && !HOOK.has(lw);
}

/** Un séparateur laisse un « run » de sujet se poursuivre s'il ne contient que
 *  des liants (espaces, &, apostrophes, tirets, slash) — sinon il le coupe. */
function isConnector(sep: string): boolean {
  return sep.replace(/[\s&'’/\-]/g, "") === "";
}

/**
 * Induit un modèle en remplaçant la plus longue suite de mots-sujet par {X}.
 * Renvoie null si aucune ossature exploitable (titre 100 % sujet, ou trop court).
 */
export function inducePattern(title: string): string | null {
  const segs = tokenize(title || "");
  // Collecte les runs de mots-sujet [start..end] (bornes = mots), puis prend le
  // plus long. On accumule dans un tableau (pas de closure-qui-mute → TS heureux).
  const runs: { start: number; end: number; count: number }[] = [];
  let runStart: number | null = null;
  let runEnd = -1;
  let runCount = 0;
  const flush = () => {
    if (runStart !== null)
      runs.push({ start: runStart, end: runEnd, count: runCount });
    runStart = null;
    runEnd = -1;
    runCount = 0;
  };
  for (let i = 0; i < segs.length; i++) {
    const seg = segs[i];
    if (seg.word) {
      if (isTopicWord(seg.text)) {
        if (runStart === null) runStart = i;
        runEnd = i;
        runCount++;
      } else flush(); // mot d'ossature → coupe le run
    } else if (!isConnector(seg.text)) {
      flush(); // ponctuation forte → coupe le run
    }
  }
  flush();

  if (runs.length === 0) return null;
  const b = runs.reduce((a, c) => (c.count > a.count ? c : a));
  const rebuilt = [
    ...segs.slice(0, b.start),
    { text: "{X}", word: true } as Seg,
    ...segs.slice(b.end + 1),
  ];
  const template = rebuilt
    .map((s) => s.text)
    .join("")
    .replace(/\s{2,}/g, " ")
    .trim();

  // Garde-fous qualité : doit contenir {X} + au moins 2 mots d'ossature restants.
  if (!template.includes("{X}")) return null;
  const scaffoldWords = tokenize(template).filter(
    (s) => s.word && s.text !== "X",
  ).length;
  // tokenize sépare {X} en « X » (mot) → on le déduit du compte.
  if (scaffoldWords - 1 < 2) return null;
  if (template.replace("{X}", "").trim().length < 4) return null;
  return template;
}

/** Supprime les mots d'OSSATURE répétés (garde le 1er), même non adjacents —
 *  ex. sujet « ouverture display X » dans « … un display {X} » → un seul « display ».
 *  Ne touche jamais aux mots-sujet (un vrai titre peut légitimement les répéter). */
function collapseRepeatedHooks(title: string): string {
  const segs = tokenize(title);
  const seen = new Set<string>();
  const out: Seg[] = [];
  for (const s of segs) {
    if (s.word) {
      const lw = s.text.toLowerCase();
      if (HOOK.has(lw)) {
        if (seen.has(lw)) {
          // Retire aussi l'espace qui précède le mot supprimé.
          const prev = out[out.length - 1];
          if (prev && !prev.word && /^\s+$/.test(prev.text)) out.pop();
          continue;
        }
        seen.add(lw);
      }
    }
    out.push(s);
  }
  return out
    .map((s) => s.text)
    .join("")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Réinjecte le sujet dans un modèle. Nettoie espaces, doublons, capitale. */
export function applyPattern(template: string, subject: string): string | null {
  const s = (subject || "").trim();
  if (!s || !template.includes("{X}")) return null;
  let out = template.replace("{X}", s).replace(/\s{2,}/g, " ").trim();
  out = out.replace(/\b(\p{L}+)(\s+)\1\b/giu, "$1"); // dup adjacent (tout mot)
  out = collapseRepeatedHooks(out); // dup mots d'ossature non adjacents
  if (!out) return null;
  return out.charAt(0).toUpperCase() + out.slice(1);
}

export interface DataDrivenTitle {
  title: string;
  source: "mine" | "competitor";
  sourceLabel: string;
  strength: number;
  isShort: boolean;
  original: string;
}

/**
 * Construit les titres data-driven : applique le sujet à chaque modèle appris,
 * dédoublonne, écarte ceux qui n'ajoutent rien, trie par preuve (ratio) décroissante.
 */
export function buildDataDrivenTitles(
  subject: string,
  patterns: TitlePattern[],
  opts: { n?: number } = {},
): DataDrivenTitle[] {
  const subjKey = (subject || "").trim().toLowerCase();
  const seen = new Set<string>();
  const res: DataDrivenTitle[] = [];
  for (const p of [...patterns].sort((a, b) => b.strength - a.strength)) {
    const title = applyPattern(p.template, subject);
    if (!title) continue;
    const key = title.toLowerCase();
    if (key === subjKey || seen.has(key)) continue; // rien ajouté / doublon
    seen.add(key);
    res.push({
      title,
      source: p.source,
      sourceLabel: p.sourceLabel,
      strength: p.strength,
      isShort: p.isShort,
      original: p.original,
    });
  }
  return res.slice(0, opts.n ?? 18);
}
