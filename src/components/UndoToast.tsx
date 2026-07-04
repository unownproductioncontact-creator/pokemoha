"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/** Toast d'annulation (§5 : suppression annulable 7 s). createPortal vers body. */
export function UndoToast({
  label,
  onUndo,
  onExpire,
  seconds = 7,
}: {
  label: string;
  onUndo: () => void;
  onExpire: () => void;
  seconds?: number;
}) {
  const [left, setLeft] = useState(seconds);

  useEffect(() => {
    const iv = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000);
    const to = setTimeout(onExpire, seconds * 1000);
    return () => {
      clearInterval(iv);
      clearTimeout(to);
    };
    // monté une fois par suppression (clé = id côté parent)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-lg border border-line bg-surface px-4 py-2.5 shadow-xl">
      <span className="text-sm">
        <strong>{label}</strong> supprimé
      </span>
      <button
        type="button"
        onClick={onUndo}
        className="text-sm font-medium text-brand hover:underline"
      >
        Annuler ({left})
      </button>
    </div>,
    document.body,
  );
}
