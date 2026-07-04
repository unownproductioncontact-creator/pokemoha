import type { CompetitorDef } from '@/lib/types';

// ⚙️ PERSONNALISATION (§8) — concurrents de départ.
// Les `ref` sont des SEEDS (nom/@handle) résolus via l'API YouTube ; si une
// chaîne ne se résout pas, l'UI affiche « introuvable » (jamais de donnée
// inventée, §0). La découverte (DISCOVERY_QUERIES) en trouve d'autres en direct.

export const COMPETITORS: CompetitorDef[] = [
  { ref: 'Kiibiki', label: 'Kiibiki', nicheId: 'pokemon-tcg-fr', note: 'seed à vérifier', placeholder: true },
  { ref: 'Pokémoniteur', label: 'Pokémoniteur', nicheId: 'pokemon-tcg-fr', note: 'seed à vérifier', placeholder: true },
  { ref: 'Ilan du Bourg', label: 'Ilan du Bourg', nicheId: 'pokemon-tcg-fr', note: 'seed à vérifier', placeholder: true },
  { ref: 'Palette', label: 'Palette', nicheId: 'pokemon-tcg-fr', note: 'seed à vérifier', placeholder: true },
  { ref: 'Newtiteuf', label: 'Newtiteuf', nicheId: 'pokemon-tcg-fr', note: 'seed à vérifier', placeholder: true },
];

// Requêtes de découverte (§5 « découverte de chaînes similaires ») — coûteuses
// en quota (search.list = 100 u), donc à n'exécuter qu'à la demande + cache 24 h.
export const DISCOVERY_QUERIES: string[] = [
  'ouverture booster pokémon fr',
  'display pokémon ouverture',
  'pull pokémon carte',
  'carte pokémon rare',
  'investissement carte pokémon',
  'pokémon tcg français',
];
