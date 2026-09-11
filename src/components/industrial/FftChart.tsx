import {
  Brush,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { Harmonic, SpectrumPoint } from "@/lib/balance/types";

export function FftChart({
  spectrum,
  harmonics,
  unit,
  height = 260,
}: {
  spectrum: SpectrumPoint[];
  harmonics: { x1: Harmonic; x2: Harmonic; x3: Harmonic };
  unit: string;
  height?: number;
}) {
  if (spectrum.length === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center text-xs text-muted-foreground">
        Sin espectro disponible — el hardware no está entregando datos.
      </div>
    );
  }

  const markers = [
    { label: "1×", f: harmonics.x1.frequency },
    { label: "2×", f: harmonics.x2.frequency },
    { label: "3×", f: harmonics.x3.frequency },
  ];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={spectrum} margin={{ top: 8, right: 12, bottom: 4, left: -8 }}>
        <CartesianGrid stroke="var(--grid)" strokeDasharray="2 3" />
        <XAxis
          dataKey="frequency"
          type="number"
          domain={["dataMin", "dataMax"]}
          tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
          stroke="var(--border)"
          label={{ value: "Frecuencia (Hz)", position: "insideBottom", offset: -2, fill: "var(--muted-foreground)", fontSize: 10 }}
        />
        <YAxis
          tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
          stroke="var(--border)"
          label={{ value: `Amplitud (${unit})`, angle: -90, position: "insideLeft", fill: "var(--muted-foreground)", fontSize: 10 }}
        />
        <Tooltip
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: 4,
            fontSize: 12,
          }}
          labelFormatter={(v) => `${v} Hz`}
          formatter={(v: number) => [`${v.toFixed(3)} ${unit}`, "Amplitud"]}
        />
        {markers.map((m) =>
          m.f > 0 ? (
            <ReferenceLine
              key={m.label}
              x={m.f}
              stroke="var(--warning)"
              strokeDasharray="3 3"
              label={{ value: m.label, fill: "var(--warning)", fontSize: 10, position: "top" }}
            />
          ) : null,
        )}
        <Line type="monotone" dataKey="amplitude" stroke="var(--trace-1)" strokeWidth={1.6} dot={false} isAnimationActive={false} />
        <Brush dataKey="frequency" height={18} stroke="var(--border)" fill="var(--secondary)" travellerWidth={8} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function HarmonicsTable({
  harmonics,
  unit,
}: {
  harmonics: { x1: Harmonic; x2: Harmonic; x3: Harmonic };
  unit: string;
}) {
  const rows = [
    { name: "1×", h: harmonics.x1, color: "bg-trace-1" },
    { name: "2×", h: harmonics.x2, color: "bg-trace-2" },
    { name: "3×", h: harmonics.x3, color: "bg-trace-3" },
  ];
  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="border-b border-border">
          <th className="label-tech py-1 text-left">Componente</th>
          <th className="label-tech py-1 text-right">Frecuencia</th>
          <th className="label-tech py-1 text-right">Amplitud</th>
          <th className="label-tech py-1 text-right">Fase</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.name} className="border-b border-border/60 last:border-0">
            <td className="py-1.5">
              <span className="flex items-center gap-2">
                <span className={`led ${r.color}`} />
                <span className="num font-semibold text-foreground">{r.name}</span>
              </span>
            </td>
            <td className="num py-1.5 text-right text-muted-foreground">{r.h.frequency.toFixed(1)} Hz</td>
            <td className="num py-1.5 text-right font-semibold text-foreground">
              {r.h.amplitude.toFixed(2)} {unit}
            </td>
            <td className="num py-1.5 text-right text-muted-foreground">{Math.round(r.h.phase)}°</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
