"use client";

// Cache client stale-while-revalidate (audit UX F017). Un même endpoint n'affiche
// plus un spinner plein écran à chaque montage : la donnée déjà vue s'affiche
// instantanément (stale) pendant qu'une révalidation tourne en fond. Dédup des
// requêtes concurrentes sur une même clé (URL).
//
// Portée : mémoire de session (réinitialisé au rechargement complet). Aucune
// donnée inventée — c'est le MÊME JSON serveur, juste mémorisé côté client.

import { useEffect, useState } from "react";

interface Entry<T> {
  data: T;
  ts: number;
}

// Fenêtre de déduplication : si le cache d'une clé a moins de DEDUPE_MS, on ne
// relance PAS de révalidation au montage. Évite les rafales de requêtes (et donc
// la consommation de quota YouTube) lors d'une navigation aller-retour rapide.
const DEDUPE_MS = 30_000;

const cache = new Map<string, Entry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

/** Récupère et met en cache (dédup des appels concurrents sur la même URL). */
function fetchKey<T>(url: string): Promise<T> {
  const existing = inflight.get(url);
  if (existing) return existing as Promise<T>;
  const p = fetch(url)
    .then((r) => r.json())
    .then((d: T) => {
      cache.set(url, { data: d, ts: Date.now() });
      return d;
    })
    .finally(() => {
      inflight.delete(url);
    });
  inflight.set(url, p);
  return p;
}

/** Purge une clé : cache ET requête en vol. Vider `inflight` est indispensable —
 *  sinon un GET lancé AVANT une mutation serait réutilisé par la revalidation qui
 *  la suit, ré-affichant (et re-cachant comme « frais ») des données périmées. */
function purge(url: string): void {
  cache.delete(url);
  inflight.delete(url);
}

export interface Resource<T> {
  /** Vrai UNIQUEMENT au tout premier chargement (aucune donnée en cache). */
  loading: boolean;
  data?: T;
  error?: string;
  /** Purge le cache (+ la requête en vol) et refetch : « Réessayer »/« Rafraîchir ». */
  reload: () => void;
}

/**
 * Hook de ressource caché. `url === null` = ne rien charger (ressource inactive).
 */
export function useResource<T>(url: string | null): Resource<T> {
  const initial = url ? (cache.get(url) as Entry<T> | undefined) : undefined;
  const [state, setState] = useState<{ data?: T; error?: string }>(() => ({
    data: initial?.data,
  }));
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!url) return;
    const hit = cache.get(url) as Entry<T> | undefined;
    const fresh = hit !== undefined && Date.now() - hit.ts < DEDUPE_MS;
    // Affiche le cache immédiatement (stale). Révalide en fond SAUF si le cache
    // est encore frais (< DEDUPE_MS) — dans ce cas on évite le refetch.
    setState({ data: hit?.data, error: undefined });
    if (fresh) return;
    let alive = true;
    fetchKey<T>(url)
      .then((d) => {
        if (alive) setState({ data: d, error: undefined });
      })
      .catch((e) => {
        // Garde la donnée périmée à l'écran, mais signale l'erreur.
        if (alive) setState((s) => ({ data: s.data, error: String(e) }));
      });
    return () => {
      alive = false;
    };
  }, [url, nonce]);

  return {
    loading: state.data === undefined && !state.error,
    data: state.data,
    error: state.error,
    reload: () => {
      if (url) purge(url);
      setNonce((n) => n + 1);
    },
  };
}
