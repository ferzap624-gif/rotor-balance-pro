import { useState } from "react";
import { Pause, Play, RotateCcw, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DriveStatus } from "@/components/industrial/StatusIndicators";
import { RealtimeValue } from "@/components/industrial/RealtimeValue";
import { useSystem } from "@/store/system-store";

/**
 * Control LÓGICO del variador. Los comandos se envían al backend/PLC.
 * El paro de emergencia y las protecciones críticas residen en el hardware.
 */
export function DriveControl() {
  const { telemetry, sendCommand, rotor, updateRotor, measurementGuard, connection } = useSystem();
  const [rpmInput, setRpmInput] = useState(String(rotor.targetRpm));
  const startBlocked = !telemetry.safetyStatus.runPermit || connection !== "CONECTADO";

  return (
    <div className="space-y-3">
      <DriveStatus state={telemetry.driveStatus} alarm={telemetry.driveAlarm} />

      <div className="grid grid-cols-2 gap-2 xl:grid-cols-3">
        <RealtimeValue label="Frecuencia" value={telemetry.driveFrequency.toFixed(1)} unit="Hz" size="sm" />
        <RealtimeValue label="RPM estimadas" value={telemetry.rpm} unit="rpm" size="sm" />
        <RealtimeValue label="Corriente" value={telemetry.motorCurrent.toFixed(2)} unit="A" size="sm" />
        <RealtimeValue label="Potencia" value={telemetry.motorPower.toFixed(2)} unit="kW" size="sm" />
        <RealtimeValue label="Sentido" value={telemetry.rotationDirection === "CW" ? "Horario" : "Antihor." } size="sm" />
        <RealtimeValue
          label="Temperatura"
          value={telemetry.temperature.toFixed(1)}
          unit="°C"
          size="sm"
          severity={telemetry.temperature > 60 ? "warn" : "ok"}
        />
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2">
        <div className="min-w-0">
          <label className="label-tech" htmlFor="drive-rpm">
            Consigna de RPM
          </label>
          <Input
            id="drive-rpm"
            className="num mt-1"
            value={rpmInput}
            inputMode="numeric"
            onChange={(e) => setRpmInput(e.target.value)}
          />
        </div>
        <Button
          variant="secondary"
          className="shrink-0"
          onClick={() => {
            const rpm = Number(rpmInput);
            if (!Number.isFinite(rpm) || rpm <= 0 || rpm > 12000) return;
            updateRotor({ targetRpm: rpm });
            void sendCommand({ name: "SET_TARGET_RPM", payload: { rpm } });
          }}
        >
          <Send className="mr-1.5 h-4 w-4" /> Enviar
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button disabled={startBlocked} onClick={() => void sendCommand({ name: "DRIVE_START" })}>
          <Play className="mr-1.5 h-4 w-4" /> Iniciar
        </Button>
        <Button variant="secondary" onClick={() => void sendCommand({ name: "DRIVE_STOP" })}>
          <Pause className="mr-1.5 h-4 w-4" /> Detener
        </Button>
        <Button variant="destructive" onClick={() => void sendCommand({ name: "DRIVE_EMERGENCY" })}>
          Paro
        </Button>
        <Button variant="outline" onClick={() => void sendCommand({ name: "DRIVE_RESET_FAULT" })}>
          <RotateCcw className="mr-1.5 h-4 w-4" /> Reset falla
        </Button>
      </div>

      {startBlocked ? (
        <p className="rounded-sm border border-destructive/50 bg-destructive/10 px-2 py-1.5 text-[11px] text-destructive">
          Arranque bloqueado: {measurementGuard.reasons[0] ?? "sin permiso del hardware"}
        </p>
      ) : null}
    </div>
  );
}
