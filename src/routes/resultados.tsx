import { createFileRoute, Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { Panel } from "@/components/industrial/Panel";
import { PageHeader } from "@/components/shell/PageHeader";
import { VectorBalanceChart, type VectorEntry } from "@/components/industrial/VectorBalanceChart";
import { useSystem } from "@/store/system-store";
import { dateTime } from "@/lib/balance/format";

export const Route = createFileRoute("/resultados")({
  head: () => ({
    meta: [
      { title: "Resultados de balanceo — Balanceador Dinámico" },
      {
        name: "description",
        content:
          "Comparación antes y después de la corrección: vibración, fase, porcentaje de reducción y estado final del rotor.",
      },
      { property: "og:title", content: "Resultados de balanceo — Balanceador Dinámico" },
      { property: "og:description", content: "Vibración antes y después, reducción y estado final." },
    ],
  }),
  component: ResultsPage,
});

function ResultsPage() {
  const { workflow, settings, rotor } = useSystem();
  const before = workflow.initial;
  const after = workflow.verification;
  const unit = settings.units.vibration;

  const reduction =
    before && after && before.planeA.amplitude > 0
      ? ((before.planeA.amplitude - after.planeA.amplitude) / before.planeA.amplitude) * 100
      : null;
  const balanced =
    after !== null &&
    reduction !== null &&
    after.planeA.amplitude <= settings.limits.warningLimit &&
    reduction >= settings.tolerances.minReduction;

  const vectors: VectorEntry[] = [];
  if (before) vectors.push({ key: "b", label: "Antes de la corrección", vector: before.planeA, kind: "initial", unit });
  if (after) vectors.push({ key: "a", label: "Después de la corrección", vector: after.planeA, kind: "residual", unit });

  return (
    <div>
      <PageHeader
        title="Resultados de balanceo"
        subtitle={`${rotor.name} · ${rotor.planes} plano${rotor.planes === 2 ? "s" : ""}`}
        actions={
          <Button asChild size="sm" variant="outline">
            <Link to="/reportes">Generar reporte</Link>
          </Button>
        }
      />

      {!before ? (
        <Panel title="Sin datos">
          <p className="text-sm text-muted-foreground">
            No hay mediciones en el trabajo actual. Ejecute una medición inicial para ver resultados.
          </p>
        </Panel>
      ) : (
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_320px]">
          <Panel title="Antes de la corrección" className="border-destructive/40">
            <Row label="RPM" value={`${before.rpm} rpm`} />
            <Row label={`Vibración 1×`} value={`${before.planeA.amplitude.toFixed(2)} ${unit}`} tone="fault" />
            <Row label="Fase 1×" value={`${before.planeA.angle}°`} />
            {before.planeB ? (
              <Row label="Plano B 1×" value={`${before.planeB.amplitude.toFixed(2)} ${unit} ∠ ${before.planeB.angle}°`} />
            ) : null}
            <Row label="Calidad" value={`${before.signalQuality} %`} />
            <Row label="Marca de tiempo" value={dateTime(before.timestamp)} />
            <p className="mt-3 rounded-sm border border-destructive/50 bg-destructive/10 px-2 py-1.5 text-center text-xs font-bold text-destructive">
              DESBALANCE DETECTADO
            </p>
          </Panel>

          <Panel title="Después de la corrección" className="border-success/40">
            {after ? (
              <>
                <Row label="RPM" value={`${after.rpm} rpm`} />
                <Row label="Vibración 1×" value={`${after.planeA.amplitude.toFixed(2)} ${unit}`} tone="ok" />
                <Row label="Fase 1×" value={`${after.planeA.angle}°`} />
                {after.planeB ? (
                  <Row label="Plano B 1×" value={`${after.planeB.amplitude.toFixed(2)} ${unit} ∠ ${after.planeB.angle}°`} />
                ) : null}
                <Row label="Calidad" value={`${after.signalQuality} %`} />
                <Row label="Marca de tiempo" value={dateTime(after.timestamp)} />
                <p
                  className={`mt-3 rounded-sm px-2 py-1.5 text-center text-xs font-bold ${
                    balanced
                      ? "border border-success/50 bg-success/10 text-success"
                      : "border border-warning/50 bg-warning/10 text-warning"
                  }`}
                >
                  {balanced ? "BALANCEADO" : "NECESITA CORRECCIÓN"}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Verificación no ejecutada todavía.</p>
            )}
          </Panel>

          <div className="min-w-0 space-y-3">
            <Panel title="Reducción de vibración">
              <p className="num text-5xl font-bold text-foreground">
                {reduction !== null ? `${reduction.toFixed(1)} %` : "—"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Objetivo mínimo configurado: {settings.tolerances.minReduction} %
              </p>
              {workflow.correction ? (
                <div className="mt-3 space-y-1.5 text-xs">
                  <p className="label-tech">Corrección aplicada</p>
                  <p className="num text-foreground">
                    A: {workflow.correction.planeA.mass} g @ {workflow.correction.planeA.angle}°
                  </p>
                  {workflow.correction.planeB ? (
                    <p className="num text-foreground">
                      B: {workflow.correction.planeB.mass} g @ {workflow.correction.planeB.angle}°
                    </p>
                  ) : null}
                </div>
              ) : null}
            </Panel>
            <Panel title="Comparación vectorial">
              {vectors.length > 0 ? (
                <VectorBalanceChart vectors={vectors} size={250} />
              ) : (
                <p className="text-xs text-muted-foreground">Sin vectores disponibles.</p>
              )}
            </Panel>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: "ok" | "fault" }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b border-border/60 py-1.5 last:border-0">
      <span className="min-w-0 truncate text-xs text-muted-foreground">{label}</span>
      <span
        className={`num shrink-0 text-sm font-semibold ${
          tone === "fault" ? "text-destructive" : tone === "ok" ? "text-success" : "text-foreground"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
