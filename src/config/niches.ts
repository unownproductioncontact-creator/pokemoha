import type { NicheDef } from '@/lib/types';

// ⚙️ PERSONNALISATION (§8). Tout le reste de l'app est AGNOSTIQUE : seules ces
// valeurs décrivent ta niche. Seedé Pokémon TCG FR — modifie librement.

export const NICHES: NicheDef[] = [
  {
    id: 'pokemon-tcg-fr',
    label: 'Pokémon TCG (FR)',
    lang: 'fr',
    regionCode: 'FR',
    queries: [
      'pokémon tcg',
      'ouverture booster pokémon',
      'display pokémon',
      'carte pokémon',
      'pull pokémon',
      'coffret pokémon',
      'etb pokémon',
      'sealed pokémon',
    ],
  },
];

export const DEFAULT_NICHE_ID = NICHES[0].id;

export function getNiche(id: string): NicheDef | undefined {
  return NICHES.find((n) => n.id === id);
}
