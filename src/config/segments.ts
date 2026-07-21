// Regroupement des écrans en « hubs » à segments (audit UX F001, volet 2).
// La sidebar ne montre qu'UNE entrée par hub ; une barre de segments en haut de
// chaque page du hub permet de basculer. Les routes restent inchangées (sûr).

export interface Segment {
  href: string;
  label: string;
}
export interface SegmentGroup {
  id: string;
  title: string;
  segments: Segment[];
}

export const SEGMENT_GROUPS: SegmentGroup[] = [
  {
    id: "idees",
    title: "Idées",
    segments: [
      { href: "/idees-jour", label: "Du jour" },
      { href: "/idees-top100", label: "Top 100" },
      { href: "/idees-shorts", label: "Shorts viraux" },
    ],
  },
  {
    id: "radar",
    title: "Radar niche",
    segments: [
      { href: "/outliers-youtube", label: "Ma niche" },
      { href: "/outliers-monde", label: "Monde" },
      { href: "/tendances", label: "Tendances" },
      { href: "/recherche", label: "Recherche" },
    ],
  },
  {
    id: "chaine",
    title: "Ma chaîne",
    segments: [
      { href: "/audit", label: "Audit" },
      { href: "/ctr", label: "CTR & rétention" },
      { href: "/hooks", label: "Hooks" },
    ],
  },
  {
    id: "concurrents",
    title: "Concurrents",
    segments: [
      { href: "/concurrents", label: "Chaînes suivies" },
      { href: "/outliers-concurrents", label: "Leurs outliers" },
    ],
  },
  {
    id: "creer",
    title: "Créer une vidéo",
    segments: [
      { href: "/analyser-idee", label: "Angle & note" },
      { href: "/generateur-titres", label: "Titres" },
      { href: "/titres-miniatures", label: "A/B titres" },
      { href: "/miniatures", label: "Miniature" },
    ],
  },
];

/** Groupe contenant une route donnée (ou undefined). */
export function segmentGroupFor(pathname: string): SegmentGroup | undefined {
  return SEGMENT_GROUPS.find((g) =>
    g.segments.some((s) => s.href === pathname),
  );
}
