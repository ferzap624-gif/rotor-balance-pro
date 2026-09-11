import type { DriveState, MachineState, SensorHealth, Severity } from "./types";

export const SEVERITY_DOT: Record<Severity, string> = {
  ok: "bg-success",
  info: "bg-info",
  warn: "bg-warning",
  fault: "bg-destructive",
  off: "bg-muted-foreground",
};

export const SEVERITY_TEXT: Record<Severity, string> = {
  ok: "text-success",
  info: "text-info",
  warn: "text-warning",
  fault: "text-destructive",
  off: "text-muted-foreground",
};

export const MACHINE_STATE_META: Record<
  MachineState,
  { label: string; severity: Severity; hint: string }
> = {
  DESCONECTADA: { label: "Desconectada", severity: "off", hint: "Sin enlace con el hardware" },
  CONECTANDO: { label: "Conectando", severity: "info", hint: "Estableciendo enlace" },
  CONECTADA: { label: "Conectada", severity: "info", hint: "Enlace activo, sin habilitación" },
  LISTA: { label: "Lista", severity: "ok", hint: "Habilitada por el hardware" },
  ESPERANDO: { label: "Esperando", severity: "info", hint: "En espera de orden del operador" },
  ACELERANDO: { label: "Acelerando", severity: "info", hint: "Rampa de velocidad en curso" },
  ESTABILIZANDO: { label: "Estabilizando", severity: "warn", hint: "Velocidad no estable aún" },
  MIDIENDO: { label: "Midiendo", severity: "info", hint: "Adquisición en curso" },
  PROCESANDO: { label: "Procesando", severity: "info", hint: "Analizando señal" },
  CORRECCION_CALCULADA: {
    label: "Corrección calculada",
    severity: "ok",
    hint: "Resultado disponible",
  },
  ESPERANDO_CORRECCION: {
    label: "Esperando corrección",
    severity: "warn",
    hint: "Colocar masa de corrección",
  },
  VERIFICANDO: { label: "Verificando", severity: "info", hint: "Medición de verificación" },
  BALANCEADO: { label: "Balanceado", severity: "ok", hint: "Dentro de tolerancia" },
  ADVERTENCIA: { label: "Advertencia", severity: "warn", hint: "Revisar condición" },
  FALLA: { label: "Falla", severity: "fault", hint: "Condición de falla activa" },
};

export const DRIVE_META: Record<DriveState, { label: string; severity: Severity }> = {
  PARADO: { label: "Parado", severity: "off" },
  ACELERANDO: { label: "Acelerando", severity: "info" },
  EN_MARCHA: { label: "En marcha", severity: "ok" },
  DESACELERANDO: { label: "Desacelerando", severity: "info" },
  FALLA: { label: "Falla", severity: "fault" },
  SIN_COMUNICACION: { label: "Sin comunicación", severity: "off" },
};

export const SENSOR_META: Record<SensorHealth, { label: string; severity: Severity }> = {
  OK: { label: "OK", severity: "ok" },
  DEGRADADO: { label: "Degradado", severity: "warn" },
  DESCONECTADO: { label: "Desconectado", severity: "fault" },
  SIN_DATOS: { label: "Sin datos", severity: "off" },
};
