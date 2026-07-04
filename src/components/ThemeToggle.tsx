"use client";

import { useEffect, useState } from "react";
import { ICONS } from "@/components/icons";

type Theme = "light" | "dark";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    setTheme(
      document.documentElement.classList.contains("dark") ? "dark" : "light",
    );
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem("kiibiki-theme", next);
    } catch {
      /* localStorage indisponible : on ignore */
    }
  }

  const Icon = theme === "dark" ? ICONS.sun : ICONS.moon;
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Passer en clair" : "Passer en sombre"}
      className="rounded-md p-1.5 text-muted transition-colors hover:bg-elevated hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}
