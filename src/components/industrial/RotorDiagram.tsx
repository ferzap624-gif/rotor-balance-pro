import { cn } from "@/lib/utils";
import { useCallback, useRef } from "react";

interface Marker {
  angle: number;
  label: string;
  kind: "vibration" | "test" | "correction";
}

const KIND_CLASS: Record<Marker["kind"], string> = {
  vibration: "fill-trace-1 stroke-trace-1",
  test: "fill-warning stroke-warning",
  correction: "fill-success stroke-success",
};

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

/**
 * Diagrama circular del rotor: referencia 0°, sentido de giro y marcadores.
 * Si se entrega onAngleChange el operador puede seleccionar el ángulo
 * con mouse o pantalla táctil.
 */
export function RotorDiagram({
  markers = [],
  direction = "CW",
  onAngleChange,
  selectable = false,
  size = 260,
  planeLabel,
}: {
  markers?: Marker[];
  direction?: "CW" | "CCW";
  onAngleChange?: (angle: number) => void;
  selectable?: boolean;
  size?: number;
  planeLabel?: string;
}) {
  const ref = useRef<SVGSVGElement>(null);

  const pick = useCallback(
    (clientX: number, clientY: number) => {
      const svg = ref.current;
      if (!svg || !onAngleChange) return;
      const rect = svg.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const angle = (Math.atan2(clientY - cy, clientX - cx) * 180) / Math.PI + 90;
      onAngleChange(Math.round((angle + 360) % 360));
    },
    [onAngleChange],
  );

  return (
    <svg
      ref={ref}
      viewBox="0 0 220 220"
      style={{ width: size, maxWidth: "100%" }}
      className={cn("mx-auto touch-none select-none", selectable && "cursor-crosshair")}
      onPointerDown={(e) => selectable && pick(e.clientX, e.clientY)}
      onPointerMove={(e) => selectable && e.buttons === 1 && pick(e.clientX, e.clientY)}
      role={selectable ? "slider" : "img"}
      aria-label="Diagrama angular del rotor"
      aria-valuenow={markers[0]?.angle ?? 0}
    >
      {/* Escala angular */}
      <circle cx="110" cy="110" r="96" className="fill-none stroke-grid" strokeWidth="1" />
      {Array.from({ length: 36 }).map((_, i) => {
        const a = i * 10;
        const inner = polar(110, 110, a % 90 === 0 ? 84 : 90, a);
        const outer = polar(110, 110, 96, a);
        return (
          <line
            key={a}
            x1={inner.x}
            y1={inner.y}
            x2={outer.x}
            y2={outer.y}
            className={a % 90 === 0 ? "stroke-muted-foreground" : "stroke-grid"}
            strokeWidth={a % 90 === 0 ? 1.5 : 0.75}
          />
        );
      })}
      {[0, 90, 180, 270].map((a) => {
        const t = polar(110, 110, 106, a);
        return (
          <text key={a} x={t.x} y={t.y + 3} textAnchor="middle" className="num fill-muted-foreground text-[8px]">
            {a}°
          </text>
        );
      })}

      {/* Cuerpo del rotor */}
      <circle cx="110" cy="110" r="72" className="fill-secondary stroke-border" strokeWidth="1.5" />
      <circle cx="110" cy="110" r="46" className="fill-panel stroke-border" strokeWidth="1" />
      <circle cx="110" cy="110" r="14" className="fill-background stroke-border" strokeWidth="1.5" />
      {Array.from({ length: 6 }).map((_, i) => {
        const p = polar(110, 110, 30, i * 60);
        return <circle key={i} cx={p.x} cy={p.y} r="3.5" className="fill-background stroke-border" strokeWidth="0.75" />;
      })}

      {/* Referencia 0° */}
      <line x1="110" y1="110" x2="110" y2="38" className="stroke-warning" strokeWidth="1.5" strokeDasharray="4 3" />
      <text x="114" y="46" className="fill-warning text-[8px] font-semibold">
        REF 0°
      </text>

      {/* Sentido de giro */}
      <path
        d={direction === "CW" ? "M 150 42 A 60 60 0 0 1 176 78" : "M 70 42 A 60 60 0 0 0 44 78"}
        className="fill-none stroke-muted-foreground"
        strokeWidth="1.5"
        markerEnd="url(#rotor-arrow)"
      />
      <defs>
        <marker id="rotor-arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 z" className="fill-muted-foreground" />
        </marker>
      </defs>
      <text x="110" y="206" textAnchor="middle" className="fill-muted-foreground text-[8px] tracking-widest">
        {direction === "CW" ? "SENTIDO DE GIRO: HORARIO" : "SENTIDO DE GIRO: ANTIHORARIO"}
      </text>
      {planeLabel ? (
        <text x="110" y="20" textAnchor="middle" className="fill-foreground text-[9px] font-bold tracking-widest">
          {planeLabel}
        </text>
      ) : null}

      {/* Marcadores */}
      {markers.map((m) => {
        const p = polar(110, 110, 72, m.angle);
        const l = polar(110, 110, 88, m.angle);
        return (
          <g key={`${m.kind}-${m.angle}-${m.label}`}>
            <line x1="110" y1="110" x2={p.x} y2={p.y} className={KIND_CLASS[m.kind]} strokeWidth="2" />
            <circle cx={p.x} cy={p.y} r="6" className={KIND_CLASS[m.kind]} />
            <text x={l.x} y={l.y} textAnchor="middle" className={cn("text-[8px] font-bold", KIND_CLASS[m.kind])}>
              {m.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
