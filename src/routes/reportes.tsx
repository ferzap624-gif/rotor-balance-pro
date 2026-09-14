import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Download, Printer } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Panel } from "@/components/industrial/Panel";
import { PageHeader } from "@/components/shell/PageHeader";
import { RotorDiagram } from "@/components/industrial/RotorDiagram";
import { FftChart, HarmonicsTable } from "@/components/industrial/FftChart";
import { useSystem } from "@/store/system-store";
import { dateTime } from "@/lib/balance/format";

export const Route = createFileRoute("/reportes")({
  head: () => ({
    meta: [
      { title: "Reporte de balanceo — Balanceador Dinámico" },
      {
        name: "description",
        content:
          "Reporte técnico de balanceo con datos de máquina, rotor, mediciones, corrección aplicada, espectro y resultado final.",
      },
      { property: "og:title", content: "Reporte de balanceo — Balanceador Dinámico" },
      { property: "og:description", content: "Reporte técnico exportable con resultados y observaciones." },
    ],
  }),
  component: ReportPage,
});

function ReportPage() {
  const { settings, rotor, telemetry, workflow } = useSystem();
  const [notes, setNotes] = useState("");
  const unit = settings.units.vibration;
  const before = workflow.initial;
  const after = workflow.verification;
  const reduction =
    before && after && before.planeA.amplitude > 0
      ? ((before.planeA.amplitude - after.planeA.amplitude) / before.planeA.amplitude) * 100
      : null;

  const exportData = () => {
    const payload = {
      machine: settings.machineTag,
      operator: settings.operator,
      generatedAt: new Date().toISOString(),
      rotor,
      units: settings.units,
      limits: settings.limits,
      measurements: {
        initial: before,
        trialA: workflow.trialA,
        trialB: workflow.trialB,
        verification: after,
      },
      testWeights: { A: workflow.testWeightA, B: workflow.testWeightB },
      correction: workflow.correction,
      harmonics: telemetry.harmonics,
      dataSource: telemetry.simulated ? "SIMULADO" : "HARDWARE",
      notes,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte-balanceo-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Datos exportados");
  };

  return (
    <div>
      <PageHeader
        title="Reporte de balanceo"
        subtitle={`${settings.machineTag} · ${dateTime(Date.now())}`}
        actions={
          <>
            <Button size="sm" onClick={() => window.print()}>
              <Printer className="mr-1.5 h-4 w-4" /> Generar PDF
            </Button>
            <Button size="sm" variant="outline" onClick={exportData}>
              <Download className="mr-1.5 h-4 w-4" /> Exportar datos
            </Button>
          </>
        }
      />

      {telemetry.simulated ? (
        <p className="mb-3 rounded-sm border border-warning/50 bg-warning/10 px-3 py-2 text-xs font-bold text-warning">
          ADVERTENCIA: el reporte contiene datos generados por el simulador de hardware.
        </p>
      ) : null}

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-3">
          <Panel title="Datos generales">
            <Row label="Máquina" value={settings.machineTag} />
            <Row label="Operador" value={settings.operator} />
            <Row label="Nivel de operación" value={settings.level} />
            <Row label="Fecha del reporte" value={dateTime(Date.now())} />
            <Row label="Origen de datos" value={telemetry.simulated ? "SIMULADO" : "HARDWARE REAL"} />
          </Panel>

          <Panel title="Datos del rotor">
            <Row label="Nombre" value={rotor.name} />
            <Row label="Tipo" value={rotor.type} />
            <Row label="Diámetro" value={`${rotor.diameter} mm`} />
            <Row label="Masa" value={`${rotor.mass} kg`} />
            <Row label="Planos" value={`${rotor.planes}`} />
            <Row label="Radio corrección A" value={`${rotor.correctionRadiusA} mm`} />
            {rotor.planes === 2 ? <Row label="Radio corrección B" value={`${rotor.correctionRadiusB} mm`} /> : null}
            <Row label="RPM de trabajo" value={`${rotor.targetRpm} rpm`} />
          </Panel>

          <Panel title="Mediciones">
            <Row label="Vibración inicial" value={before ? `${before.planeA.amplitude.toFixed(2)} ${unit}` : "—"} />
            <Row label="Fase inicial" value={before ? `${before.planeA.angle}°` : "—"} />
            <Row label="Vibración final" value={after ? `${after.planeA.amplitude.toFixed(2)} ${unit}` : "—"} />
            <Row label="Fase final" value={after ? `${after.planeA.angle}°` : "—"} />
            <Row label="Reducción" value={reduction !== null ? `${reduction.toFixed(1)} %` : "—"} />
            <Row
              label="Resultado final"
              value={
                after && reduction !== null
                  ? after.planeA.amplitude <= settings.limits.warningLimit && reduction >= settings.tolerances.minReduction
                    ? "BALANCEADO"
                    : "NECESITA CORRECCIÓN"
                  : "PENDIENTE"
              }
            />
          </Panel>

          <Panel title="Corrección aplicada">
            {workflow.correction ? (
              <>
                <Row
                  label="Plano A"
                  value={`${workflow.correction.planeA.mass} g @ ${workflow.correction.planeA.angle}° · r=${workflow.correction.planeA.radius} mm`}
                />
                {workflow.correction.planeB ? (
                  <Row
                    label="Plano B"
                    value={`${workflow.correction.planeB.mass} g @ ${workflow.correction.planeB.angle}° · r=${workflow.correction.planeB.radius} mm`}
                  />
                ) : null}
                <Row label="Motor de cálculo" value={workflow.correction.engine} />
                <Row label="Método" value={workflow.correction.method} />
              </>
            ) : (
              <p className="text-xs text-muted-foreground">Sin corrección calculada.</p>
            )}
          </Panel>
        </div>

        <div className="min-w-0 space-y-3">
          <Panel title="Espectro registrado">
            <FftChart spectrum={telemetry.spectrum} harmonics={telemetry.harmonics} unit={unit} height={200} />
            <div className="mt-2">
              <HarmonicsTable harmonics={telemetry.harmonics} unit={unit} />
            </div>
          </Panel>

          <Panel title="Diagrama del rotor">
            <div className="grid gap-3 md:grid-cols-2">
              <RotorDiagram
                size={210}
                planeLabel="PLANO A"
                markers={
                  workflow.correction
                    ? [{ angle: workflow.correction.planeA.angle, label: `${workflow.correction.planeA.mass}g`, kind: "correction" }]
                    : []
                }
              />
              {rotor.planes === 2 ? (
                <RotorDiagram
                  size={210}
                  planeLabel="PLANO B"
                  markers={
                    workflow.correction?.planeB
                      ? [{ angle: workflow.correction.planeB.angle, label: `${workflow.correction.planeB.mass}g`, kind: "correction" }]
                      : []
                  }
                />
              ) : null}
            </div>
          </Panel>

          <Panel title="Observaciones">
            <Textarea
              rows={5}
              maxLength={1000}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observaciones del operador o del ingeniero responsable (máx. 1000 caracteres)"
            />
            <p className="mt-1 text-right text-[11px] text-muted-foreground">{notes.length}/1000</p>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b border-border/60 py-1.5 last:border-0">
      <span className="min-w-0 truncate text-xs text-muted-foreground">{label}</span>
      <span className="num shrink-0 text-xs font-semibold text-foreground">{value}</span>
    </div>
  );
}
