// Génère les pages-stubs des onglets pas encore livrés (remplacées par phase).
// Idempotent : réécrit chaque page.tsx. N'écrase PAS les pages déjà réelles
// listées dans SKIP. Usage : node scripts/gen-stubs.mjs
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const APP = path.join(here, "..", "src", "app");

// Pages déjà réelles : ne pas régénérer en stub.
const SKIP = new Set(["/"]);

/** [route, titre, sous-titre, phase] */
const PAGES = [
  ["/alertes", "Alertes", "Feed actionnable : nouveaux outliers, chutes, fenêtres d'opportunité.", 9],
  ["/outliers", "Outliers", "Tes vidéos qui sur-performent vs ta propre médiane, par format.", 4],
  ["/outliers-youtube", "Outliers YouTube", "Scan d'environ 200 chaînes de ta niche pour repérer les anomalies.", 6],
  ["/outliers-monde", "Outliers du monde", "Scan international : régions, mostPopular, chaînes ancres, concurrents.", 6],
  ["/tendances", "Tendances", "mostPopular du moment. ⚠️ Pas de filtre par date possible côté API.", 6],
  ["/recherche", "Recherche approfondie", "Recherche libre dans YouTube, façon analyste.", 6],
  ["/audit", "Audit de chaîne", "Diagnostic complet : scores réel/estimé, reco preuve + impact + action.", 7],
  ["/ctr", "CTR", "CTR réel de tes chaînes (Reporting API). Concurrents = estimé.", 7],
  ["/hooks", "Hooks", "Accroches de titres qui fonctionnent dans ta niche.", 7],
  ["/miniatures", "Miniatures", "Analyse visuelle locale et gratuite (jpeg-js), sans IA.", 7],
  ["/optimiser", "Optimiser mes vidéos", "Recommandations concrètes, vidéo par vidéo.", 7],
  ["/concurrents", "Concurrents", "Suivi par URL/@handle/nom, fiches filtrables, scores Menace & Inspiration.", 5],
  ["/outliers-concurrents", "Outliers concurrents", "Top 50 des outliers récents de TOUS tes concurrents. 0 quota en plus.", 5],
  ["/idees-shorts", "Idées Virales Shorts", "Shorts de la niche par catégorie + détection « importable en FR ».", 8],
  ["/idees-jour", "Idées du jour", "Une sélection quotidienne synthétisée depuis tes outliers.", 8],
  ["/idees-top100", "Idées · Top 100", "Moteur local : scores qualité/opportunité, anti-déjà-vu.", 8],
  ["/analyser-idee", "Analyser une idée", "Idée brute → note/100 + escalade d'angle + ~30 titres (hors-ligne).", 8],
  ["/generateur-titres", "Générateur de titres", "Titres FR propres, prouvés par les accroches qui marchent.", 8],
  ["/titres-miniatures", "Titres & miniatures", "Comparatif A/B de titres et de miniatures.", 8],
  ["/historique", "Historique", "Toutes tes analyses passées, issues du cache local.", 9],
  ["/diagnostic", "Diagnostic", "Ping connexion + état des APIs et du quota.", 9],
  ["/parametres", "Paramètres", "Clés, thème, niches, options du moteur d'idées.", 9],
];

let written = 0;
for (const [route, title, subtitle, phase] of PAGES) {
  if (SKIP.has(route)) continue;
  const dir = path.join(APP, route.replace(/^\//, ""));
  const file = path.join(dir, "page.tsx");
  if (existsSync(file)) continue; // ne pas écraser une page déjà réelle
  mkdirSync(dir, { recursive: true });
  const body =
    `import { Placeholder } from "@/components/Placeholder";\n\n` +
    `export default function Page() {\n` +
    `  return (\n` +
    `    <Placeholder\n` +
    `      title={${JSON.stringify(title)}}\n` +
    `      subtitle={${JSON.stringify(subtitle)}}\n` +
    `      phase={${phase}}\n` +
    `    />\n` +
    `  );\n` +
    `}\n`;
  writeFileSync(file, body);
  written++;
}
console.log(`stubs écrits : ${written}/${PAGES.length}`);
