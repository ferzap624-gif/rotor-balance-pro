import { createFileRoute } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { Panel } from "@/components/industrial/Panel";
import { PageHeader } from "@/components/shell/PageHeader";
import { RealtimeValue } from "@/components/industrial/RealtimeValue";
import { RotorDiagram } from "@/components/industrial/RotorDiagram";
import { VectorBalanceChart, type VectorEntry } from "@/components/industrial/VectorBalanceChart";
import { TestWeightForm } from "@/components/industrial/TestWeightForm";
import { CorrectionPanel } from "@/components/industrial/CorrectionPanel";
import { ProcessSteps } from "@/components/industrial/ProcessSteps";
import { SignalQualityBar } from "@/components/industrial/StatusIndicators";
import { useSystem } from "@/store/system-store";

export const Route = createFileRoute("/balanceo-1-plano")({
  head: () => ({
    meta: [
      { title: "Balanceo 1 plano — Balanceador Dinámico" },
      {
        name: "description",
        content:
          "Procedimiento de balanceo en un plano: vibración inicial, masa de prueba, vector de corrección y verificación.",
      },
      { property: "og:title", content: "Balanceo 1 plano — Balanceador Dinámico" },
      { property: "og:description", content: "Vectores de vibración, masa de prueba y corrección en un plano." },
    ],
  }),
  component: SinglePlanePage,
});

function SinglePlanePage() {
  const { telemetry, rotor, settings, workflow, measurementGuard, captureMeasurement, requestCalculation, resetWorkflow } =
    useSystem();

  const vectors: VectorEntry[] = [];
  if (workflow.initial)
    vectors.push({ key: "v0", label: "V0 — vibración inicial", vector: workflow.initial.planeA, kind: "initial", unit: settings.units.vibration });
  if (workflow.trialA)
    vectors.push({ key: "v1", label: "V1 — con masa de prueba", vector: workflow.trialA.planeA, kind: "trial", unit: settings.units.vibration });
  if (workflow.correction)
    vectors.push({
      key: "wc",
      label: "Wc — vector de corrección",
      vector: { amplitude: workflow.correction.planeA.mass, angle: workflow.correction.planeA.angle },
      kind: "correction",
      unit: settings.units.mass,
    });
  if (workflow.verification)
    vectors.push({ key: "vr", label: "Vibración residual", vector: workflow.verification.planeA, kind: "residual", unit: settings.units.vibration });

  const steps = [
    { index: 1, title: "V0 medición inicial", done: !!workflow.initial },
    { index: 2, title: "Masa de prueba Wt", done: workflow.testWeightA.mass > 0 && !!workflow.trialA },
    { index: 3, title: "V1 con masa de prueba", done: !!workflow.trialA },
    { index: 4, title: "Corrección calculada", done: !!workflow.correction },
    { index: 5, title: "Verificación", done: !!workflow.verification },
  ].map((s, i, arr) => ({
    index: s.index,
    title: s.title,
    detail: s.done ? "Completado" : arr.slice(0, i).every((p) => p.done) ? "En proceso" : "Pendiente",
    state: (s.done ? "done" : arr.slice(0, i).every((p) => p.done) ? "current" : "pending") as
      | "done"
      | "current"
      | "pending",
  }));

  return (
    <div>
      <PageHeader
        title="Balanceo — 1 plano"
        subtitle={`${rotor.name} · radio de corrección ${rotor.correctionRadiusA} mm · ${rotor.targetRpm} rpm`}
        actions={
          <Button variant="outline" size="sm" onClick={resetWorkflow}>
            Reiniciar trabajo
          </Button>
        }
      />

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_290px]">
        <div className="min-w-0 space-y-3">
          <Panel title="Diagrama del rotor" subtitle="referencia 0° y vector de vibración">
            <RotorDiagram
              size={250}
              direction={telemetry.rotationDirection}
              planeLabel="PLANO ÚNICO"
              markers={[
                { angle: telemetry.phase, label: `1×`, kind: "vibration" },
                { angle: workflow.testWeightA.angle, label: "Wt", kind: "test" },
                ...(workflow.correction ? [{ angle: workflow.correction.planeA.angle, label: "Wc", kind: "correction" as const }] : []),
              ]}
            />
            <div className="mt-2 grid grid-cols-2 gap-2">
              <RealtimeValue label="Amplitud 1×" value={telemetry.harmonics.x1.amplitude.toFixed(2)} unit={settings.units.vibration} size="sm" />
              <RealtimeValue label="Fase 1×" value={`${telemetry.phase}°`} size="sm" />
              <RealtimeValue label="Masa de prueba" value={workflow.testWeightA.mass} unit="g" size="sm" />
              <RealtimeValue label="Radio prueba" value={workflow.testWeightA.radius} unit="mm" size="sm" />
            </div>
          </Panel>

          <Panel title="Masa de prueba">
            <TestWeightForm plane="A" />
          </Panel>
        </div>

        <div className="min-w-0 space-y-3">
          <Panel title="Diagrama vectorial" subtitle="V0 · V1 · Wc">
            {vectors.length > 0 ? (
              <VectorBalanceChart vectors={vectors} size={260} />
            ) : (
              <p className="text-xs text-muted-foreground">
                Capture la medición inicial para representar los vectores.
              </p>
            )}
          </Panel>

          <Panel title="Corrección calculada">
            <CorrectionPanel plane="A" />
          </Panel>
        </div>

        <div className="min-w-0 space-y-3">
          <Panel title="Secuencia">
            <ProcessSteps steps={steps} />
          </Panel>

          <Panel title="Acciones" bodyClassName="grid gap-2">
            <Button disabled={!measurementGuard.allowed} onClick={() => captureMeasurement("initial")}>
              Capturar V0
            </Button>
            <Button
              variant="secondary"
              disabled={!measurementGuard.allowed || !workflow.initial}
              onClick={() => captureMeasurement("trialA")}
            >
              Capturar V1 (con Wt)
            </Button>
            <Button
              variant="outline"
              disabled={!workflow.trialA || workflow.calculating}
              onClick={() => void requestCalculation()}
            >
              {workflow.calculating ? "Calculando…" : "Calcular corrección"}
            </Button>
            <Button
              variant="outline"
              disabled={!workflow.correctionApplied || !measurementGuard.allowed}
              onClick={() => captureMeasurement("verification")}
            >
              Verificar balanceo
            </Button>
            {!measurementGuard.allowed ? (
              <p className="text-[11px] text-warning">Bloqueado: {measurementGuard.reasons[0]}</p>
            ) : null}
          </Panel>

          <Panel title="Calidad de señal">
            <SignalQualityBar
              quality={telemetry.signalQuality}
              issues={telemetry.qualityIssues}
              minimum={settings.limits.minSignalQuality}
            />
          </Panel>
        </div>
      </div>
    </div>
  );
}
