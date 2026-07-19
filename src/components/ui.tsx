import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { DataStatus } from "@/lib/types";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("rounded-xl border border-line bg-surface", className)}>
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="mt-1 max-w-2xl text-sm text-muted">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export type Tone =
  | "brand"
  | "success"
  | "warning"
  | "danger"
  | "muted"
  | "accent"
  | "info";

const TONE_CLASS: Record<Tone, string> = {
  brand: "bg-brand/10 text-brand",
  success: "bg-success/10 text-success",
  warning: "bg-warning/15 text-warning",
  danger: "bg-danger/10 text-danger",
  accent: "bg-accent/15 text-accent",
  info: "bg-info/10 text-info",
  muted: "bg-elevated text-muted",
};

export type Severity = "high" | "medium" | "low";

/** Sévérité → libellé FR + ton, partagé Alertes/Audit (audit UX F024). */
export const SEVERITY_META: Record<Severity, { label: string; tone: Tone }> = {
  high: { label: "Urgent", tone: "danger" },
  medium: { label: "À surveiller", tone: "warning" },
  low: { label: "Info", tone: "muted" },
};

export function Badge({
  tone = "muted",
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        TONE_CLASS[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

const STATUS_META: Record<DataStatus, { tone: Tone; label: string }> = {
  real: { tone: "success", label: "Réel" },
  estimated: { tone: "accent", label: "Estimé" },
  unavailable: { tone: "muted", label: "Indisponible" },
};

/** Badge central du §0 : étiquette toute métrique Réel / Estimé / Indisponible. */
export function DataBadge({
  status,
  className,
}: {
  status: DataStatus;
  className?: string;
}) {
  const m = STATUS_META[status];
  return (
    <Badge tone={m.tone} className={className}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {m.label}
    </Badge>
  );
}

export function StatCard({
  label,
  value,
  hint,
  status,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  status?: DataStatus;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">
          {label}
        </span>
        {status && <DataBadge status={status} />}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
    </Card>
  );
}

export function EmptyState({
  title,
  children,
  icon,
}: {
  title: string;
  children?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <Card className="flex flex-col items-center justify-center gap-2 p-10 text-center">
      {icon && <div className="text-muted">{icon}</div>}
      <div className="font-medium">{title}</div>
      {children && <div className="max-w-md text-sm text-muted">{children}</div>}
    </Card>
  );
}
