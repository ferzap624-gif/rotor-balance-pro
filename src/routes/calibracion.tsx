import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Panel } from "@/components/industrial/Panel";
import { PageHeader } from "@/components/shell/PageHeader";
import { useSystem } from "@/store/system-store";
import { dateTime } from "@/lib/balance/format";

export const Route = createFileRoute("/calibracion")({
  head: () => ({
    meta: [
      { title: "Calibración de sensores — Balanceador Dinámico" },
      {
        name: "description",
        content:
          "Calibración de acelerómetros, sensor de RPM y referencia angular con valor medido, esperado, error y factor de corrección.",
      },
      { property: "og:title", content: "Calibración de sensores — Balanceador Dinámico" },
      { property: "og:description", content: "Registro y verificación de calibraciones de canal A, B, RPM y referencia." },
    ],
  }),
  component: CalibrationPage,
});

const CHANNELS = [
  "Acelerómetro canal A",
  "Acelerómetro canal B",
  "Sensor de RPM óptico",
  "Referencia angular",
];

function CalibrationPage() {
  const { calibrations, addCalibration, settings, telemetry, sendCommand } = useSystem();
  const [channel, setChannel] = useState(CHANNELS[0]!);
  const [measured, setMeasured] = useState("10");
  const [expected, setExpected] = useState("10");

  const m = Number(measured);
  const e = Number(expected);
  const valid = Number.isFinite(m) && Number.isFinite(e) && e !== 0;
  const error = valid ? ((m - e) / e) * 100 : 0;
  const factor = valid && m !== 0 ? e / m : 1;

  return (
    <div>
      <PageHeader title="Calibración" subtitle={`${settings.machineTag} · responsable ${settings.operator}`} />

      <div className="grid gap-3 xl:grid-cols-[380px_minmax(0,1fr)]">
        <div className="min-w-0 space-y-3">
          <Panel title="Nueva calibración">
            <div className="space-y-3">
              <div>
                <span className="label-tech">Canal</span>
                <Select value={channel} onValueChange={setChannel}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CHANNELS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="label-tech">Valor medido</span>
                  <Input className="num mt-1" inputMode="decimal" value={measured} onChange={(ev) => setMeasured(ev.target.value)} />
                </div>
                <div>
                  <span className="label-tech">Valor esperado</span>
                  <Input className="num mt-1" inputMode="decimal" value={expected} onChange={(ev) => setExpected(ev.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="panel-surface px-2 py-1.5">
                  <p className="label-tech">Error</p>
                  <p className={`num text-lg font-bold ${Math.abs(error) > 3 ? "text-destructive" : "text-success"}`}>
                    {valid ? `${error.toFixed(2)} %` : "—"}
                  </p>
                </div>
                <div className="panel-surface px-2 py-1.5">
                  <p className="label-tech">Factor</p>
                  <p className="num text-lg font-bold text-foreground">{valid ? factor.toFixed(4) : "—"}</p>
                </div>
              </div>
              <Button
                className="w-full"
                disabled={!valid}
                onClick={() => {
                  addCalibration({
                    channel,
                    measured: m,
                    expected: e,
                    error: Math.round(error * 100) / 100,
                    factor: Math.round(factor * 10000) / 10000,
                    user: settings.operator,
                    status: Math.abs(error) > 5 ? "FALLIDA" : "VALIDA",
                  });
                  toast.success("Calibración registrada");
                }}
              >
                Guardar calibración
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => void sendCommand({ name: "CAPTURE_ANGULAR_REFERENCE" })}
              >
                Capturar referencia angular
              </Button>
              <p className="text-[11px] text-muted-foreground">
                Referencia angular actual según el hardware: {telemetry.sensorStatus.angularReference}
              </p>
            </div>
          </Panel>
        </div>

        <Panel title="Historial de calibraciones">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="label-tech py-1 text-left">Canal</th>
                  <th className="label-tech py-1 text-right">Medido</th>
                  <th className="label-tech py-1 text-right">Esperado</th>
                  <th className="label-tech py-1 text-right">Error</th>
                  <th className="label-tech py-1 text-right">Factor</th>
                  <th className="label-tech py-1 text-left">Fecha</th>
                  <th className="label-tech py-1 text-left">Usuario</th>
                  <th className="label-tech py-1 text-left">Estado</th>
                </tr>
              </thead>
              <tbody>
                {calibrations.map((c) => (
                  <tr key={c.id} className="border-b border-border/60 last:border-0">
                    <td className="py-2 font-semibold text-foreground">{c.channel}</td>
                    <td className="num py-2 text-right">{c.measured}</td>
                    <td className="num py-2 text-right">{c.expected}</td>
                    <td className={`num py-2 text-right ${Math.abs(c.error) > 3 ? "text-warning" : "text-success"}`}>
                      {c.error.toFixed(2)} %
                    </td>
                    <td className="num py-2 text-right">{c.factor.toFixed(4)}</td>
                    <td className="num py-2 text-muted-foreground">{dateTime(c.date)}</td>
                    <td className="py-2 text-muted-foreground">{c.user}</td>
                    <td
                      className={`py-2 font-bold ${
                        c.status === "VALIDA" ? "text-success" : c.status === "VENCIDA" ? "text-warning" : "text-destructive"
                      }`}
                    >
                      {c.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
}
