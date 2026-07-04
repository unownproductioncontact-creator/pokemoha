"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { NAV } from "@/config/nav";
import { MY_CHANNELS } from "@/config/channels";
import { ICONS } from "@/components/icons";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/cn";

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

function ChannelSwitcher() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(
    MY_CHANNELS[0]?.label ?? "Aucune chaîne",
  );

  useEffect(() => {
    try {
      const saved = localStorage.getItem("kiibiki-channel");
      if (saved) setSelected(saved);
    } catch {
      /* ignore */
    }
  }, []);

  function pick(label: string) {
    setSelected(label);
    setOpen(false);
    try {
      localStorage.setItem("kiibiki-channel", label);
    } catch {
      /* ignore */
    }
  }

  const Chevron = ICONS.chevron;
  const Plug = ICONS.plug;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-line bg-elevated px-3 py-2 text-sm font-medium transition-colors hover:border-brand/40"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-brand/15 text-[11px] font-bold text-brand">
            {selected.slice(0, 2).toUpperCase()}
          </span>
          <span className="truncate">{selected}</span>
        </span>
        <Chevron
          className={cn(
            "h-4 w-4 shrink-0 text-muted transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-20"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-line bg-surface shadow-lg">
            {MY_CHANNELS.map((c) => (
              <button
                key={c.ref}
                type="button"
                onClick={() => pick(c.label)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-elevated"
              >
                <span className="truncate">{c.label}</span>
                {c.placeholder && (
                  <span className="ml-auto shrink-0 text-[10px] text-muted">
                    à connecter
                  </span>
                )}
              </button>
            ))}
            <a
              href="/api/oauth/start"
              className="flex items-center gap-2 border-t border-line px-3 py-2 text-sm text-brand hover:bg-elevated"
            >
              <Plug className="h-4 w-4" /> Connecter une chaîne
            </a>
          </div>
        </>
      )}
    </div>
  );
}

function SidebarContent({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  const Logo = ICONS.logo;
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-4 py-4">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-brand-ink">
          <Logo className="h-5 w-5" />
        </span>
        <div className="leading-tight">
          <div className="text-sm font-semibold">Pokémoha</div>
          <div className="text-[11px] text-muted">Directeur YouTube IA</div>
        </div>
      </div>

      <div className="px-3 pb-3">
        <ChannelSwitcher />
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        {NAV.map((group) => (
          <div key={group.id}>
            <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
              {group.label}
            </div>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = ICONS[item.icon] ?? ICONS.grid;
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                        active
                          ? "bg-brand/10 font-medium text-brand"
                          : "text-ink/80 hover:bg-elevated hover:text-ink",
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-[18px] w-[18px] shrink-0",
                          active
                            ? "text-brand"
                            : "text-muted group-hover:text-ink",
                        )}
                      />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="flex items-center justify-between border-t border-line px-4 py-3">
        <span className="inline-flex items-center gap-1.5 text-[11px] text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          100% local &amp; privé
        </span>
        <ThemeToggle />
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [drawer, setDrawer] = useState(false);

  // Ferme le drawer à chaque navigation.
  useEffect(() => {
    setDrawer(false);
  }, [pathname]);

  const Menu = ICONS.menu;
  const Close = ICONS.close;
  const Logo = ICONS.logo;

  return (
    <div className="flex min-h-screen">
      {/* Sidebar desktop */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-surface lg:flex">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Drawer mobile */}
      {drawer && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setDrawer(false)}
            aria-hidden
          />
          <aside className="absolute left-0 top-0 h-full w-72 max-w-[85%] border-r border-line bg-surface shadow-xl">
            <button
              type="button"
              onClick={() => setDrawer(false)}
              aria-label="Fermer le menu"
              className="absolute right-3 top-3.5 z-10 rounded-md p-1.5 text-muted hover:bg-elevated"
            >
              <Close className="h-5 w-5" />
            </button>
            <SidebarContent
              pathname={pathname}
              onNavigate={() => setDrawer(false)}
            />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar mobile */}
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-surface/80 px-4 py-3 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setDrawer(true)}
            aria-label="Ouvrir le menu"
            className="rounded-md p-1.5 hover:bg-elevated"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand text-brand-ink">
            <Logo className="h-4 w-4" />
          </span>
          <span className="font-semibold">Pokémoha</span>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
