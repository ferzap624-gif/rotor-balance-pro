import { createFileRoute } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/industrial/Panel";
import { PageHeader } from "@/components/shell/PageHeader";
import { RealtimeValue } from "@/components/industrial/RealtimeValue";
import { VectorBalanceChart, type VectorEntry } from "@/components/industrial/VectorBalanceChart";
import { TestWeightForm } from "@/components/industrial/TestWeightForm";
import { CorrectionPanel } from "@/components/industrial/CorrectionPanel";
import { ProcessSteps } from "@/components/industrial/ProcessSteps";
import { useSystem } from "@/store/system-store";

export const Route = createFileRoute("/balanceo-2-planos")({
  head: () => ({
    meta: [
      { title: "Balanceo 2 planos — Balanceador Dinámico" },
      {
        name: "description",
        content:
          "Balanceo en dos planos con coeficientes de influencia: masas de prueba en planos A y B, vectores y correcciones independientes.",
      },
      { property: "og:title", content: "Balanceo 2 planos — Balanceador Dinámico" },
      { property: "og:description", content: "Coeficientes de influencia y correcciones para los planos A y B." },
    ],
  }),
  component: TwoPlanePage,
});

function TwoPlanePage() {
  const {
    rotor,
    updateRotor,
    settings,
    workflow,
    measurementGuard,
    captureMeasurement,
    requestCalculation,
    resetWorkflow,
  } = useSystem();

  const planeVectors = (plane: "A" | "B"): VectorEntry[] => {
    const pick = (s: typeof workflow.initial) =>
      plane === "A" ? s?.planeA : (s?.planeB ?? s?.planeA);
    const out: VectorEntry[] = [];
    const v0 = pick(workflow.initial);
    if (v0) out.push({ key: `v0${plane}`, label: `V0 ${plane}`, vector: v0, kind: "initial", unit: settings.units.vibration });
    const v1 = pick(workflow.trialA);
    if (v1) out.push({ key: `v1${plane}`, label: `Wt en A → ${plane}`, vector: v1, kind: "trial", unit: settings.units.vibration });
    const v2 = pick(workflow.trialB);
    if (v2) out.push({ key: `v2${plane}`, label: `Wt en B → ${plane}`, vector: v2, kind: "trial", unit: settings.units.vibration });
    const corr = plane === "A" ? workflow.correction?.planeA : workflow.correction?.planeB;
    if (corr)
      out.push({
        key: `wc${plane}`,
        label: `Corrección ${plane}`,
        vector: { amplitude: corr.mass, angle: corr.angle },
        kind: "correction",
        unit: settings.units.mass,
      });
    return out;
  };

  const steps = [
    { index: 1, title: "V0 en A y B", done: !!workflow.initial },
    { index: 2, title: "Masa de prueba en plano A", done: !!workflow.trialA },
    { index: 3, title: "Masa de prueba en plano B", done: !!workflow.trialB },
    { index: 4, title: "Corrección A y B", done: !!workflow.correction },
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
        title="Balanceo — 2 planos"
        subtitle={`${rotor.name} · distancia entre planos ${rotor.planeDistance} mm`}
        actions={
          <>
            <Button
              size="sm"
              variant={rotor.planes === 2 ? "default" : "outline"}
              onClick={() => updateRotor({ planes: 2 })}
            >
              Activar 2 planos
            </Button>
            <Button variant="outline" size="sm" onClick={resetWorkflow}>
              Reiniciar trabajo
            </Button>
          </>
        }
      />

      {rotor.planes !== 2 ? (
        <p className="mb-3 rounded-sm border border-warning/50 bg-warning/10 px-3 py-2 text-xs text-warning">
          El rotor está configurado para 1 plano. Active 2 planos para habilitar la secuencia completa.
        </p>
      ) : null}

      {/* Diagrama lateral del rotor */}
      <Panel title="Disposición del rotor" className="mb-3">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
          <svg viewBox="0 0 420 150" className="w-full max-w-[520px]" role="img" aria-label="Diagrama lateral del rotor con planos A y B">
            <line x1="20" y1="75" x2="400" y2="75" className="stroke-border" strokeWidth="6" />
            <rect x="120" y="40" width="180" height="70" rx="4" className="fill-secondary stroke-border" strokeWidth="1.5" />
            <text x="210" y="80" textAnchor="middle" className="fill-muted-foreground text-[11px] tracking-[0.2em]">
              ROTOR
            </text>
            {[
              { x: 140, label: "PLANO A", radius: rotor.correctionRadiusA },
              { x: 280, label: "PLANO B", radius: rotor.correctionRadiusB },
            ].map((p) => (
              <g key={p.label}>
                <line x1={p.x} y1="18" x2={p.x} y2="38" className="stroke-primary" strokeWidth="2" markerEnd="url(#plane-arrow)" />
                <text x={p.x} y="14" textAnchor="middle" className="fill-primary text-[10px] font-bold">
                  {p.label}
                </text>
                <text x={p.x} y="128" textAnchor="middle" className="num fill-muted-foreground text-[9px]">
                  r = {p.radius} mm
                </text>
              </g>
            ))}
            <line x1="140" y1="118" x2="280" y2="118" className="stroke-muted-foreground" strokeWidth="1" strokeDasharray="3 3" />
            <text x="210" y="114" textAnchor="middle" className="num fill-muted-foreground text-[9px]">
              {rotor.planeDistance} mm
            </text>
            <defs>
              <marker id="plane-arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 z" className="fill-primary" />
              </marker>
            </defs>
          </svg>
          <div className="grid min-w-0 grid-cols-2 gap-2 self-center lg:w-[280px]">
            <NumField label="Distancia planos (mm)" value={rotor.planeDistance} onChange={(v) => updateRotor({ planeDistance: v })} />
            <NumField label="Radio plano A (mm)" value={rotor.correctionRadiusA} onChange={(v) => updateRotor({ correctionRadiusA: v })} />
            <NumField label="Radio plano B (mm)" value={rotor.correctionRadiusB} onChange={(v) => updateRotor({ correctionRadiusB: v })} />
            <NumField label="RPM objetivo" value={rotor.targetRpm} onChange={(v) => updateRotor({ targetRpm: v })} />
          </div>
        </div>
      </Panel>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_290px]">
        {(["A", "B"] as const).map((plane) => (
          <div key={plane} className="min-w-0 space-y-3">
            <Panel title={`Plano ${plane}`} subtitle="vibración y masa de prueba">
              <div className="grid grid-cols-2 gap-2">
                <RealtimeValue
                  label={`V0 plano ${plane}`}
                  value={
                    workflow.initial
                      ? `${(plane === "A" ? workflow.initial.planeA : (workflow.initial.planeB ?? workflow.initial.planeA)).amplitude.toFixed(2)}`
                      : "—"
                  }
                  unit={settings.units.vibration}
                  size="sm"
                  stale={!workflow.initial}
                />
                <RealtimeValue
                  label={`Fase plano ${plane}`}
                  value={
                    workflow.initial
                      ? `${(plane === "A" ? workflow.initial.planeA : (workflow.initial.planeB ?? workflow.initial.planeA)).angle}°`
                      : "—"
                  }
                  size="sm"
                  stale={!workflow.initial}
                />
              </div>
              <div className="mt-3">
                <TestWeightForm plane={plane} />
              </div>
            </Panel>

            <Panel title={`Vectores plano ${plane}`}>
              {planeVectors(plane).length > 0 ? (
                <VectorBalanceChart vectors={planeVectors(plane)} size={250} />
              ) : (
                <p className="text-xs text-muted-foreground">Capture la medición inicial para ver los vectores.</p>
              )}
            </Panel>

            <Panel title={`Corrección plano ${plane}`}>
              <CorrectionPanel plane={plane} />
            </Panel>
          </div>
        ))}

        <div className="min-w-0 space-y-3">
          <Panel title="Secuencia de 2 planos">
            <ProcessSteps steps={steps} />
          </Panel>
          <Panel title="Acciones" bodyClassName="grid gap-2">
            <Button disabled={!measurementGuard.allowed} onClick={() => captureMeasurement("initial")}>
              Capturar V0 (A y B)
            </Button>
            <Button
              variant="secondary"
              disabled={!measurementGuard.allowed || !workflow.initial}
              onClick={() => captureMeasurement("trialA")}
            >
              Capturar con Wt en A
            </Button>
            <Button
              variant="secondary"
              disabled={!measurementGuard.allowed || !workflow.trialA}
              onClick={() => captureMeasurement("trialB")}
            >
              Capturar con Wt en B
            </Button>
            <Button
              variant="outline"
              disabled={!workflow.trialB || workflow.calculating}
              onClick={() => void requestCalculation()}
            >
              {workflow.calculating ? "Calculando…" : "Calcular correcciones"}
            </Button>
            <Button
              variant="outline"
              disabled={!workflow.correctionApplied || !measurementGuard.allowed}
              onClick={() => captureMeasurement("verification")}
            >
              Verificar balanceo
            </Button>
          </Panel>
        </div>
      </div>
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
