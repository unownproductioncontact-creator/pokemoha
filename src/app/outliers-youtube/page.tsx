import { ScanPage } from "@/components/ScanPage";

export default function Page() {
  return (
    <ScanPage
      kind="niche"
      title="Outliers de ma niche"
      subtitle="Les vidéos qui explosent dans ta niche, classées par anomalie, vélocité, fraîcheur et taille de chaîne."
      note="Scan des top vidéos de ta niche (search.list minimisé, cache 24 h)."
    />
  );
}
