// Navigation des 23 onglets (§5), groupée ANALYSE / OPTIMISER / CRÉER / SYSTÈME.
// `icon` = clé résolue dans components/icons.tsx (config = données pures, pas de JSX).

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
    id: "analyse",
    label: "Analyse",
    items: [
      // Libellés : le mot de PORTÉE d'abord (mes vidéos / ma niche / monde /
      // concurrents) — audit UX F001, l'utilisateur ne doit plus interpréter.
      { href: "/", label: "Dashboard", icon: "grid" },
      { href: "/alertes", label: "Alertes", icon: "bell" },
      { href: "/outliers", label: "Mes outliers", icon: "flame" },
      { href: "/outliers-youtube", label: "Outliers de ma niche", icon: "youtube" },
      { href: "/outliers-monde", label: "Outliers monde", icon: "globe" },
      { href: "/concurrents", label: "Concurrents", icon: "users" },
      { href: "/outliers-concurrents", label: "Outliers concurrents", icon: "target" },
      { href: "/tendances", label: "Tendances", icon: "trend" },
      { href: "/recherche", label: "Recherche", icon: "search" },
    ],
  },
  {
    id: "optimiser",
    label: "Optimiser",
    items: [
      { href: "/audit", label: "Audit de chaîne", icon: "gauge" },
      { href: "/ctr", label: "CTR", icon: "cursor" },
      { href: "/hooks", label: "Hooks", icon: "quote" },
      { href: "/miniatures", label: "Miniatures", icon: "image" },
      { href: "/optimiser", label: "Optimiser mes vidéos", icon: "sliders" },
    ],
  },
  {
    id: "creer",
    label: "Créer",
    items: [
      { href: "/idees-shorts", label: "Idées Virales Shorts", icon: "short" },
      { href: "/idees-jour", label: "Idées du jour", icon: "bulb" },
      { href: "/idees-top100", label: "Idées · Top 100", icon: "list" },
      { href: "/analyser-idee", label: "Analyser une idée", icon: "scan" },
      { href: "/generateur-titres", label: "Générateur de titres", icon: "type" },
      { href: "/titres-miniatures", label: "Titres & miniatures", icon: "ab" },
    ],
  },
  {
    id: "systeme",
    label: "Système",
    items: [
      { href: "/historique", label: "Historique", icon: "history" },
      { href: "/diagnostic", label: "Diagnostic", icon: "pulse" },
      { href: "/parametres", label: "Paramètres", icon: "settings" },
    ],
  },
];
