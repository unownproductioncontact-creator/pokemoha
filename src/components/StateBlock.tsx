import { Card, EmptyState } from "@/components/ui";

export function LoadingBlock({ label = "Chargement…" }: { label?: string }) {
  return (
    <Card className="flex items-center justify-center gap-2 p-10 text-sm text-muted">
      <span className="h-3 w-3 animate-spin rounded-full border-2 border-line border-t-brand" />
      {label}
    </Card>
  );
}

export function ErrorBlock({
  message,
  onRetry,
}: {
  message?: string;
  /** Relance sans recharger toute la page (audit UX G1-5) : fin du cul-de-sac. */
  onRetry?: () => void;
}) {
  return (
    <EmptyState title="Une erreur est survenue">
      <p>{message ?? "Réessaie plus tard."}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-brand-ink hover:opacity-90"
        >
          Réessayer
        </button>
      )}
    </EmptyState>
  );
}

/** Bandeau permanent quand on affiche des données de démonstration. */
export function DemoBanner() {
  return (
    <div className="mb-4 rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-accent">
      <strong>Démonstration</strong> — données fictives, pour aperçu uniquement.
      Connecte ta chaîne ou ajoute ta clé API pour tes vraies données.
    </div>
  );
}

/** Aucune source de données : invite à connecter OAuth ou ajouter la clé API. */
export function CredentialsNotice({ message }: { message?: string }) {
  return (
    <EmptyState title="Connecte une source de données">
      <p>
        {message ??
          "Ajoute YOUTUBE_API_KEY dans .env.local, ou connecte ta chaîne en OAuth pour tes données propriétaire (CTR, rétention)."}
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <a
          href="/api/oauth/start"
          className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-brand-ink hover:opacity-90"
        >
          Connecter ma chaîne
        </a>
        {/* Démo pilotée par l'URL (audit UX F003) : navigation réelle vers
            ?demo=1 → la page ET la sidebar voient la démo de façon cohérente,
            donc les liens de nav conservent le mode démo. */}
        <a
          href="?demo=1"
          className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium hover:bg-elevated"
        >
          Voir une démo
        </a>
        <a
          href="/parametres"
          className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium hover:bg-elevated"
        >
          Paramètres
        </a>
      </div>
    </EmptyState>
  );
}
