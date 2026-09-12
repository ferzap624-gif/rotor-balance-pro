import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export interface ProcessStep {
  index: number;
  title: string;
  detail: string;
  state: "done" | "current" | "pending";
}

export function ProcessSteps({ steps }: { steps: ProcessStep[] }) {
  return (
    <ol className="space-y-1.5">
      {steps.map((s) => (
        <li
          key={s.index}
          className={cn(
            "grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2.5 rounded-sm border px-2.5 py-2",
            s.state === "current"
              ? "border-primary/50 bg-primary/10"
              : s.state === "done"
                ? "border-success/40 bg-success/5"
                : "border-border bg-secondary/40",
          )}
        >
          <span
            className={cn(
              "num grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold",
              s.state === "done"
                ? "bg-success text-success-foreground"
                : s.state === "current"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground",
            )}
          >
            {s.state === "done" ? <Check className="h-4 w-4" /> : s.index}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-foreground">{s.title}</span>
            <span
              className={cn(
                "block truncate text-[11px]",
                s.state === "done" ? "text-success" : s.state === "current" ? "text-primary" : "text-muted-foreground",
              )}
            >
              {s.detail}
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}
