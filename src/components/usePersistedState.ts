"use client";

import { useEffect, useRef, useState } from "react";

/**
 * useState mémorisé en localStorage (audit UX F013) — les filtres d'un écran
 * (format / période / tri) survivent à la navigation et aux sessions.
 * Hydration-safe : rend d'abord la valeur par défaut, relit le stockage après
 * montage (même convention que la lecture de ?demo=1 dans les pages).
 */
export function usePersistedState<T>(
  storageKey: string,
  initial: T,
): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(initial);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw != null) setValue(JSON.parse(raw) as T);
    } catch {
      /* stockage indisponible ou JSON invalide → valeur par défaut */
    }
  }, [storageKey]);

  function set(v: T) {
    setValue(v);
    try {
      localStorage.setItem(storageKey, JSON.stringify(v));
    } catch {
      /* ignore */
    }
  }

  return [value, set];
}
