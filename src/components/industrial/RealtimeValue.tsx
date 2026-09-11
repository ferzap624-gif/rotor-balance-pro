import { cn } from "@/lib/utils";
import { SEVERITY_TEXT } from "@/lib/balance/ui-maps";
import type { Severity } from "@/lib/balance/types";
import type { ReactNode } from "react";

interface RealtimeValueProps {
  label: string;
  value: string | number;
  unit?: string;
  severity?: Severity;
  hint?: string;
  icon?: ReactNode;
  size?: "sm" | "md" | "lg";
  stale?: boolean;
  className?: string;
}

const SIZES = {
  sm: "text-xl",
  md: "text-3xl",
  lg: "text-5xl",
};

export function RealtimeValue({
  label,
  value,
  unit,
  severity = "ok",
  hint,
  icon,
  size = "md",
  stale = false,
  className,
}: RealtimeValueProps) {
  return (
    <div className={cn("panel-surface min-w-0 px-3 py-2", className)}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
        <span className="label-tech truncate">{label}</span>
        {icon ? <span className="shrink-0 text-muted-foreground">{icon}</span> : null}
      </div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span
          className={cn(
            "num font-semibold tabular-nums",
            SIZES[size],
            stale ? "text-muted-foreground" : SEVERITY_TEXT[severity],
          )}
        >
          {stale ? "—" : value}
        </span>
        {unit ? <span className="text-xs text-muted-foreground">{unit}</span> : null}
      </div>
      {hint ? <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
