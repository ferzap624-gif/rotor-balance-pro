import { createFileRoute } from "@tanstack/react-router";
import { Play, Square } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Panel } from "@/components/industrial/Panel";
import { PageHeader } from "@/components/shell/PageHeader";
import { MeasurementWizard } from "@/components/industrial/MeasurementWizard";
import { RealtimeValue } from "@/components/industrial/RealtimeValue";
import { PhaseIndicator, RpmGauge, VibrationGauge } from "@/components/industrial/Gauges";
import { WaveformChart } from "@/components/industrial/WaveformChart";
import { FftChart } from "@/components/industrial/FftChart";
import { SignalQualityBar, MachineStatus } from "@/components/industrial/StatusIndicators";
import { useSystem } from "@/store/system-store";
import { dateTime } from "@/lib/balance/format";

export const Route = createFileRoute("/medicion")({
  head: () => ({
    meta: [
      { title: "Medición — Balanceador Dinámico" },
      {
        name: "description",
        content:
          "Adquisición de RPM, vibración y fase con validación de estabilidad y calidad de señal antes de aceptar la medición.",
      },
      { property: "og:title", content: "Medición — Balanceador Dinámico" },
      { property: "og:description", content: "Adquisición guiada de mediciones con control de calidad de señal." },
    ],
  }),
  component: MeasurementPage,
});

function MeasurementPage() {
  const { settings, telemetry, rotor, workflow, measurementGuard, captureMeasurement, sendCommand } = useSystem();

  if (settings.level === "AFICIONADO") {
    return (
      <div>
        <PageHeader title="Medición asistida" subtitle="Nivel aficionado — procedimiento guiado paso a paso" />
        <MeasurementWizard />
      </div>
    );
  }

  const slots = [
    { key: "initial" as const, label: "Medición inicial", sample: workflow.initial },
    { key: "trialA" as const, label: "Masa de prueba plano A", sample: workflow.trialA },
    ...(rotor.planes === 2
      ? [{ key: "trialB" as const, label: "Masa de prueba plano B", sample: workflow.trialB }]
      : []),
    { key: "verification" as const, label: "Verificación", sample: workflow.verification },
  ];

  return (
    <div>
      <PageHeader
        title="Medición"
        subtitle="Nivel profesional — adquisición manual por etapas"
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => void sendCommand({ name: "DRIVE_START" })}>
              <Play className="mr-1.5 h-4 w-4" /> Arrancar
            </Button>
            <Button variant="outline" size="sm" onClick={() => void sendCommand({ name: "MEASURE_START" })}>
              Adquirir
            </Button>
            <Button variant="outline" size="sm" onClick={() => void sendCommand({ name: "MEASURE_STOP" })}>
              <Square className="mr-1.5 h-4 w-4" /> Detener
            </Button>
          </>
        }
      />

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-3">
          <div className="grid gap-3 lg:grid-cols-[auto_minmax(0,1fr)_auto]">
            <Panel title="Velocidad">
              <RpmGauge rpm={telemetry.rpm} target={rotor.targetRpm} stable={telemetry.rpmStable} />
            </Panel>
            <Panel title="Vibración">
              <VibrationGauge
                rms={telemetry.vibrationRms}
                peak={telemetry.vibrationPeak}
                limit={settings.limits.vibrationLimit}
                warning={settings.limits.warningLimit}
                unit={settings.units.vibration}
              />
            </Panel>
            <Panel title="Fase">
              <PhaseIndicator phase={telemetry.phase} />
            </Panel>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <Panel title="Forma de onda temporal" subtitle="200 ms">
              <WaveformChart waveform={telemetry.waveform} unit={settings.units.vibration} height={200} />
            </Panel>
            <Panel title="Espectro FFT">
              <FftChart spectrum={telemetry.spectrum} harmonics={telemetry.harmonics} unit={settings.units.vibration} height={200} />
            </Panel>
          </div>

          <Panel title="Etapas de adquisición">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="label-tech py-1 text-left">Etapa</th>
                    <th className="label-tech py-1 text-right">RPM</th>
                    <th className="label-tech py-1 text-right">1× Plano A</th>
                    <th className="label-tech py-1 text-right">1× Plano B</th>
                    <th className="label-tech py-1 text-right">Calidad</th>
                    <th className="label-tech py-1 text-right">Marca de tiempo</th>
                    <th className="label-tech py-1 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {slots.map((s) => (
                    <tr key={s.key} className="border-b border-border/60 last:border-0">
                      <td className="py-2 font-semibold text-foreground">{s.label}</td>
                      <td className="num py-2 text-right">{s.sample ? s.sample.rpm : "—"}</td>
                      <td className="num py-2 text-right">
                        {s.sample ? `${s.sample.planeA.amplitude.toFixed(2)} ∠ ${s.sample.planeA.angle}°` : "—"}
                      </td>
                      <td className="num py-2 text-right">
                        {s.sample?.planeB ? `${s.sample.planeB.amplitude.toFixed(2)} ∠ ${s.sample.planeB.angle}°` : "—"}
                      </td>
                      <td className="num py-2 text-right">{s.sample ? `${s.sample.signalQuality} %` : "—"}</td>
                      <td className="num py-2 text-right text-muted-foreground">
                        {s.sample ? dateTime(s.sample.timestamp) : "—"}
                      </td>
                      <td className="py-2 text-right">
                        <Button
                          size="sm"
                          variant={s.sample ? "outline" : "default"}
                          disabled={!measurementGuard.allowed}
                          onClick={() => captureMeasurement(s.key)}
                        >
                          {s.sample ? "Repetir" : "Capturar"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        <div className="min-w-0 space-y-3">
          <Panel title="Estado">
            <MachineStatus state={telemetry.machineState} />
            <div className="mt-3 grid grid-cols-2 gap-2">
              <RealtimeValue
                label="Estabilidad"
                value={telemetry.rpmStable ? "ESTABLE" : "NO ESTABLE"}
                size="sm"
                severity={telemetry.rpmStable ? "ok" : "warn"}
              />
              <RealtimeValue label="Tiempo" value={telemetry.measurementTime.toFixed(1)} unit="s" size="sm" />
            </div>
          </Panel>

          <Panel title="Calidad de medición">
            <SignalQualityBar
              quality={telemetry.signalQuality}
              issues={telemetry.qualityIssues}
              minimum={settings.limits.minSignalQuality}
            />
            {!measurementGuard.allowed ? (
              <div className="mt-3 rounded-sm border border-destructive/50 bg-destructive/10 p-2">
                <p className="text-xs font-bold text-destructive">CAPTURA BLOQUEADA</p>
                <ul className="mt-1 space-y-0.5">
                  {measurementGuard.reasons.map((r) => (
                    <li key={r} className="text-[11px] text-destructive">
                      · {r}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </Panel>
        </div>
      </div>
    </div>
  );
}
