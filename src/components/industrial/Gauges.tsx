import { cn } from "@/lib/utils";
import { SEVERITY_TEXT } from "@/lib/balance/ui-maps";
import type { Severity } from "@/lib/balance/types";

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function arc(cx: number, cy: number, r: number, start: number, end: number) {
  const s = polar(cx, cy, r, start);
  const e = polar(cx, cy, r, end);
  const large = end - start > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
}

export function RpmGauge({
  rpm,
  max = 6000,
  target,
  stable,
}: {
  rpm: number;
  max?: number;
  target?: number;
  stable?: boolean;
}) {
  const span = 260;
  const start = -130;
  const ratio = Math.max(0, Math.min(1, rpm / max));
  const end = start + span * ratio;
  const targetAngle = target ? start + span * Math.min(1, target / max) : null;

  return (
    <div className="flex min-w-0 flex-col items-center">
      <svg viewBox="0 0 200 150" className="w-full max-w-[220px]">
        <path d={arc(100, 100, 74, start + 180, start + 180 + span)} className="stroke-grid" strokeWidth="10" fill="none" strokeLinecap="round" />
        {ratio > 0.005 ? (
          <path
            d={arc(100, 100, 74, start + 180, start + 180 + span * ratio)}
            className={stable ? "stroke-success" : "stroke-primary"}
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
          />
        ) : null}
        {targetAngle !== null ? (
          <line
            {...(() => {
              const p1 = polar(100, 100, 64, targetAngle + 180);
              const p2 = polar(100, 100, 84, targetAngle + 180);
              return { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y };
            })()}
            className="stroke-warning"
            strokeWidth="2"
          />
        ) : null}
        <text x="100" y="82" textAnchor="middle" className="fill-muted-foreground text-[9px] tracking-[0.2em]">
          RPM
        </text>
        <text x="100" y="112" textAnchor="middle" className="num fill-foreground text-[30px] font-bold">
          {Math.round(rpm)}
        </text>
        <text x="100" y="128" textAnchor="middle" className="fill-muted-foreground text-[8px]">
          {stable ? "VELOCIDAD ESTABLE" : "NO ESTABLE"}
        </text>
        <text x="18" y="140" className="num fill-muted-foreground text-[8px]">0</text>
        <text x="168" y="140" className="num fill-muted-foreground text-[8px]">{max}</text>
      </svg>
      {end < start ? null : null}
    </div>
  );
}

export function VibrationGauge({
  rms,
  peak,
  limit,
  warning,
  unit,
}: {
  rms: number;
  peak: number;
  limit: number;
  warning: number;
  unit: string;
}) {
  const severity: Severity = rms >= limit ? "fault" : rms >= warning ? "warn" : "ok";
  const pct = Math.max(0, Math.min(100, (rms / (limit * 1.6)) * 100));
  const warnPct = (warning / (limit * 1.6)) * 100;
  const limitPct = (limit / (limit * 1.6)) * 100;
  return (
    <div className="min-w-0 space-y-2">
      <div className="flex items-baseline gap-2">
        <span className={cn("num text-4xl font-bold", SEVERITY_TEXT[severity])}>{rms.toFixed(2)}</span>
        <span className="text-xs text-muted-foreground">{unit} RMS</span>
      </div>
      <div className="relative h-3 w-full overflow-hidden rounded-sm bg-secondary">
        <div
          className={cn(
            "h-full transition-[width] duration-200",
            severity === "fault" ? "bg-destructive" : severity === "warn" ? "bg-warning" : "bg-success",
          )}
          style={{ width: `${pct}%` }}
        />
        <span className="absolute top-0 h-full w-px bg-warning/70" style={{ left: `${warnPct}%` }} />
        <span className="absolute top-0 h-full w-px bg-destructive/80" style={{ left: `${limitPct}%` }} />
      </div>
      <div className="grid grid-cols-3 gap-2 text-[11px]">
        <div>
          <p className="label-tech">Peak</p>
          <p className="num text-foreground">{peak.toFixed(2)}</p>
        </div>
        <div>
          <p className="label-tech">Alerta</p>
          <p className="num text-warning">{warning.toFixed(1)}</p>
        </div>
        <div>
          <p className="label-tech">Límite</p>
          <p className="num text-destructive">{limit.toFixed(1)}</p>
        </div>
      </div>
      <p className={cn("text-xs font-semibold", SEVERITY_TEXT[severity])}>
        {severity === "ok" ? "Dentro de rango" : severity === "warn" ? "Cerca del límite" : "Desbalance detectado"}
      </p>
    </div>
  );
}

export function PhaseIndicator({ phase, reference = 0 }: { phase: number; reference?: number }) {
  const p = polar(70, 70, 52, phase);
  const r = polar(70, 70, 52, reference);
  return (
    <div className="flex min-w-0 items-center gap-4">
      <svg viewBox="0 0 140 140" className="h-[112px] w-[112px] shrink-0">
        <circle cx="70" cy="70" r="56" className="fill-background stroke-grid" strokeWidth="1" />
        <circle cx="70" cy="70" r="38" className="fill-none stroke-grid" strokeWidth="0.5" strokeDasharray="2 3" />
        {[0, 90, 180, 270].map((a) => {
          const t = polar(70, 70, 64, a);
          return (
            <text key={a} x={t.x} y={t.y + 3} textAnchor="middle" className="num fill-muted-foreground text-[7px]">
              {a}°
            </text>
          );
        })}
        <line x1="70" y1="70" x2={r.x} y2={r.y} className="stroke-warning" strokeWidth="1.5" strokeDasharray="3 2" />
        <line x1="70" y1="70" x2={p.x} y2={p.y} className="stroke-trace-1" strokeWidth="2.5" />
        <circle cx={p.x} cy={p.y} r="3.5" className="fill-trace-1" />
        <circle cx="70" cy="70" r="3" className="fill-muted-foreground" />
      </svg>
      <div className="min-w-0">
        <p className="label-tech">Fase 1×</p>
        <p className="num text-3xl font-bold text-foreground">{Math.round(phase)}°</p>
        <p className="mt-1 text-[11px] text-muted-foreground">Referencia {reference}°</p>
      </div>
    </div>
  );
}
