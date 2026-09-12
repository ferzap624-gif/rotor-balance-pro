import { useEffect, useState } from "react";
import { Menu, OctagonX, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CommunicationStatus, MachineStatus, StatusPill } from "@/components/industrial/StatusIndicators";
import { useSystem } from "@/store/system-store";

export function TopBar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { telemetry, connection, connectionDetail, transport, settings, sendCommand } = useSystem();
  const [now, setNow] = useState<string>("");

  useEffect(() => {
    const update = () =>
      setNow(
        new Date().toLocaleString("es-ES", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  const emergency = telemetry.safetyStatus.emergencyStop;

  return (
    <header className="z-20 border-b border-border bg-panel">
      <div className="flex flex-wrap items-center gap-2 px-2 py-2 md:px-3">
        <Button variant="ghost" size="icon" className="shrink-0 lg:hidden" onClick={onOpenMenu} aria-label="Abrir menú">
          <Menu className="h-5 w-5" />
        </Button>

        <MachineStatus state={telemetry.machineState} compact />
        <CommunicationStatus state={connection} mode={transport.mode} detail={connectionDetail} compact />
        <StatusPill label="RPM" value={String(telemetry.rpm)} severity={telemetry.rpmStable ? "ok" : "warn"} />
        <StatusPill label="Vibración" value={`${telemetry.vibrationRms.toFixed(2)} ${settings.units.vibration}`} severity={telemetry.vibrationRms > settings.limits.vibrationLimit ? "fault" : "ok"} />
        <StatusPill label="Modo" value={settings.level} severity="info" />

        <div className="ml-auto flex min-w-0 items-center gap-2">
          {emergency ? (
            <span className="flex shrink-0 items-center gap-1.5 rounded-sm border border-destructive bg-destructive/15 px-2 py-1 text-xs font-bold text-destructive scan-pulse">
              <OctagonX className="h-4 w-4" /> PARO DE EMERGENCIA
            </span>
          ) : null}
          <span className="hidden min-w-0 items-center gap-1.5 text-xs text-muted-foreground sm:flex">
            <User className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{settings.operator}</span>
          </span>
          <span className="num hidden shrink-0 text-xs text-muted-foreground md:inline">{now}</span>
          <Button
            variant="destructive"
            size="sm"
            className="shrink-0"
            onClick={() => void sendCommand({ name: "DRIVE_EMERGENCY" })}
          >
            PARO
          </Button>
        </div>
      </div>
    </header>
  );
}
