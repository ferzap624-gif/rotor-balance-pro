import { Input } from "@/components/ui/input";
import { RotorDiagram } from "@/components/industrial/RotorDiagram";
import { useSystem } from "@/store/system-store";

export function TestWeightForm({ plane }: { plane: "A" | "B" }) {
  const { workflow, setTestWeight } = useSystem();
  const weight = plane === "A" ? workflow.testWeightA : workflow.testWeightB;

  const field = (
    id: string,
    label: string,
    value: number,
    unit: string,
    key: "mass" | "radius" | "angle",
    max: number,
  ) => (
    <div className="min-w-0">
      <label className="label-tech" htmlFor={id}>
        {label} ({unit})
      </label>
      <Input
        id={id}
        className="num mt-1"
        inputMode="decimal"
        value={String(value)}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (!Number.isFinite(v) || v < 0 || v > max) return;
          setTestWeight(plane, { [key]: v });
        }}
      />
    </div>
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
      <div className="min-w-0 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {field(`tw-mass-${plane}`, "Masa de prueba", weight.mass, "g", "mass", 5000)}
          {field(`tw-radius-${plane}`, "Radio de colocación", weight.radius, "mm", "radius", 5000)}
        </div>
        {field(`tw-angle-${plane}`, "Ángulo de colocación", weight.angle, "°", "angle", 360)}
        <p className="text-xs text-muted-foreground">
          Seleccione el ángulo directamente sobre el diagrama (mouse o pantalla táctil). El ángulo se mide desde la
          referencia 0° en el sentido de giro.
        </p>
      </div>
      <RotorDiagram
        size={250}
        selectable
        planeLabel={`PLANO ${plane}`}
        onAngleChange={(angle) => setTestWeight(plane, { angle })}
        markers={[{ angle: weight.angle, label: `${weight.mass}g`, kind: "test" }]}
      />
    </div>
  );
}
