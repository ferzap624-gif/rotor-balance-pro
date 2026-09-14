import { createFileRoute } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { Panel } from "@/components/industrial/Panel";
import { PageHeader } from "@/components/shell/PageHeader";
import { CorrectionPanel } from "@/components/industrial/CorrectionPanel";
import { ProcessSteps } from "@/components/industrial/ProcessSteps";
import { RealtimeValue } from "@/components/industrial/RealtimeValue";
import { useSystem } from "@/store/system-store";
import { dateTime } from "@/lib/balance/format";

export const Route = createFileRoute("/correccion")({
  head: () => ({
    meta: [
      { title: "Corrección — Balanceador Dinámico" },
      {
        name: "description",
        content:
          "Masa, ángulo y plano de corrección calculados por el motor matemático, con instrucción física para el operador.",
      },
      { property: "og:title", content: "Corrección — Balanceador Dinámico" },
      { property: "og:description", content: "Masa y ángulo de corrección con instrucción de montaje." },
    ],
  }),
  component: CorrectionPage,
});

function CorrectionPage() {
  const { workflow, rotor, requestCalculation, measurementGuard, captureMeasurement, settings } = useSystem();

  const steps = [
    { index: 1, title: "Medición inicial", done: !!workflow.initial },
    { index: 2, title: "Segunda medición", done: !!workflow.trialA },
    { index: 3, title: "Corrección calculada", done: !!workflow.correction },
    { index: 4, title: "Masa colocada", done: workflow.correctionApplied },
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
        title="Corrección"
        subtitle={workflow.correction ? `Calculada ${dateTime(workflow.correction.computedAt)}` : "Sin corrección calculada"}
        actions={
          <Button
            size="sm"
            disabled={!workflow.trialA || workflow.calculating}
            onClick={() => void requestCalculation()}
          >
            {workflow.calculating ? "Calculando…" : "Calcular corrección"}
          </Button>
        }
      />

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-3">
          <Panel title="Plano A">
            <CorrectionPanel plane="A" />
          </Panel>
          {rotor.planes === 2 ? (
            <Panel title="Plano B">
              <CorrectionPanel plane="B" />
            </Panel>
          ) : null}
        </div>

        <div className="min-w-0 space-y-3">
          <Panel title="Estado del procedimiento">
            <ProcessSteps steps={steps} />
          </Panel>

          <Panel title="Datos usados por el motor de cálculo" bodyClassName="grid gap-2">
            <RealtimeValue
              label="V0 inicial"
              value={workflow.initial ? `${workflow.initial.planeA.amplitude.toFixed(2)} ∠ ${workflow.initial.planeA.angle}°` : "—"}
              size="sm"
              stale={!workflow.initial}
            />
            <RealtimeValue
              label="V1 con masa de prueba"
              value={workflow.trialA ? `${workflow.trialA.planeA.amplitude.toFixed(2)} ∠ ${workflow.trialA.planeA.angle}°` : "—"}
              size="sm"
              stale={!workflow.trialA}
            />
            <RealtimeValue
              label="Masa de prueba A"
              value={`${workflow.testWeightA.mass} g @ ${workflow.testWeightA.angle}°`}
              size="sm"
            />
            {rotor.planes === 2 ? (
              <RealtimeValue
                label="Masa de prueba B"
                value={`${workflow.testWeightB.mass} g @ ${workflow.testWeightB.angle}°`}
                size="sm"
              />
            ) : null}
          </Panel>

          <Panel title="Verificación">
            <p className="mb-2 text-xs text-muted-foreground">
              Disponible únicamente con corrección calculada y masa confirmada.
            </p>
            <Button
              className="w-full"
              disabled={!workflow.correctionApplied || !measurementGuard.allowed}
              onClick={() => captureMeasurement("verification")}
            >
              Verificar balanceo
            </Button>
            {!measurementGuard.allowed ? (
              <p className="mt-2 text-[11px] text-warning">Bloqueado: {measurementGuard.reasons[0]}</p>
            ) : null}
            <p className="num mt-2 text-[11px] text-muted-foreground">
              Tolerancia objetivo: {settings.tolerances.residualTarget} {settings.units.vibration} residual ·
              reducción mínima {settings.tolerances.minReduction} %
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}
