"use client";

// Cache client stale-while-revalidate (audit UX F017). Un même endpoint n'affiche
// plus un spinner plein écran à chaque montage : la donnée déjà vue s'affiche
// instantanément (stale) pendant qu'une révalidation tourne en fond. Dédup des
// requêtes concurrentes sur une même clé (URL), et `mutate` pour l'UI optimiste.
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

/** Écrit une valeur en cache SANS refetch (UI optimiste). */
export function mutateResource<T>(url: string, data: T): void {
  cache.set(url, { data, ts: Date.now() });
}

/** Purge une clé (force le prochain fetch à repartir du serveur). */
export function invalidateResource(url: string): void {
  cache.delete(url);
}

export interface Resource<T> {
  /** Vrai UNIQUEMENT au tout premier chargement (aucune donnée en cache). */
  loading: boolean;
  /** Révalidation en fond alors qu'une donnée (stale) est déjà affichée. */
  validating: boolean;
  data?: T;
  error?: string;
  /** epoch ms de la donnée affichée (fraîcheur, F028). */
  updatedAt?: number;
  /** Purge le cache et refetch (bouton « Réessayer » / « Rafraîchir »). */
  reload: () => void;
  /** Remplace la donnée localement + en cache, sans refetch (optimiste). */
  mutate: (data: T) => void;
}

/**
 * Hook de ressource caché. `url === null` = ne rien charger (ressource inactive).
 */
export function useResource<T>(url: string | null): Resource<T> {
  const initial = url ? (cache.get(url) as Entry<T> | undefined) : undefined;
  const [state, setState] = useState<{
    data?: T;
    error?: string;
    validating: boolean;
    updatedAt?: number;
  }>(() => ({
    data: initial?.data,
    updatedAt: initial?.ts,
    validating: false,
  }));
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!url) return;
    const hit = cache.get(url) as Entry<T> | undefined;
    const fresh = hit !== undefined && Date.now() - hit.ts < DEDUPE_MS;
    // Affiche le cache immédiatement (stale). Révalide en fond SAUF si le cache
    // est encore frais (< DEDUPE_MS) — dans ce cas on évite le refetch.
    setState({
      data: hit?.data,
      updatedAt: hit?.ts,
      error: undefined,
      validating: !fresh,
    });
    if (fresh) return;
    let alive = true;
    fetchKey<T>(url)
      .then((d) => {
        if (alive)
          setState({
            data: d,
            updatedAt: Date.now(),
            error: undefined,
            validating: false,
          });
      })
      .catch((e) => {
        if (alive)
          setState((s) => ({
            data: s.data,
            updatedAt: s.updatedAt,
            error: String(e),
            validating: false,
          }));
      });
    return () => {
      alive = false;
    };
  }, [url, nonce]);

  return {
    loading: state.data === undefined && !state.error,
    validating: state.validating,
    data: state.data,
    error: state.error,
    updatedAt: state.updatedAt,
    reload: () => {
      if (url) cache.delete(url);
      setNonce((n) => n + 1);
    },
    mutate: (data: T) => {
      if (url) cache.set(url, { data, ts: Date.now() });
      setState({ data, updatedAt: Date.now(), validating: false });
    },
  };
}
