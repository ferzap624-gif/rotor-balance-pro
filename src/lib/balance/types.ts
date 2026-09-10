/**
 * Estructura de datos NORMALIZADA del sistema.
 * Ninguna capa de interfaz conoce el transporte físico (ESP32 / PLC / API / WS).
 */

export type MachineState =
  | "DESCONECTADA"
  | "CONECTANDO"
  | "CONECTADA"
  | "LISTA"
  | "ESPERANDO"
  | "ACELERANDO"
  | "ESTABILIZANDO"
  | "MIDIENDO"
  | "PROCESANDO"
  | "CORRECCION_CALCULADA"
  | "ESPERANDO_CORRECCION"
  | "VERIFICANDO"
  | "BALANCEADO"
  | "ADVERTENCIA"
  | "FALLA";

export type Severity = "ok" | "info" | "warn" | "fault" | "off";

export type SensorHealth = "OK" | "DEGRADADO" | "DESCONECTADO" | "SIN_DATOS";

export type DriveState = "PARADO" | "ACELERANDO" | "EN_MARCHA" | "DESACELERANDO" | "FALLA" | "SIN_COMUNICACION";

export type ConnectionState = "DESCONECTADO" | "CONECTANDO" | "CONECTADO" | "ERROR";

export type TransportMode =
  | "MODE_SIMULATION"
  | "MODE_ESP32"
  | "MODE_PLC"
  | "MODE_API"
  | "MODE_WEBSOCKET";

export interface Harmonic {
  /** Frecuencia en Hz */
  frequency: number;
  /** Amplitud en mm/s RMS */
  amplitude: number;
  /** Fase en grados 0–360 */
  phase: number;
}

export interface SpectrumPoint {
  frequency: number;
  amplitude: number;
}

export interface WaveformPoint {
  /** Tiempo en ms */
  t: number;
  /** Amplitud instantánea */
  v: number;
}

export interface SafetyStatus {
  emergencyStop: boolean;
  guardClosed: boolean;
  runPermit: boolean;
  plcOnline: boolean;
}

export interface SensorStatusMap {
  accelerometerA: SensorHealth;
  accelerometerB: SensorHealth;
  rpmSensor: SensorHealth;
  angularReference: SensorHealth;
}

/** Trama normalizada que el frontend consume, sea simulada o real. */
export interface Telemetry {
  machineState: MachineState;
  rpm: number;
  rpmStable: boolean;
  vibrationRms: number;
  vibrationPeak: number;
  acceleration: number;
  harmonics: { x1: Harmonic; x2: Harmonic; x3: Harmonic };
  /** Fase de la componente 1X, 0–360° */
  phase: number;
  driveFrequency: number;
  motorCurrent: number;
  motorPower: number;
  rotationDirection: "CW" | "CCW";
  temperature: number;
  sensorStatus: SensorStatusMap;
  driveStatus: DriveState;
  driveAlarm: string | null;
  safetyStatus: SafetyStatus;
  /** 0–100 % */
  signalQuality: number;
  qualityIssues: string[];
  /** Segundos de medición acumulados */
  measurementTime: number;
  spectrum: SpectrumPoint[];
  waveform: WaveformPoint[];
  timestamp: number;
  simulated: boolean;
}

export type CommandName =
  | "DRIVE_START"
  | "DRIVE_STOP"
  | "DRIVE_EMERGENCY"
  | "DRIVE_RESET_FAULT"
  | "SET_TARGET_RPM"
  | "MEASURE_START"
  | "MEASURE_STOP"
  | "CAPTURE_ANGULAR_REFERENCE";

export interface Command {
  name: CommandName;
  payload?: Record<string, number | string | boolean>;
}

export interface CommandResult {
  accepted: boolean;
  message: string;
}

/** Vector amplitud ∠ fase — representación de vibración o masa. */
export interface PolarVector {
  amplitude: number;
  /** grados */
  angle: number;
}

export interface MeasurementSample {
  id: string;
  label: string;
  timestamp: number;
  rpm: number;
  planeA: PolarVector;
  planeB?: PolarVector;
  harmonics: { x1: number; x2: number; x3: number };
  signalQuality: number;
  simulated: boolean;
}

export interface TestWeight {
  mass: number;
  radius: number;
  angle: number;
}

export interface CorrectionResult {
  planes: 1 | 2;
  planeA: { mass: number; angle: number; radius: number };
  planeB?: { mass: number; angle: number; radius: number };
  /** Trazabilidad del motor de cálculo */
  engine: string;
  method: string;
  computedAt: number;
  warnings: string[];
}

export type WorkflowPhase =
  | "IDLE"
  | "CONFIGURATION"
  | "INITIAL_MEASUREMENT"
  | "TEST_WEIGHT"
  | "TEST_MEASUREMENT"
  | "CALCULATION"
  | "CORRECTION"
  | "VERIFICATION"
  | "COMPLETED"
  | "FAULT";

export interface RotorConfig {
  name: string;
  type: "Disco" | "Rodillo" | "Ventilador" | "Turbina" | "Eje" | "Otro";
  diameter: number;
  mass: number;
  correctionRadiusA: number;
  correctionRadiusB: number;
  planeDistance: number;
  targetRpm: number;
  planes: 1 | 2;
}

export interface HistoryJob {
  id: string;
  date: number;
  rotor: string;
  operator: string;
  type: "1 Plano" | "2 Planos";
  rpm: number;
  initialVibration: number;
  finalVibration: number;
  reduction: number;
  correction: string;
  result: "BALANCEADO" | "NECESITA CORRECCION" | "ABORTADO";
  simulated: boolean;
}

export interface CalibrationRecord {
  id: string;
  channel: string;
  measured: number;
  expected: number;
  error: number;
  factor: number;
  date: number;
  user: string;
  status: "VALIDA" | "VENCIDA" | "FALLIDA";
}

export type SimulatorScenario =
  | "BALANCEADO"
  | "DESBALANCE"
  | "RUIDO"
  | "VIBRACION_ELEVADA"
  | "RPM_INESTABLE";

export interface Alarm {
  id: string;
  severity: "warn" | "fault" | "info";
  code: string;
  message: string;
  timestamp: number;
}
