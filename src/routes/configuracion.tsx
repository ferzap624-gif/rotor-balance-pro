import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Panel } from "@/components/industrial/Panel";
import { PageHeader } from "@/components/shell/PageHeader";
import { useSystem, type Settings } from "@/store/system-store";
import type { SimulatorScenario, TransportMode } from "@/lib/balance/types";

export const Route = createFileRoute("/configuracion")({
  head: () => ({
    meta: [
      { title: "Configuración del sistema — Balanceador Dinámico" },
      {
        name: "description",
        content:
          "Nivel de operación, unidades, límites de vibración, tolerancias, datos de máquina y parámetros de comunicación con el hardware.",
      },
      { property: "og:title", content: "Configuración del sistema — Balanceador Dinámico" },
      { property: "og:description", content: "Ajuste de nivel de operación, unidades, límites y comunicación." },
    ],
  }),
  component: SettingsPage,
});

const MODES: Array<{ value: TransportMode; label: string; hint: string }> = [
  { value: "MODE_SIMULATION", label: "Simulación", hint: "Simulador interno, sin hardware" },
  { value: "MODE_ESP32", label: "ESP32 (WebSocket)", hint: "ws://host/telemetry" },
  { value: "MODE_PLC", label: "PLC (pasarela REST)", hint: "http://host/api" },
  { value: "MODE_API", label: "API REST", hint: "http://host/api" },
  { value: "MODE_WEBSOCKET", label: "WebSocket genérico", hint: "ws://host/telemetry" },
];

const SCENARIOS: SimulatorScenario[] = ["BALANCEADO", "DESBALANCE", "RUIDO", "VIBRACION_ELEVADA", "RPM_INESTABLE"];

