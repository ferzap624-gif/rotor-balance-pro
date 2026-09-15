import { createFileRoute } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { Panel } from "@/components/industrial/Panel";
import { PageHeader } from "@/components/shell/PageHeader";
import { AlarmPanel } from "@/components/industrial/AlarmPanel";
import {
  CommunicationStatus,
  DriveStatus,
  MachineStatus,
  SafetyPanelBody,
  SensorStatus,
  SignalQualityBar,
} from "@/components/industrial/StatusIndicators";
import { useSystem } from "@/store/system-store";
import { dateTime } from "@/lib/balance/format";

export const Route = createFileRoute("/diagnostico")({
  head: () => ({
    meta: [
      { title: "Diagnóstico del sistema — Balanceador Dinámico" },
      {
        name: "description",
        content:
          "Estado de comunicación, sensores, variador, seguridad y calidad de señal, con alarmas activas y últimas tramas recibidas.",
      },
      { property: "og:title", content: "Diagnóstico del sistema — Balanceador Dinámico" },
      { property: "og:description", content: "Verificación del estado de cada componente del balanceador." },
    ],
  }),
  component: DiagnosticsPage,
});

function DiagnosticsPage() {
  const {
    telemetry,
    connection,
    connectionDetail,
    transport,
    reconnect,
    disconnect,
    alarms,
    clearAlarms,
    measurementGuard,
    settings,
    sendCommand,
  } = useSystem();

  return (
    <div>
      <PageHeader
        title="Diagnóstico"
        subtitle={`${settings.machineTag} · ${transport.mode}`}
        actions={
          <>
            <Button size="sm" onClick={() => reconnect()}>
              Reconectar
            </Button>
            <Button size="sm" variant="outline" onClick={() => disconnect()}>
              Desconectar
            </Button>
            <Button size="sm" variant="outline" onClick={() => void sendCommand({ name: "DRIVE_RESET_FAULT" })}>
              Reset falla
            </Button>
          </>
        }
      />

      <div className="grid gap-3 xl:grid-cols-3">
        <Panel title="Comunicación">
          <div className="space-y-2">
            <CommunicationStatus state={connection} detail={connectionDetail} />
            <Row label="Modo" value={transport.mode} />
            <Row label="Endpoint" value={transport.endpoint} />
            <Row label="Sondeo" value={`${transport.pollIntervalMs} ms`} />
            <Row label="Última trama" value={telemetry.timestamp ? dateTime(telemetry.timestamp) : "—"} />
            <Row label="Origen" value={telemetry.simulated ? "SIMULADO" : "HARDWARE"} />
          </div>
        </Panel>

        <Panel title="Estado de máquina y variador">
          <div className="space-y-2">
            <MachineStatus state={telemetry.machineState} />
            <DriveStatus state={telemetry.driveStatus} alarm={telemetry.driveAlarm} />
            <Row label="Frecuencia" value={`${telemetry.driveFrequency.toFixed(1)} Hz`} />
            <Row label="Corriente" value={`${telemetry.motorCurrent.toFixed(2)} A`} />
            <Row label="Potencia" value={`${telemetry.motorPower.toFixed(2)} kW`} />
            <Row label="Sentido de giro" value={telemetry.rotationDirection} />
            <Row label="Temperatura sensor" value={`${telemetry.temperature.toFixed(1)} °C`} />
          </div>
        </Panel>

        <Panel title="Sensores">
          <SensorStatus sensors={telemetry.sensorStatus} />
          <div className="mt-3">
            <SignalQualityBar quality={telemetry.signalQuality} issues={telemetry.qualityIssues} />
          </div>
        </Panel>

        <Panel title="Seguridad">
          <SafetyPanelBody
            safety={telemetry.safetyStatus}
            blocked={measurementGuard.allowed ? [] : measurementGuard.reasons}
          />
        </Panel>

        <Panel title="Bloqueos activos" className="xl:col-span-1">
          {measurementGuard.allowed ? (
            <p className="text-xs font-bold text-success">
              Sin bloqueos: el hardware informa condiciones válidas para medir.
            </p>
          ) : (
            <ul className="space-y-1.5 text-xs">
              {measurementGuard.reasons.map((r) => (
                <li key={r} className="rounded-sm border border-destructive/40 bg-destructive/10 px-2 py-1.5 text-destructive">
                  {r}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-[11px] text-muted-foreground">
            El paro de emergencia y las protecciones críticas se ejecutan en el sistema físico/PLC. Esta pantalla solo
            informa lo que el hardware reporta.
          </p>
        </Panel>

        <AlarmPanel alarms={alarms} onClear={clearAlarms} />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b border-border/60 py-1 last:border-0">
      <span className="min-w-0 truncate text-xs text-muted-foreground">{label}</span>
      <span className="num shrink-0 text-xs font-semibold text-foreground">{value}</span>
    </div>
  );
}
