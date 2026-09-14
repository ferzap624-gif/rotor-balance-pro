import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowUpDown, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Panel } from "@/components/industrial/Panel";
import { PageHeader } from "@/components/shell/PageHeader";
import { useSystem } from "@/store/system-store";
import { dateTime } from "@/lib/balance/format";
import type { HistoryJob } from "@/lib/balance/types";

export const Route = createFileRoute("/historial")({
  head: () => ({
    meta: [
      { title: "Historial de trabajos — Balanceador Dinámico" },
      {
        name: "description",
        content:
          "Registro de trabajos de balanceo con rotor, operador, RPM, vibración inicial y final, corrección y resultado.",
      },
      { property: "og:title", content: "Historial de trabajos — Balanceador Dinámico" },
      { property: "og:description", content: "Búsqueda, filtro y consulta de trabajos de balanceo." },
    ],
  }),
  component: HistoryPage,
});

const RESULT_TONE: Record<HistoryJob["result"], string> = {
  BALANCEADO: "text-success",
  "NECESITA CORRECCION": "text-warning",
  ABORTADO: "text-destructive",
};

function HistoryPage() {
  const { history, settings, updateRotor } = useSystem();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"TODOS" | HistoryJob["result"]>("TODOS");
  const [desc, setDesc] = useState(true);
  const [selected, setSelected] = useState<HistoryJob | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return history
      .filter((j) => (filter === "TODOS" ? true : j.result === filter))
      .filter((j) => !q || j.rotor.toLowerCase().includes(q) || j.operator.toLowerCase().includes(q) || j.id.toLowerCase().includes(q))
      .sort((a, b) => (desc ? b.date - a.date : a.date - b.date));
  }, [history, query, filter, desc]);

  return (
    <div>
      <PageHeader title="Historial de trabajos" subtitle={`${rows.length} registros · ${settings.machineTag}`} />

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Panel
          title="Trabajos"
          actions={
            <Button variant="outline" size="sm" onClick={() => setDesc((d) => !d)}>
              <ArrowUpDown className="mr-1.5 h-4 w-4" /> {desc ? "Recientes" : "Antiguos"}
            </Button>
          }
        >
          <div className="mb-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_180px]">
            <div className="relative min-w-0">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Buscar por rotor, operador o folio"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos los resultados</SelectItem>
                <SelectItem value="BALANCEADO">Balanceado</SelectItem>
                <SelectItem value="NECESITA CORRECCION">Necesita corrección</SelectItem>
                <SelectItem value="ABORTADO">Abortado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="label-tech py-1 text-left">Fecha</th>
                  <th className="label-tech py-1 text-left">Rotor</th>
                  <th className="label-tech py-1 text-left">Operador</th>
                  <th className="label-tech py-1 text-left">Tipo</th>
                  <th className="label-tech py-1 text-right">RPM</th>
                  <th className="label-tech py-1 text-right">Vib. inicial</th>
                  <th className="label-tech py-1 text-right">Vib. final</th>
                  <th className="label-tech py-1 text-right">Reducción</th>
                  <th className="label-tech py-1 text-left">Resultado</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((j) => (
                  <tr
                    key={j.id}
                    onClick={() => setSelected(j)}
                    className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-accent/40"
                  >
                    <td className="num py-2 text-muted-foreground">{dateTime(j.date)}</td>
                    <td className="py-2 font-semibold text-foreground">
                      {j.rotor}
                      {j.simulated ? <span className="ml-1.5 text-[10px] font-bold text-warning">SIM</span> : null}
                    </td>
                    <td className="py-2 text-muted-foreground">{j.operator}</td>
                    <td className="py-2 text-muted-foreground">{j.type}</td>
                    <td className="num py-2 text-right">{j.rpm}</td>
                    <td className="num py-2 text-right text-destructive">{j.initialVibration.toFixed(2)}</td>
                    <td className="num py-2 text-right text-success">{j.finalVibration.toFixed(2)}</td>
                    <td className="num py-2 text-right">{j.reduction.toFixed(1)} %</td>
                    <td className={`py-2 font-bold ${RESULT_TONE[j.result]}`}>{j.result}</td>
                  </tr>
                ))}
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-6 text-center text-muted-foreground">
                      Sin resultados para el filtro aplicado.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Trabajo seleccionado">
          {selected ? (
            <div className="space-y-2 text-xs">
              <Field label="Folio" value={selected.id} />
              <Field label="Fecha" value={dateTime(selected.date)} />
              <Field label="Rotor" value={selected.rotor} />
              <Field label="Operador" value={selected.operator} />
              <Field label="Tipo" value={selected.type} />
              <Field label="RPM" value={`${selected.rpm} rpm`} />
              <Field label="Vibración inicial" value={`${selected.initialVibration.toFixed(2)} ${settings.units.vibration}`} />
              <Field label="Vibración final" value={`${selected.finalVibration.toFixed(2)} ${settings.units.vibration}`} />
              <Field label="Reducción" value={`${selected.reduction.toFixed(1)} %`} />
              <Field label="Corrección" value={selected.correction} />
              <Field label="Resultado" value={selected.result} />
              <Field label="Origen" value={selected.simulated ? "Datos simulados" : "Hardware real"} />
              <div className="grid gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={() => updateRotor({ name: selected.rotor, targetRpm: selected.rpm, planes: selected.type === "2 Planos" ? 2 : 1 })}
                >
                  Repetir medición con este rotor
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link to="/reportes">Generar reporte</Link>
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Seleccione un trabajo de la tabla para ver el detalle.</p>
          )}
        </Panel>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 border-b border-border/60 py-1 last:border-0">
      <span className="min-w-0 truncate text-muted-foreground">{label}</span>
      <span className="num shrink-0 font-semibold text-foreground">{value}</span>
    </div>
  );
}
