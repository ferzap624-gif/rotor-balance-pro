import { createFileRoute } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { Panel } from "@/components/industrial/Panel";
import { PageHeader } from "@/components/shell/PageHeader";
import { RealtimeValue } from "@/components/industrial/RealtimeValue";
import { WaveformChart } from "@/components/industrial/WaveformChart";
import { FftChart } from "@/components/industrial/FftChart";
import { useSystem } from "@/store/system-store";
import type { SimulatorScenario } from "@/lib/balance/types";

export const Route = createFileRoute("/simulacion")({
  head: () => ({
    meta: [
      { title: "Modo simulación — Balanceador Dinámico" },
      {
        name: "description",
        content:
          "Simulador de hardware con escenarios de rotor equilibrado, desbalance, ruido, vibración elevada y RPM inestable.",
      },
      { property: "og:title", content: "Modo simulación — Balanceador Dinámico" },
      { property: "og:description", content: "Pruebe el flujo completo de balanceo sin hardware conectado." },
    ],
  }),
  component: SimulationPage,
});

const SCENARIOS: Array<{ value: SimulatorScenario; label: string; description: string }> = [
  { value: "BALANCEADO", label: "Rotor equilibrado", description: "Vibración baja y estable, fase poco definida." },
  { value: "DESBALANCE", label: "Desbalance típico", description: "Componente 1× dominante con fase repetible." },
  { value: "RUIDO", label: "Ruido eléctrico / mecánico", description: "Espectro sucio y calidad de señal reducida." },
  { value: "VIBRACION_ELEVADA", label: "Vibración elevada", description: "Supera el límite y genera alarma." },
  { value: "RPM_INESTABLE", label: "RPM inestable", description: "Velocidad fluctuante: bloquea la medición." },
];

function SimulationPage() {
  const { scenario, setScenario, telemetry, transport, configureTransport, reconnect, settings, resetWorkflow } =
    useSystem();
  const sim = transport.mode === "MODE_SIMULATION";

  return (
    <div>
      <PageHeader
        title="Modo simulación"
        subtitle={sim ? "Simulador de hardware activo" : `Transporte actual: ${transport.mode}`}
        actions={
          !sim ? (
            <Button
              size="sm"
              onClick={() => {
                configureTransport({ mode: "MODE_SIMULATION" });
                reconnect();
              }}
            >
              Activar simulación
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={resetWorkflow}>
              Reiniciar flujo de trabajo
            </Button>
          )
        }
      />

      <p className="mb-3 rounded-sm border border-warning/50 bg-warning/10 px-3 py-2 text-xs font-bold text-warning">
        Todos los datos generados en este modo están marcados como SIMULADOS y no deben usarse como registro de una
        máquina real.
      </p>

      <div className="grid gap-3 xl:grid-cols-[380px_minmax(0,1fr)]">
        <Panel title="Escenarios">
          <div className="grid gap-2">
            {SCENARIOS.map((s) => (
              <button
                key={s.value}
                disabled={!sim}
                onClick={() => setScenario(s.value)}
                className={`rounded-sm border px-3 py-2 text-left transition-colors disabled:opacity-50 ${
                  scenario === s.value ? "border-primary bg-primary/10" : "border-border hover:bg-accent/40"
                }`}
              >
                <p className="text-sm font-bold text-foreground">{s.label}</p>
                <p className="text-xs text-muted-foreground">{s.description}</p>
              </button>
            ))}
          </div>
        </Panel>

        <div className="min-w-0 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <RealtimeValue label="RPM" value={telemetry.rpm} unit="rpm" />
            <RealtimeValue label="Vibración RMS" value={telemetry.vibrationRms} unit={settings.units.vibration} decimals={2} />
            <RealtimeValue label="Fase 1×" value={telemetry.harmonics.x1.phase} unit="°" />
            <RealtimeValue label="Calidad" value={telemetry.signalQuality} unit="%" />
          </div>
          <Panel title="Espectro simulado">
            <FftChart spectrum={telemetry.spectrum} harmonics={telemetry.harmonics} unit={settings.units.vibration} height={200} />
          </Panel>
          <Panel title="Forma de onda simulada">
            <WaveformChart waveform={telemetry.waveform} unit={settings.units.vibration} height={180} />
          </Panel>
        </div>
      </div>
    </div>
  );
}