function SettingsPage() {
  const { settings, updateSettings, rotor, updateRotor, transport, configureTransport, reconnect, connectionDetail } =
    useSystem();

  const setLimits = (patch: Partial<Settings["limits"]>) =>
    updateSettings({ limits: { ...settings.limits, ...patch } });
  const setUnits = (patch: Partial<Settings["units"]>) => updateSettings({ units: { ...settings.units, ...patch } });
  const setTol = (patch: Partial<Settings["tolerances"]>) =>
    updateSettings({ tolerances: { ...settings.tolerances, ...patch } });

  return (
    <div>
      <PageHeader title="Configuración" subtitle="Parámetros de operación, unidades, límites y comunicación" />

      <div className="grid gap-3 xl:grid-cols-3">
        <Panel title="Nivel de operación">
          <div className="grid gap-2">
            {(["AFICIONADO", "PROFESIONAL"] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => {
                  updateSettings({ level: lvl });
                  toast.success(`Nivel ${lvl} activado`);
                }}
                className={`rounded-sm border px-3 py-2 text-left transition-colors ${
                  settings.level === lvl ? "border-primary bg-primary/10" : "border-border hover:bg-accent/40"
                }`}
              >
                <p className="text-sm font-bold text-foreground">
                  {lvl === "AFICIONADO" ? "Aficionado / Básico" : "Profesional / Industrial"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {lvl === "AFICIONADO"
                    ? "Asistente de 6 pasos con instrucciones físicas al operador"
                    : "Panel completo con FFT, forma de onda, vector, fase y estados de hardware"}
                </p>
              </button>
            ))}
          </div>
        </Panel>

        <Panel title="Usuario y máquina">
          <Field label="Operador">
            <Input value={settings.operator} maxLength={60} onChange={(e) => updateSettings({ operator: e.target.value })} />
          </Field>
          <Field label="Identificación de máquina">
            <Input value={settings.machineTag} maxLength={40} onChange={(e) => updateSettings({ machineTag: e.target.value })} />
          </Field>
          <Field label="Nombre del rotor">
            <Input value={rotor.name} maxLength={60} onChange={(e) => updateRotor({ name: e.target.value })} />
          </Field>
          <Field label="RPM de trabajo">
            <NumInput value={rotor.targetRpm} min={100} max={12000} onChange={(v) => updateRotor({ targetRpm: v })} />
          </Field>
          <Field label="Planos de balanceo">
            <Select value={String(rotor.planes)} onValueChange={(v) => updateRotor({ planes: v === "2" ? 2 : 1 })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 plano (estático)</SelectItem>
                <SelectItem value="2">2 planos (dinámico)</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </Panel>

        <Panel title="Unidades">
          <Field label="Vibración">
            <Select value={settings.units.vibration} onValueChange={(v) => setUnits({ vibration: v as "mm/s" | "in/s" })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mm/s">mm/s RMS</SelectItem>
                <SelectItem value="in/s">in/s RMS</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Masa">
            <Select value={settings.units.mass} onValueChange={(v) => setUnits({ mass: v as "g" | "oz" })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="g">gramos</SelectItem>
                <SelectItem value="oz">onzas</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Longitud">
            <Select value={settings.units.length} onValueChange={(v) => setUnits({ length: v as "mm" | "in" })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mm">milímetros</SelectItem>
                <SelectItem value="in">pulgadas</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </Panel>

        <Panel title="Límites y condiciones mínimas de medición">
          <Field label={`Límite de vibración (${settings.units.vibration})`}>
            <NumInput value={settings.limits.vibrationLimit} min={0.1} max={50} step={0.1} onChange={(v) => setLimits({ vibrationLimit: v })} />
          </Field>
          <Field label={`Umbral de advertencia (${settings.units.vibration})`}>
            <NumInput value={settings.limits.warningLimit} min={0.1} max={50} step={0.1} onChange={(v) => setLimits({ warningLimit: v })} />
          </Field>
          <Field label="Calidad mínima de señal (%)">
            <NumInput value={settings.limits.minSignalQuality} min={0} max={100} onChange={(v) => setLimits({ minSignalQuality: v })} />
          </Field>
          <Field label="Tiempo mínimo de medición (s)">
            <NumInput value={settings.limits.minMeasurementTime} min={1} max={120} onChange={(v) => setLimits({ minMeasurementTime: v })} />
          </Field>
          <Field label="Desviación máxima de RPM (%)">
            <NumInput value={settings.limits.maxRpmDeviation} min={0.1} max={20} step={0.1} onChange={(v) => setLimits({ maxRpmDeviation: v })} />
          </Field>
        </Panel>

        <Panel title="Tolerancias de resultado">
          <Field label={`Vibración residual objetivo (${settings.units.vibration})`}>
            <NumInput value={settings.tolerances.residualTarget} min={0.1} max={20} step={0.1} onChange={(v) => setTol({ residualTarget: v })} />
          </Field>
          <Field label="Reducción mínima aceptable (%)">
            <NumInput value={settings.tolerances.minReduction} min={5} max={99} onChange={(v) => setTol({ minReduction: v })} />
          </Field>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Estos valores solo determinan la evaluación mostrada. Las protecciones y enclavamientos de seguridad
            permanecen siempre en el PLC o sistema físico.
          </p>
        </Panel>

        <Panel title="Comunicación con el hardware">
          <Field label="Modo de transporte">
            <Select value={transport.mode} onValueChange={(v) => configureTransport({ mode: v as TransportMode })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODES.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Endpoint">
            <Input value={transport.endpoint} maxLength={200} onChange={(e) => configureTransport({ endpoint: e.target.value })} />
          </Field>
          <Field label="Intervalo de sondeo (ms)">
            <NumInput value={transport.pollIntervalMs} min={50} max={5000} onChange={(v) => configureTransport({ pollIntervalMs: v })} />
          </Field>
          {transport.mode === "MODE_SIMULATION" ? (
            <Field label="Escenario del simulador">
              <Select value={transport.scenario} onValueChange={(v) => configureTransport({ scenario: v as SimulatorScenario })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCENARIOS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          ) : null}
          <Button className="mt-2 w-full" size="sm" onClick={() => reconnect()}>
            Aplicar y reconectar
          </Button>
          <p className="mt-2 text-[11px] text-muted-foreground">Enlace: {connectionDetail}</p>
        </Panel>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-2.5">
      <span className="label-tech">{label}</span>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function NumInput({
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
}) {
  return (
    <Input
      className="num"
      type="number"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => {
        const n = Number(e.target.value);
        if (!Number.isFinite(n)) return;
        onChange(Math.min(max, Math.max(min, n)));
      }}
    />
  );
}
