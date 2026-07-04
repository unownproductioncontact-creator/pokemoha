import type { RegionPack, AnchorChannel, ViralMechanic } from '@/lib/types';

// ⚙️ PERSONNALISATION (§5/§8) — « Outliers du monde ».
// Packs de recherche par région + chaînes ancres internationales + mécaniques
// virales (concepts réutilisables, JAMAIS des copies). Refs = seeds résolus API.

export const REGION_PACKS: RegionPack[] = [
  { regionCode: 'US', label: 'États-Unis', queries: ['pokemon tcg', 'pokemon cards opening', 'pokemon pull', 'pokemon booster box'] },
  { regionCode: 'JP', label: 'Japon', queries: ['ポケモンカード', 'ポケカ 開封', 'ポケモンカード 開封'] },
  { regionCode: 'GB', label: 'Royaume-Uni', queries: ['pokemon tcg uk', 'pokemon cards opening'] },
  { regionCode: 'DE', label: 'Allemagne', queries: ['pokemon karten öffnen', 'pokemon display'] },
  { regionCode: 'ES', label: 'Espagne', queries: ['cartas pokemon apertura', 'sobres pokemon'] },
  { regionCode: 'IT', label: 'Italie', queries: ['carte pokemon apertura', 'bustine pokemon'] },
  { regionCode: 'BR', label: 'Brésil', queries: ['cartas pokemon abertura', 'pokemon booster'] },
];

export const ANCHOR_CHANNELS: AnchorChannel[] = [
  { ref: 'PokeRev', label: 'PokeRev', regionCode: 'US', note: 'seed à vérifier' },
  { ref: 'UnlistedLeaf', label: 'UnlistedLeaf', regionCode: 'US', note: 'seed à vérifier' },
  { ref: 'Leonhart', label: 'Leonhart', regionCode: 'US', note: 'seed à vérifier' },
  { ref: 'RealBreakingNick', label: 'RealBreakingNick', regionCode: 'NL', note: 'seed à vérifier' },
];

// Mécaniques virales = pourquoi ça marche (adaptation FR, §5).
export const VIRAL_MECHANICS: ViralMechanic[] = [
  { id: 'high-stakes', label: 'Mise extrême', description: 'Ouvrir un produit très cher / rare / vintage (carton scellé, 1re édition) — enjeu financier visible.' },
  { id: 'numbered-challenge', label: 'Défi chiffré', description: "Un objectif quantifié dans le titre (« j'ouvre pour 1000 € », « 100 boosters ») — promesse claire et mesurable." },
  { id: 'card-hunt', label: 'Chasse à la carte', description: 'Quête d\'UNE carte précise (chase) — tension « je l\'ai eue ou pas » jusqu\'au bout.' },
  { id: 'nostalgia', label: 'Nostalgie / vintage', description: 'Produits d\'enfance / sets cultes — déclencheur émotionnel fort, audience large.' },
  { id: 'verdict-test', label: 'Test & verdict', description: 'Comparer des produits et trancher « lequel vaut le coup » — utilité d\'achat concrète.' },
  { id: 'social-stakes', label: 'Enjeu social', description: 'Pari / gage / duel à plusieurs — drama et rejouabilité, format récurrent.' },
  { id: 'story-arc', label: 'Récit / arc narratif', description: 'Une histoire qui progresse d\'épisode en épisode (build-up, paiement) — rétention et fidélité.' },
];
