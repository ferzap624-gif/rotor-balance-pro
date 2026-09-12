import { CheckCircle2, Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import { RotorDiagram } from "@/components/industrial/RotorDiagram";
import { useSystem } from "@/store/system-store";
import { mass as fmtMass } from "@/lib/balance/format";

/** Resultado de corrección en formato de máxima legibilidad para el operador. */
export function CorrectionPanel({ plane = "A" }: { plane?: "A" | "B" }) {
  const { workflow, settings, confirmCorrectionApplied } = useSystem();
  const correction = workflow.correction;
  const target = plane === "A" ? correction?.planeA : correction?.planeB;

  if (!correction || !target) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Aún no existe una corrección calculada para el plano {plane}.
        </p>
        <p className="text-xs text-muted-foreground">
          Requisitos: medición inicial válida, masa de prueba registrada y segunda medición válida.
        </p>
      </div>
    );
  }

  const m = fmtMass(target.mass, settings.units);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
      <div className="min-w-0 space-y-3">
        <div className="rounded-sm border border-success/40 bg-success/10 p-3">
          <p className="label-tech">Masa de corrección</p>
          <p className="num text-5xl font-bold text-success">
            {m.value.toFixed(m.decimals)} <span className="text-xl">{m.unit}</span>
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div>
              <p className="label-tech">Ángulo</p>
              <p className="num text-3xl font-bold text-foreground">{target.angle}°</p>
            </div>
            <div>
              <p className="label-tech">Plano</p>
              <p className="num text-3xl font-bold text-foreground">PLANO {plane}</p>
            </div>
          </div>
          <p className="num mt-2 text-xs text-muted-foreground">Radio de corrección: {target.radius} mm</p>
        </div>

        <div className="flex items-start gap-2 rounded-sm border border-info/40 bg-info/10 p-2.5">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-info" />
          <p className="text-xs text-info">
            Acción: colocar {m.value.toFixed(m.decimals)} {m.unit} en el plano {plane} a {target.angle}° respecto a la
            referencia 0°, sobre un radio de {target.radius} mm.
          </p>
        </div>

        <p className="text-[11px] text-muted-foreground">
          Calculado por {correction.engine} · método {correction.method}
        </p>

        {!workflow.correctionApplied ? (
          <Button className="w-full" onClick={confirmCorrectionApplied}>
            <CheckCircle2 className="mr-1.5 h-4 w-4" /> Confirmar masa colocada
          </Button>
        ) : (
          <p className="rounded-sm border border-success/40 bg-success/10 px-2 py-1.5 text-xs font-semibold text-success">
            Masa de corrección registrada — proceda a la verificación.
          </p>
        )}
      </div>

      <RotorDiagram
        size={240}
        planeLabel={`PLANO ${plane}`}
        markers={[{ angle: target.angle, label: `${m.value.toFixed(m.decimals)}${m.unit}`, kind: "correction" }]}
      />
    </div>
  );
}
