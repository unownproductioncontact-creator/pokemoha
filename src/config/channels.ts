import type { MyChannelDef } from '@/lib/types';

// ⚙️ PERSONNALISATION (§8) — TES chaînes.
// ⚠️ PLACEHOLDER : remplace `ref` par l'ID (UC…) ou le @handle de ta chaîne.
// La connexion OAuth résout de toute façon la vraie chaîne connectée ; cette
// liste sert de niche par défaut + repli hors-ligne. Aucun ID n'est inventé (§0).

export const MY_CHANNELS: MyChannelDef[] = [
  {
    ref: '@Pokemoha', // https://www.youtube.com/@Pokemoha
    label: 'Pokémoha',
    nicheId: 'pokemon-tcg-fr',
  },
];

export const DEFAULT_CHANNEL_REF = MY_CHANNELS[0].ref;
