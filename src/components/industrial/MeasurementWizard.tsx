import { useState } from "react";
import { ArrowLeft, ArrowRight, Play, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Panel } from "@/components/industrial/Panel";
import { RealtimeValue } from "@/components/industrial/RealtimeValue";
import { RpmGauge } from "@/components/industrial/Gauges";
import { CorrectionPanel } from "@/components/industrial/CorrectionPanel";
import { TestWeightForm } from "@/components/industrial/TestWeightForm";
import { SignalQualityBar } from "@/components/industrial/StatusIndicators";
import { ProcessSteps } from "@/components/industrial/ProcessSteps";
import { useSystem } from "@/store/system-store";
import type { RotorConfig } from "@/lib/balance/types";

const STEP_TITLES = [
  "Configurar rotor",
  "Medición inicial",
  "Masa de prueba",
  "Segunda medición",
  "Corrección",
  "Verificación",
];

/** Asistente guiado — nivel AFICIONADO. */
export function MeasurementWizard() {
  const {
    rotor,
    updateRotor,
    telemetry,
    workflow,
    measurementGuard,
    captureMeasurement,
    requestCalculation,
    settings,
    sendCommand,
    resetWorkflow,
  } = useSystem();
  const [step, setStep] = useState(1);

  const initialAmp = workflow.initial?.planeA.amplitude ?? 0;
  const finalAmp = workflow.verification?.planeA.amplitude ?? 0;
  const reduction = initialAmp > 0 && finalAmp > 0 ? ((initialAmp - finalAmp) / initialAmp) * 100 : 0;
  const balanced = finalAmp > 0 && finalAmp <= settings.limits.warningLimit && reduction >= settings.tolerances.minReduction;

  const steps = STEP_TITLES.map((title, i) => ({
    index: i + 1,
    title,
    detail: step === i + 1 ? "En proceso" : step > i + 1 ? "Completado" : "Pendiente",
    state: (step === i + 1 ? "current" : step > i + 1 ? "done" : "pending") as "current" | "done" | "pending",
  }));

  const liveValues = (
    <div className="grid gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
      <RpmGauge rpm={telemetry.rpm} target={rotor.targetRpm} stable={telemetry.rpmStable} />
      <div className="grid min-w-0 grid-cols-2 gap-2 self-center">
        <RealtimeValue
          label="Vibración RMS"
          value={telemetry.vibrationRms.toFixed(2)}
          unit={settings.units.vibration}
          severity={telemetry.vibrationRms > settings.limits.vibrationLimit ? "fault" : "ok"}
        />
        <RealtimeValue label="Fase 1×" value={`${telemetry.phase}°`} />
        <RealtimeValue
          label="Velocidad"
          value={telemetry.rpmStable ? "ESTABLE" : "NO ESTABLE"}
          size="sm"
          severity={telemetry.rpmStable ? "ok" : "warn"}
        />
        <RealtimeValue label="Tiempo medición" value={telemetry.measurementTime.toFixed(1)} unit="s" size="sm" />
      </div>
    </div>
  );

  const blockedNote = !measurementGuard.allowed ? (
    <div className="rounded-sm border border-warning/50 bg-warning/10 p-2">
      <p className="text-xs font-semibold text-warning">No se puede aceptar la medición todavía</p>
      <ul className="mt-1 space-y-0.5">
        {measurementGuard.reasons.map((r) => (
          <li key={r} className="text-[11px] text-warning">
            · {r}
          </li>
        ))}
      </ul>
    </div>
  ) : (
    <p className="rounded-sm border border-success/40 bg-success/10 p-2 text-xs font-semibold text-success">
      Velocidad estable — medición válida disponible
    </p>
  );

  return (
    <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0 space-y-3">
        <Panel
          title={`PASO ${step} — ${STEP_TITLES[step - 1]}`}
          actions={
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={step === 1} onClick={() => setStep((s) => s - 1)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" disabled={step === 6} onClick={() => setStep((s) => s + 1)}>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          }
        >
          {step === 1 ? (
            <div className="grid gap-3 md:grid-cols-2">
              <TextField label="Nombre del rotor" value={rotor.name} onChange={(v) => updateRotor({ name: v })} />
              <div>
                <span className="label-tech">Tipo de rotor</span>
                <Select value={rotor.type} onValueChange={(v) => updateRotor({ type: v as RotorConfig["type"] })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Disco", "Rodillo", "Ventilador", "Turbina", "Eje", "Otro"].map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <NumField label="Diámetro (mm)" value={rotor.diameter} onChange={(v) => updateRotor({ diameter: v })} />
              <NumField label="Masa del rotor (kg)" value={rotor.mass} onChange={(v) => updateRotor({ mass: v })} />
              <NumField
                label="Radio de corrección (mm)"
                value={rotor.correctionRadiusA}
                onChange={(v) => updateRotor({ correctionRadiusA: v, correctionRadiusB: v })}
              />
              <NumField label="RPM objetivo" value={rotor.targetRpm} onChange={(v) => updateRotor({ targetRpm: v })} />
              <div className="md:col-span-2">
                <span className="label-tech">Número de planos</span>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  {([1, 2] as const).map((p) => (
                    <Button
                      key={p}
                      variant={rotor.planes === p ? "default" : "outline"}
                      onClick={() => updateRotor({ planes: p })}
                    >
                      {p} PLANO{p === 2 ? "S" : ""}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {step === 2 || step === 4 ? (
            <div className="space-y-3">
              {liveValues}
              {blockedNote}
              {step === 4 && workflow.initial ? (
                <div className="grid grid-cols-2 gap-2">
                  <RealtimeValue
                    label="Medición inicial 1×"
                    value={`${workflow.initial.planeA.amplitude.toFixed(2)} ∠ ${workflow.initial.planeA.angle}°`}
                    size="sm"
                  />
                  <RealtimeValue
                    label="Con masa de prueba 1×"
                    value={
                      workflow.trialA
                        ? `${workflow.trialA.planeA.amplitude.toFixed(2)} ∠ ${workflow.trialA.planeA.angle}°`
                        : "—"
                    }
                    size="sm"
                    stale={!workflow.trialA}
                  />
                </div>
              ) : null}
              <div className="grid gap-2 sm:grid-cols-2">
                <Button variant="secondary" onClick={() => void sendCommand({ name: "DRIVE_START" })}>
                  <Play className="mr-1.5 h-4 w-4" /> Arrancar rotor
                </Button>
                <Button
                  disabled={!measurementGuard.allowed}
                  onClick={() => {
                    captureMeasurement(step === 2 ? "initial" : "trialA");
                    setStep(step + 1);
                  }}
                >
                  INICIAR MEDICIÓN
                </Button>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-3">
              <TestWeightForm plane="A" />
              {rotor.planes === 2 ? <TestWeightForm plane="B" /> : null}
              <Button className="w-full" onClick={() => setStep(4)}>
                Masa de prueba colocada — continuar
              </Button>
            </div>
          ) : null}

          {step === 5 ? (
            <div className="space-y-3">
              {!workflow.correction ? (
                <Button className="w-full" disabled={workflow.calculating} onClick={() => void requestCalculation()}>
                  {workflow.calculating ? "Calculando…" : "CALCULAR CORRECCIÓN"}
                </Button>
              ) : null}
              <CorrectionPanel plane="A" />
              {rotor.planes === 2 ? <CorrectionPanel plane="B" /> : null}
            </div>
          ) : null}

          {step === 6 ? (
            <div className="space-y-3">
              {liveValues}
              {blockedNote}
              <Button
                className="w-full"
                disabled={!measurementGuard.allowed || !workflow.correctionApplied}
                onClick={() => captureMeasurement("verification")}
              >
                INICIAR VERIFICACIÓN
              </Button>
              {workflow.verification ? (
                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="panel-surface p-3">
                    <p className="label-tech">Antes</p>
                    <p className="num text-3xl font-bold text-destructive">{initialAmp.toFixed(2)}</p>
                    <p className="text-[11px] text-muted-foreground">{settings.units.vibration}</p>
                  </div>
                  <div className="panel-surface p-3">
                    <p className="label-tech">Después</p>
                    <p className="num text-3xl font-bold text-success">{finalAmp.toFixed(2)}</p>
                    <p className="text-[11px] text-muted-foreground">{settings.units.vibration}</p>
                  </div>
                  <div className="panel-surface p-3">
                    <p className="label-tech">Reducción</p>
                    <p className="num text-3xl font-bold text-foreground">{reduction.toFixed(1)} %</p>
                    <p className={`text-[11px] font-bold ${balanced ? "text-success" : "text-warning"}`}>
                      {balanced ? "BALANCEADO" : "NECESITA CORRECCIÓN"}
                    </p>
                  </div>
                </div>
              ) : null}
              <Button variant="outline" className="w-full" onClick={() => { resetWorkflow(); setStep(1); }}>
                <RefreshCw className="mr-1.5 h-4 w-4" /> Nuevo trabajo
              </Button>
            </div>
          ) : null}
        </Panel>
      </div>

      <div className="min-w-0 space-y-3">
        <Panel title="Procedimiento">
          <ProcessSteps steps={steps} />
        </Panel>
        <Panel title="Calidad de medición">
          <SignalQualityBar
            quality={telemetry.signalQuality}
            issues={telemetry.qualityIssues}
            minimum={settings.limits.minSignalQuality}
          />
        </Panel>
      </div>
    </div>
  );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="min-w-0">
      <span className="label-tech">{label}</span>
      <Input className="mt-1" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="min-w-0">
      <span className="label-tech">{label}</span>
      <Input
        className="num mt-1"
        inputMode="decimal"
        value={String(value)}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (Number.isFinite(v) && v >= 0) onChange(v);
        }}
      />
    </div>
  );
}
