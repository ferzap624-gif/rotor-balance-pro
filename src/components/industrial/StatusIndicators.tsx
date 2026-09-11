import { cn } from "@/lib/utils";
import { DRIVE_META, MACHINE_STATE_META, SENSOR_META, SEVERITY_DOT, SEVERITY_TEXT } from "@/lib/balance/ui-maps";
import type { ConnectionState, DriveState, MachineState, SensorStatusMap, SafetyStatus, Severity } from "@/lib/balance/types";

export function StatusPill({
  label,
  value,
  severity,
  className,
}: {
  label?: string | undefined;
  value: string;
  severity: Severity;
  className?: string | undefined;
}) {
  return (
    <span
      className={cn(
        "inline-flex min-w-0 items-center gap-2 rounded-sm border border-border bg-secondary/60 px-2 py-1",
        className,
      )}
    >
      <span className={cn("led", SEVERITY_DOT[severity], severity === "fault" && "scan-pulse")} />
      {label ? <span className="label-tech shrink-0">{label}</span> : null}
      <span className={cn("truncate text-xs font-semibold", SEVERITY_TEXT[severity])}>{value}</span>
    </span>
  );
}

export function MachineStatus({ state, compact = false }: { state: MachineState; compact?: boolean }) {
  const meta = MACHINE_STATE_META[state];
  return (
    <div className="min-w-0">
      <StatusPill label={compact ? undefined : "Máquina"} value={meta.label.toUpperCase()} severity={meta.severity} />
      {!compact ? <p className="mt-1 text-[11px] text-muted-foreground">{meta.hint}</p> : null}
    </div>
  );
}

const CONNECTION_META: Record<ConnectionState, { label: string; severity: Severity }> = {
  DESCONECTADO: { label: "Desconectado", severity: "off" },
  CONECTANDO: { label: "Conectando", severity: "info" },
  CONECTADO: { label: "Conectado", severity: "ok" },
  ERROR: { label: "Error de enlace", severity: "fault" },
};

export function CommunicationStatus({
  state,
  mode,
  detail,
  compact = false,
}: {
  state: ConnectionState;
  mode: string;
  detail?: string | undefined;
  compact?: boolean;
}) {
  const meta = CONNECTION_META[state];
  return (
    <div className="min-w-0">
      <StatusPill label={compact ? undefined : "Enlace"} value={`${meta.label} · ${mode.replace("MODE_", "")}`} severity={meta.severity} />
      {!compact && detail ? <p className="mt-1 truncate text-[11px] text-muted-foreground">{detail}</p> : null}
    </div>
  );
}

export function DriveStatus({ state, alarm }: { state: DriveState; alarm: string | null }) {
  const meta = DRIVE_META[state];
  return (
    <div className="min-w-0 space-y-1">
      <StatusPill label="Variador" value={meta.label.toUpperCase()} severity={meta.severity} />
      {alarm ? <p className="text-[11px] font-semibold text-destructive">{alarm}</p> : null}
    </div>
  );
}

export function SensorStatus({ sensors }: { sensors: SensorStatusMap }) {
  const rows: Array<[string, keyof SensorStatusMap]> = [
    ["Acelerómetro A", "accelerometerA"],
    ["Acelerómetro B", "accelerometerB"],
    ["Sensor de RPM", "rpmSensor"],
    ["Referencia angular", "angularReference"],
  ];
  return (
    <ul className="space-y-1.5">
      {rows.map(([label, key]) => {
        const meta = SENSOR_META[sensors[key]];
        return (
          <li key={key} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
            <span className="min-w-0 truncate text-xs text-muted-foreground">{label}</span>
            <span className="flex shrink-0 items-center gap-1.5">
              <span className={cn("led", SEVERITY_DOT[meta.severity])} />
              <span className={cn("text-xs font-semibold", SEVERITY_TEXT[meta.severity])}>{meta.label}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function SafetyPanelBody({ safety, blocked }: { safety: SafetyStatus; blocked: string[] }) {
  const rows: Array<[string, boolean, boolean]> = [
    ["Paro de emergencia", !safety.emergencyStop, true],
    ["Protección / puerta", safety.guardClosed, true],
    ["Permiso de giro", safety.runPermit, true],
    ["PLC en línea", safety.plcOnline, true],
  ];
  return (
    <div className="space-y-3">
      <ul className="space-y-1.5">
        {rows.map(([label, ok]) => (
          <li key={label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
            <span className="min-w-0 truncate text-xs text-muted-foreground">{label}</span>
            <span className="flex shrink-0 items-center gap-1.5">
              <span className={cn("led", ok ? SEVERITY_DOT.ok : SEVERITY_DOT.fault)} />
              <span className={cn("text-xs font-semibold", ok ? SEVERITY_TEXT.ok : SEVERITY_TEXT.fault)}>
                {ok ? "OK" : "BLOQUEO"}
              </span>
            </span>
          </li>
        ))}
      </ul>
      {blocked.length > 0 ? (
        <div className="rounded-sm border border-destructive/50 bg-destructive/10 p-2">
          <p className="text-xs font-bold text-destructive">MEDICIÓN Y ARRANQUE BLOQUEADOS</p>
          <ul className="mt-1 space-y-0.5">
            {blocked.map((r) => (
              <li key={r} className="text-[11px] text-destructive">
                · {r}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="rounded-sm border border-success/40 bg-success/10 p-2 text-[11px] text-success">
          Condiciones de medición satisfechas según el hardware. La seguridad funcional reside en el PLC.
        </p>
      )}
    </div>
  );
}

export function SignalQualityBar({
  quality,
  issues,
  minimum,
}: {
  quality: number;
  issues: string[];
  minimum: number;
}) {
  const severity: Severity = quality >= minimum ? "ok" : quality >= minimum * 0.7 ? "warn" : "fault";
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
        <span className="label-tech">Calidad de señal</span>
        <span className={cn("num text-sm font-bold", SEVERITY_TEXT[severity])}>{quality} %</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-sm bg-secondary">
        <div
          className={cn("h-full transition-[width] duration-300", SEVERITY_DOT[severity])}
          style={{ width: `${Math.max(0, Math.min(100, quality))}%` }}
        />
      </div>
      <p className="text-[11px] text-muted-foreground">Mínimo configurado: {minimum} %</p>
      {issues.length > 0 ? (
        <ul className="space-y-0.5">
          {issues.map((i) => (
            <li key={i} className="text-[11px] text-warning">
              ⚠ {i}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
