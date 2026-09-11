import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { dateTime } from "@/lib/balance/format";
import type { Alarm } from "@/lib/balance/types";

const SEV: Record<Alarm["severity"], string> = {
  fault: "border-destructive/50 bg-destructive/10 text-destructive",
  warn: "border-warning/50 bg-warning/10 text-warning",
  info: "border-info/50 bg-info/10 text-info",
};

export function AlarmPanel({ alarms, onClear }: { alarms: Alarm[]; onClear: () => void }) {
  return (
    <div className="space-y-2">
      {alarms.length === 0 ? (
        <p className="text-xs text-muted-foreground">Sin alarmas activas registradas.</p>
      ) : (
        <>
          <ul className="max-h-[220px] space-y-1.5 overflow-auto pr-1">
            {alarms.slice(0, 12).map((a) => (
              <li key={a.id} className={cn("rounded-sm border px-2 py-1.5", SEV[a.severity])}>
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                  <span className="num truncate text-[11px] font-bold">{a.code}</span>
                  <span className="num shrink-0 text-[10px] opacity-70">{dateTime(a.timestamp)}</span>
                </div>
                <p className="text-xs">{a.message}</p>
              </li>
            ))}
          </ul>
          <Button variant="outline" size="sm" className="w-full" onClick={onClear}>
            Reconocer registro
          </Button>
        </>
      )}
    </div>
  );
}
