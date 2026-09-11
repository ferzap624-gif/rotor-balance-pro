import { cn } from "@/lib/utils";
import type { PolarVector } from "@/lib/balance/types";

export interface VectorEntry {
  key: string;
  label: string;
  vector: PolarVector;
  kind: "initial" | "trial" | "correction" | "residual";
  unit?: string;
}

const KIND: Record<VectorEntry["kind"], { stroke: string; fill: string; text: string }> = {
  initial: { stroke: "stroke-trace-1", fill: "fill-trace-1", text: "text-trace-1" },
  trial: { stroke: "stroke-trace-2", fill: "fill-trace-2", text: "text-trace-2" },
  correction: { stroke: "stroke-trace-3", fill: "fill-trace-3", text: "text-trace-3" },
  residual: { stroke: "stroke-trace-4", fill: "fill-trace-4", text: "text-trace-4" },
};

/**
 * VectorBalanceChart — representación polar reutilizable (1 y 2 planos).
 * Muestra referencia 0°, vectores de vibración, masa de prueba y corrección.
 */
export function VectorBalanceChart({
  vectors,
  title,
  size = 280,
}: {
  vectors: VectorEntry[];
  title?: string;
  size?: number;
}) {
  const max = Math.max(0.001, ...vectors.map((v) => v.vector.amplitude));
  const R = 92;
  const cx = 120;
  const cy = 120;

  const point = (v: PolarVector) => {
    const r = (v.amplitude / max) * R;
    const a = ((v.angle - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  };

  return (
    <div className="min-w-0">
      <svg viewBox="0 0 240 240" style={{ width: size, maxWidth: "100%" }} className="mx-auto" role="img" aria-label={title ?? "Diagrama vectorial"}>
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <circle key={f} cx={cx} cy={cy} r={R * f} className="fill-none stroke-grid" strokeWidth="0.75" strokeDasharray={f === 1 ? undefined : "2 3"} />
        ))}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
          const rad = ((a - 90) * Math.PI) / 180;
          return (
            <line
              key={a}
              x1={cx}
              y1={cy}
              x2={cx + R * Math.cos(rad)}
              y2={cy + R * Math.sin(rad)}
              className={a === 0 ? "stroke-warning" : "stroke-grid"}
              strokeWidth={a === 0 ? 1.25 : 0.5}
              strokeDasharray={a === 0 ? "4 3" : undefined}
            />
          );
        })}
        {[0, 90, 180, 270].map((a) => {
          const rad = ((a - 90) * Math.PI) / 180;
          return (
            <text
              key={a}
              x={cx + (R + 14) * Math.cos(rad)}
              y={cy + (R + 14) * Math.sin(rad) + 3}
              textAnchor="middle"
              className="num fill-muted-foreground text-[8px]"
            >
              {a}°
            </text>
          );
        })}
        <text x={cx} y={16} textAnchor="middle" className="num fill-muted-foreground text-[8px]">
          escala máx {max.toFixed(2)}
        </text>

        {vectors.map((v) => {
          const p = point(v.vector);
          const meta = KIND[v.kind];
          return (
            <g key={v.key}>
              <line x1={cx} y1={cy} x2={p.x} y2={p.y} className={meta.stroke} strokeWidth="2.25" markerEnd={`url(#vec-${v.kind})`} />
              <circle cx={p.x} cy={p.y} r="3.5" className={meta.fill} />
            </g>
          );
        })}
        <defs>
          {Object.entries(KIND).map(([k, meta]) => (
            <marker key={k} id={`vec-${k}`} markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
              <path d="M0,0 L7,3.5 L0,7 z" className={meta.fill} />
            </marker>
          ))}
        </defs>
        <circle cx={cx} cy={cy} r="2.5" className="fill-muted-foreground" />
      </svg>

      <ul className="mt-2 space-y-1">
        {vectors.map((v) => (
          <li key={v.key} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 text-xs">
            <span className="flex min-w-0 items-center gap-2">
              <span className={cn("led", KIND[v.kind].fill.replace("fill-", "bg-"))} />
              <span className="truncate text-muted-foreground">{v.label}</span>
            </span>
            <span className={cn("num shrink-0 font-semibold", KIND[v.kind].text)}>
              {v.vector.amplitude.toFixed(2)} {v.unit ?? ""} ∠ {Math.round(v.vector.angle)}°
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
