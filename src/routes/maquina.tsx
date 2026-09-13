import { createFileRoute } from "@tanstack/react-router";

import { Panel } from "@/components/industrial/Panel";
import { PageHeader } from "@/components/shell/PageHeader";
import { DriveControl } from "@/components/industrial/DriveControl";
import { RealtimeValue } from "@/components/industrial/RealtimeValue";
import {
  CommunicationStatus,
  MachineStatus,
  SafetyPanelBody,
  SensorStatus,
} from "@/components/industrial/StatusIndicators";
import { useSystem } from "@/store/system-store";

export const Route = createFileRoute("/maquina")({
  head: () => ({
    meta: [
      { title: "Máquina y variador — Balanceador Dinámico" },
      {
        name: "description",
        content:
          "Estado de máquina, control lógico del variador de frecuencia, sensores y condiciones de seguridad del balanceador.",
      },
      { property: "og:title", content: "Máquina y variador — Balanceador Dinámico" },
      { property: "og:description", content: "Control lógico del variador y supervisión de sensores y seguridad." },
    ],
  }),
  component: MachinePage,
});

function MachinePage() {
  const { telemetry, connection, connectionDetail, transport, measurementGuard, rotor, settings } = useSystem();

  return (
    <div>
      <PageHeader title="Máquina" subtitle={`${settings.machineTag} · Rotor: ${rotor.name}`} />

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_300px]">
        <Panel title="Control del variador" subtitle="comandos enviados al PLC/ESP32">
          <DriveControl />
        </Panel>

        <div className="min-w-0 space-y-3">
          <Panel title="Estado de máquina">
            <MachineStatus state={telemetry.machineState} />
            <div className="mt-3 grid grid-cols-2 gap-2">
              <RealtimeValue label="RPM" value={telemetry.rpm} unit="rpm" size="sm" severity={telemetry.rpmStable ? "ok" : "warn"} />
              <RealtimeValue label="RPM objetivo" value={rotor.targetRpm} unit="rpm" size="sm" />
              <RealtimeValue
                label="Vibración"
                value={telemetry.vibrationRms.toFixed(2)}
                unit={settings.units.vibration}
                size="sm"
              />
              <RealtimeValue label="Aceleración" value={telemetry.acceleration.toFixed(3)} unit="g" size="sm" />
            </div>
          </Panel>

          <Panel title="Comunicación">
            <CommunicationStatus state={connection} mode={transport.mode} detail={connectionDetail} />
            <dl className="mt-3 space-y-1.5 text-xs">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                <dt className="text-muted-foreground">Endpoint</dt>
                <dd className="num truncate text-foreground">{transport.endpoint}</dd>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                <dt className="text-muted-foreground">Periodo de trama</dt>
                <dd className="num text-foreground">{transport.pollIntervalMs} ms</dd>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                <dt className="text-muted-foreground">Origen de datos</dt>
                <dd className={telemetry.simulated ? "font-bold text-warning" : "font-bold text-success"}>
                  {telemetry.simulated ? "SIMULADO" : "HARDWARE REAL"}
                </dd>
              </div>
            </dl>
          </Panel>
        </div>

        <div className="min-w-0 space-y-3">
          <Panel title="Seguridad">
            <SafetyPanelBody safety={telemetry.safetyStatus} blocked={measurementGuard.reasons} />
          </Panel>
          <Panel title="Sensores">
            <SensorStatus sensors={telemetry.sensorStatus} />
          </Panel>
        </div>
      </div>
    </div>
  );
}
