// Navigation (audit UX F001) : 23 écrans → 10 hubs. Chaque hub pointe vers son
// 1er segment ; une barre de segments (SegmentNav) en haut des pages permet de
// basculer entre les écrans d'un même hub. Groupée Quotidien / Analyse / Créer /
// Système. `icon` = clé résolue dans components/icons.tsx.

export interface NavItem {
  href: string;
  label: string;
  icon: string;
}
export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

export const NAV: NavGroup[] = [
  {
    id: "quotidien",
    label: "Quotidien",
    items: [
      { href: "/", label: "Aujourd'hui", icon: "grid" },
      { href: "/alertes", label: "Alertes", icon: "bell" },
      { href: "/outliers", label: "Mes outliers", icon: "flame" },
      { href: "/idees-jour", label: "Idées", icon: "bulb" },
    ],
  },
  {
    id: "analyse",
    label: "Analyse",
    items: [
      { href: "/outliers-youtube", label: "Radar niche", icon: "globe" },
      { href: "/concurrents", label: "Concurrents", icon: "users" },
      { href: "/audit", label: "Ma chaîne", icon: "gauge" },
    ],
  },
  {
    id: "creer",
    label: "Créer",
    items: [
      { href: "/analyser-idee", label: "Créer une vidéo", icon: "type" },
      { href: "/optimiser", label: "Optimiser mes vidéos", icon: "sliders" },
    ],
  },
  {
    id: "systeme",
    label: "Système",
    items: [{ href: "/parametres", label: "Paramètres", icon: "settings" }],
  },
];
