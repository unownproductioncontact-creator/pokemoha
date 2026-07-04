import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pokémoha — Directeur YouTube IA",
    short_name: "Pokémoha",
    description:
      "Audit de chaînes, détection d'outliers et idées prouvées par la data. 100% local et privé.",
    start_url: "/",
    display: "standalone",
    background_color: "#09090d",
    theme_color: "#6d5cff",
    lang: "fr",
    dir: "ltr",
    categories: ["productivity", "utilities"],
    icons: [
      { src: "/icon", sizes: "64x64", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
