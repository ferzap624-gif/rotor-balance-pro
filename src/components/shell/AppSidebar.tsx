import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  CircleDot, 
  ClipboardList,
  Cog,
  FileText,
  FlaskConical,
  Gauge,
  History,
  LayoutDashboard,
  Ruler,
  Stethoscope,
  Target,
  Waves,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useSystem } from "@/store/system-store";

interface NavItem {
  to: string;
  label: string;
  icon: typeof Gauge;
  level?: "PROFESIONAL";
}

const ITEMS: NavItem[] = [
  { to: "/", label: "Inicio", icon: LayoutDashboard },
  { to: "/maquina", label: "Máquina", icon: Cog },
  { to: "/medicion", label: "Medición", icon: Activity },
  { to: "/balanceo-1-plano", label: "Balanceo 1 Plano", icon: CircleDot },
  { to: "/balanceo-2-planos", label: "Balanceo 2 Planos", icon: Target },
  { to: "/analisis", label: "Análisis de vibración", icon: Waves, level: "PROFESIONAL" },
  { to: "/correccion", label: "Corrección", icon: Ruler },
  { to: "/resultados", label: "Resultados", icon: BarChart3 },
  { to: "/historial", label: "Historial", icon: History },
  { to: "/reportes", label: "Reportes", icon: FileText },
  { to: "/calibracion", label: "Calibración", icon: ClipboardList, level: "PROFESIONAL" },
  { to: "/configuracion", label: "Configuración", icon: Cog },
  { to: "/diagnostico", label: "Diagnóstico", icon: Stethoscope, level: "PROFESIONAL" },
  { to: "/simulacion", label: "Modo simulación", icon: FlaskConical },
];

export function AppSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { settings, telemetry } = useSystem();
  const items = ITEMS.filter((i) => !i.level || settings.level === "PROFESIONAL");

  return (
    <nav aria-label="Navegación principal" className="flex h-full w-full flex-col bg-sidebar">
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2.5 border-b border-sidebar-border px-3 py-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-sm border border-primary/40 bg-primary/10">
          <Gauge className="h-5 w-5 text-primary" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold tracking-wide text-sidebar-foreground">BALANCEADOR</p>
          <p className="truncate text-[10px] tracking-[0.18em] text-muted-foreground">DINÁMICO 1 · 2 PLANOS</p>
        </div>
      </div>

      <ul className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {items.map((item) => {
          const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                onClick={onNavigate}
                className={cn(
                  "grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2.5 rounded-sm px-2.5 py-2 text-sm transition-colors",
                  active
                    ? "bg-sidebar-primary/15 font-semibold text-sidebar-primary ring-1 ring-sidebar-primary/40"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="border-t border-sidebar-border px-3 py-2">
        <p className="label-tech">Nivel de operación</p>
        <p className="truncate text-xs font-semibold text-sidebar-foreground">{settings.level}</p>
        {telemetry.simulated ? (
          <p className="mt-1.5 rounded-sm border border-warning/50 bg-warning/10 px-1.5 py-1 text-[10px] font-bold tracking-wide text-warning">
            DATOS SIMULADOS
          </p>
        ) : null}
      </div>
    </nav>
  );
}
