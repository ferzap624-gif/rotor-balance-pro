import { Brush, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { WaveformPoint } from "@/lib/balance/types";

export function WaveformChart({
  waveform,
  unit,
  height = 220,
}: {
  waveform: WaveformPoint[];
  unit: string;
  height?: number;
}) {
  if (waveform.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-xs text-muted-foreground">
        Sin forma de onda — el hardware no está entregando datos.
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={waveform} margin={{ top: 8, right: 12, bottom: 4, left: -8 }}>
        <CartesianGrid stroke="var(--grid)" strokeDasharray="2 3" />
        <XAxis
          dataKey="t"
          type="number"
          domain={["dataMin", "dataMax"]}
          tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
          stroke="var(--border)"
          label={{ value: "Tiempo (ms)", position: "insideBottom", offset: -2, fill: "var(--muted-foreground)", fontSize: 10 }}
        />
        <YAxis
          tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
          stroke="var(--border)"
          label={{ value: unit, angle: -90, position: "insideLeft", fill: "var(--muted-foreground)", fontSize: 10 }}
        />
        <Tooltip
          contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 4, fontSize: 12 }}
          labelFormatter={(v) => `${v} ms`}
          formatter={(v: number) => [`${v.toFixed(3)} ${unit}`, "Amplitud"]}
        />
        <Line type="monotone" dataKey="v" stroke="var(--trace-2)" strokeWidth={1.4} dot={false} isAnimationActive={false} />
        <Brush dataKey="t" height={18} stroke="var(--border)" fill="var(--secondary)" travellerWidth={8} />
      </LineChart>
    </ResponsiveContainer>
  );
}
