import type { Settings } from "@/store/system-store";

export function vibration(value: number, units: Settings["units"]) {
  if (units.vibration === "in/s") return { value: value / 25.4, unit: "in/s", decimals: 3 };
  return { value, unit: "mm/s", decimals: 2 };
}

export function mass(value: number, units: Settings["units"]) {
  if (units.mass === "oz") return { value: value / 28.3495, unit: "oz", decimals: 3 };
  return { value, unit: "g", decimals: 1 };
}

export function length(value: number, units: Settings["units"]) {
  if (units.length === "in") return { value: value / 25.4, unit: "in", decimals: 2 };
  return { value, unit: "mm", decimals: 0 };
}

export function fmt(value: number, decimals = 2) {
  return value.toFixed(decimals);
}

export function dateTime(ts: number) {
  return new Date(ts).toLocaleString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function shortDate(ts: number) {
  return new Date(ts).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
}
