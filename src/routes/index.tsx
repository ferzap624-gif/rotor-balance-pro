import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, Cog, FileText, History } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Panel } from "@/components/industrial/Panel";
import { PageHeader } from "@/components/shell/PageHeader";
import { RealtimeValue } from "@/components/industrial/RealtimeValue";
import { PhaseIndicator, RpmGauge, VibrationGauge } from "@/components/industrial/Gauges";
import { RotorDiagram } from "@/components/industrial/RotorDiagram";
import { FftChart, HarmonicsTable } from "@/components/industrial/FftChart";
import { AlarmPanel } from "@/components/industrial/AlarmPanel";
import { ProcessSteps } from "@/components/industrial/ProcessSteps";
import {
  MachineStatus,
  SafetyPanelBody,
  SensorStatus,
  SignalQualityBar,
} from "@/components/industrial/StatusIndicators";
import { useSystem } from "@/store/system-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Panel principal — Balanceador Dinámico" },
      {
        name: "description",
        content:
          "Supervisión en tiempo real de RPM, vibración, fase y estado de la máquina de balanceo dinámico de 1 y 2 planos.",
      },
      { property: "og:title", content: "Panel principal — Balanceador Dinámico" },
      {
        property: "og:description",
        content: "RPM, vibración, fase, espectro FFT y proceso de balanceo en una sola pantalla.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { telemetry, settings, rotor, updateRotor, workflow, alarms, clearAlarms, measurementGuard } = useSystem();

  const steps = [
    {
      index: 1,
      title: "Medición inicial",
      detail: workflow.initial ? "Completado" : "Pendiente",
      state: (workflow.initial ? "done" : "current") as "done" | "current" | "pending",
    },
    {
      index: 2,
      title: "Masa de prueba y 2ª medición",
      detail: workflow.trialA ? "Completado" : workflow.initial ? "En proceso" : "Pendiente",
      state: (workflow.trialA ? "done" : workflow.initial ? "current" : "pending") as "done" | "current" | "pending",
    },
    {
      index: 3,
      title: "Calcular corrección",
      detail: workflow.correction ? "Completado" : workflow.trialA ? "En proceso" : "Pendiente",
      state: (workflow.correction ? "done" : workflow.trialA ? "current" : "pending") as "done" | "current" | "pending",
    },
    {
      index: 4,
      title: "Colocar masa y verificar",
      detail: workflow.verification ? "Completado" : workflow.correction ? "En proceso" : "Pendiente",
      state: (workflow.verification ? "done" : workflow.correction ? "current" : "pending") as
        | "done"
        | "current"
        | "pending",
    },
  ];

  return (
    <div>
      <PageHeader
        title="Panel principal"
        subtitle={`${settings.machineTag} · ${rotor.name} · ${rotor.planes} plano${rotor.planes === 2 ? "s" : ""}`}
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link to="/analisis">
                <Activity className="mr-1.5 h-4 w-4" /> Análisis
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/medicion">Iniciar medición</Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_290px]">
        <div className="min-w-0 space-y-3">
          {/* Variables críticas */}
          <div className="grid gap-3 lg:grid-cols-[auto_minmax(0,1fr)_auto]">
            <Panel title="Velocidad" className="min-w-0">
              <RpmGauge rpm={telemetry.rpm} target={rotor.targetRpm} stable={telemetry.rpmStable} />
            </Panel>
            <Panel title="Vibración" subtitle="componente global" className="min-w-0">
              <VibrationGauge
                rms={telemetry.vibrationRms}
                peak={telemetry.vibrationPeak}
                limit={settings.limits.vibrationLimit}
                warning={settings.limits.warningLimit}
                unit={settings.units.vibration}
              />
            </Panel>
            <Panel title="Fase 1×" className="min-w-0">
              <PhaseIndicator phase={telemetry.phase} />
            </Panel>
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
            <Panel title="Espectro de vibración (FFT)" subtitle={`1× = ${telemetry.harmonics.x1.frequency.toFixed(1)} Hz`}>
              <FftChart spectrum={telemetry.spectrum} harmonics={telemetry.harmonics} unit={settings.units.vibration} height={230} />
              <div className="mt-2">
                <HarmonicsTable harmonics={telemetry.harmonics} unit={settings.units.vibration} />
              </div>
            </Panel>

            <Panel
              title="Vista del rotor"
              subtitle={`${rotor.planes} plano${rotor.planes === 2 ? "s" : ""}`}
              actions={
                <div className="flex gap-1">
                  {([1, 2] as const).map((p) => (
                    <Button
                      key={p}
                      size="sm"
                      variant={rotor.planes === p ? "default" : "outline"}
                      onClick={() => updateRotor({ planes: p })}
                    >
                      {p}P
                    </Button>
                  ))}
                </div>
              }
            >
              <RotorDiagram
                size={230}
                direction={telemetry.rotationDirection}
                markers={[{ angle: telemetry.phase, label: `${telemetry.vibrationRms.toFixed(1)}`, kind: "vibration" }]}
              />
              <div className="mt-2 grid grid-cols-2 gap-2">
                <RealtimeValue label="Fase actual 1×" value={`${telemetry.phase}°`} size="sm" />
                <RealtimeValue label="Amplitud 1×" value={telemetry.harmonics.x1.amplitude.toFixed(2)} unit={settings.units.vibration} size="sm" />
              </div>
            </Panel>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <RealtimeValue label="Frecuencia variador" value={telemetry.driveFrequency.toFixed(1)} unit="Hz" size="sm" />
            <RealtimeValue label="Corriente motor" value={telemetry.motorCurrent.toFixed(2)} unit="A" size="sm" />
            <RealtimeValue label="Temperatura sensor" value={telemetry.temperature.toFixed(1)} unit="°C" size="sm" />
          </div>
        </div>

        {/* Columna de estado */}
        <div className="min-w-0 space-y-3">
          <Panel title="Estado del equipo">
            <MachineStatus state={telemetry.machineState} />
            <div className="mt-3">
              <SignalQualityBar
                quality={telemetry.signalQuality}
                issues={telemetry.qualityIssues}
                minimum={settings.limits.minSignalQuality}
              />
            </div>
          </Panel>

          <Panel title="Proceso de balanceo">
            <ProcessSteps steps={steps} />
          </Panel>

          <Panel title="Seguridad">
            <SafetyPanelBody safety={telemetry.safetyStatus} blocked={measurementGuard.reasons} />
          </Panel>

          <Panel title="Sensores">
            <SensorStatus sensors={telemetry.sensorStatus} />
          </Panel>

          <Panel title="Alarmas">
            <AlarmPanel alarms={alarms} onClear={clearAlarms} />
          </Panel>

          <Panel title="Herramientas rápidas" bodyClassName="grid gap-2">
            <Button asChild variant="outline" size="sm" className="justify-start">
              <Link to="/historial">
                <History className="mr-2 h-4 w-4" /> Ver historial
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="justify-start">
              <Link to="/calibracion">
                <Cog className="mr-2 h-4 w-4" /> Calibración
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="justify-start">
              <Link to="/reportes">
                <FileText className="mr-2 h-4 w-4" /> Reportes
              </Link>
            </Button>
          </Panel>
        </div>
      </div>
    </div>
  );
}
