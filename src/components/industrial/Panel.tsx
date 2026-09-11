import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface PanelProps {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  icon?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}

export function Panel({
  title,
  subtitle,
  actions,
  icon,
  className,
  bodyClassName,
  children,
}: PanelProps) {
  return (
    <section className={cn("panel-surface flex flex-col", className)}>
      {(title || actions) && (
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border px-3 py-2">
          <div className="flex min-w-0 items-center gap-2">
            {icon ? <span className="shrink-0 text-primary">{icon}</span> : null}
            <h2 className="truncate text-sm font-semibold tracking-wide text-foreground">{title}</h2>
            {subtitle ? (
              <span className="truncate text-xs text-muted-foreground">{subtitle}</span>
            ) : null}
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </header>
      )}
      <div className={cn("flex-1 p-3", bodyClassName)}>{children}</div>
    </section>
  );
}

export function PanelGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid gap-3", className)}>{children}</div>;
}
