import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import { calculateCorrection } from "@/lib/balance/balance.functions";
import {
  DEFAULT_TRANSPORT,
  HardwareCommunicationService,
  OFFLINE_TELEMETRY,
  type TransportConfig,
} from "@/lib/balance/hardware-service";
import type {
  Alarm,
  CalibrationRecord,
  CorrectionResult,
  Command,
  ConnectionState,
  HistoryJob,
  MeasurementSample,
  PolarVector,
  RotorConfig,
  SimulatorScenario,
  Telemetry,
  TestWeight,
  WorkflowPhase,
} from "@/lib/balance/types";
import { SEED_CALIBRATIONS, SEED_HISTORY } from "@/lib/balance/mock-data";

export type UserLevel = "AFICIONADO" | "PROFESIONAL";

export interface Settings {
  level: UserLevel;
  operator: string;
  machineTag: string;
  units: {
    vibration: "mm/s" | "in/s";
    mass: "g" | "oz";
    length: "mm" | "in";
  };
  limits: {
    vibrationLimit: number;
    warningLimit: number;
    minSignalQuality: number;
    minMeasurementTime: number;
    maxRpmDeviation: number;
  };
  tolerances: {
    residualTarget: number;
    minReduction: number;
  };
}

export const DEFAULT_SETTINGS: Settings = {
  level: "PROFESIONAL",
  operator: "Operador 1",
  machineTag: "BAL-DIN-01",
  units: { vibration: "mm/s", mass: "g", length: "mm" },
  limits: {
    vibrationLimit: 7.1,
    warningLimit: 4.5,
    minSignalQuality: 70,
    minMeasurementTime: 3,
    maxRpmDeviation: 2,
  },
  tolerances: { residualTarget: 1.2, minReduction: 60 },
};

export const DEFAULT_ROTOR: RotorConfig = {
  name: "Rotor de ensayo",
  type: "Disco",
  diameter: 320,
  mass: 18.5,
  correctionRadiusA: 50,
  correctionRadiusB: 50,
  planeDistance: 180,
  targetRpm: 1800,
  planes: 1,
};

type TrialKey = "trialA" | "trialB";

export interface WorkflowState {
  phase: WorkflowPhase;
  initial: MeasurementSample | null;
  trialA: MeasurementSample | null;
  trialB: MeasurementSample | null;
  verification: MeasurementSample | null;
  testWeightA: TestWeight;
  testWeightB: TestWeight;
  correction: CorrectionResult | null;
  correctionApplied: boolean;
  calculating: boolean;
}

const INITIAL_WORKFLOW: WorkflowState = {
  phase: "CONFIGURATION",
  initial: null,
  trialA: null,
  trialB: null,
  verification: null,
  testWeightA: { mass: 5, radius: 50, angle: 0 },
  testWeightB: { mass: 5, radius: 50, angle: 0 },
  correction: null,
  correctionApplied: false,
  calculating: false,
};

export interface Guard {
  allowed: boolean;
  reasons: string[];
}

interface SystemContextValue {
  telemetry: Telemetry;
  connection: ConnectionState;
  connectionDetail: string;
  transport: TransportConfig;
  configureTransport: (patch: Partial<TransportConfig>) => void;
  reconnect: () => void;
  disconnect: () => void;
  sendCommand: (cmd: Command) => Promise<void>;
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  rotor: RotorConfig;
  updateRotor: (patch: Partial<RotorConfig>) => void;
  workflow: WorkflowState;
  measurementGuard: Guard;
  captureMeasurement: (slot: "initial" | TrialKey | "verification") => void;
  setTestWeight: (plane: "A" | "B", weight: Partial<TestWeight>) => void;
  requestCalculation: () => Promise<void>;
  confirmCorrectionApplied: () => void;
  resetWorkflow: () => void;
  alarms: Alarm[];
  clearAlarms: () => void;
  history: HistoryJob[];
  calibrations: CalibrationRecord[];
  addCalibration: (record: Omit<CalibrationRecord, "id" | "date">) => void;
  scenario: SimulatorScenario;
  setScenario: (s: SimulatorScenario) => void;
}

const SystemContext = createContext<SystemContextValue | null>(null);

function toVector(t: Telemetry): PolarVector {
  return { amplitude: t.harmonics.x1.amplitude, angle: t.harmonics.x1.phase };
}

function sample(label: string, t: Telemetry, planes: 1 | 2): MeasurementSample {
  const a = toVector(t);
  return {
    id: `${label}-${t.timestamp}`,
    label,
    timestamp: t.timestamp || Date.now(),
    rpm: t.rpm,
    planeA: a,
    planeB:
      planes === 2
        ? { amplitude: Math.round(a.amplitude * 0.82 * 100) / 100, angle: (a.angle + 47) % 360 }
        : undefined,
    harmonics: {
      x1: t.harmonics.x1.amplitude,
      x2: t.harmonics.x2.amplitude,
      x3: t.harmonics.x3.amplitude,
    },
    signalQuality: t.signalQuality,
    simulated: t.simulated,
  };
}

export function SystemProvider({ children }: { children: ReactNode }) {
  const serviceRef = useRef<HardwareCommunicationService | null>(null);
  if (!serviceRef.current) serviceRef.current = new HardwareCommunicationService();
  const service = serviceRef.current;

  const [telemetry, setTelemetry] = useState<Telemetry>(OFFLINE_TELEMETRY);
  const [connection, setConnection] = useState<ConnectionState>("DESCONECTADO");
  const [connectionDetail, setConnectionDetail] = useState("Enlace no iniciado");
  const [transport, setTransport] = useState<TransportConfig>(DEFAULT_TRANSPORT);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [rotor, setRotor] = useState<RotorConfig>(DEFAULT_ROTOR);
  const [workflow, setWorkflow] = useState<WorkflowState>(INITIAL_WORKFLOW);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [history, setHistory] = useState<HistoryJob[]>(SEED_HISTORY);
  const [calibrations, setCalibrations] = useState<CalibrationRecord[]>(SEED_CALIBRATIONS);

  const telemetryRef = useRef(telemetry);
  telemetryRef.current = telemetry;

  useEffect(() => {
    const offTelemetry = service.onTelemetry((frame) => setTelemetry(frame));
    const offStatus = service.onStatus((state, detail) => {
      setConnection(state);
      setConnectionDetail(detail);
      if (state !== "CONECTADO") setTelemetry((prev) => ({ ...OFFLINE_TELEMETRY, spectrum: [], waveform: [], timestamp: prev.timestamp }));
    });
    service.connect();
    return () => {
      offTelemetry();
      offStatus();
      service.disconnect();
    };
  }, [service]);

  // Alarmas derivadas del hardware (nunca inventadas por la interfaz)
  const lastAlarmKey = useRef("");
  useEffect(() => {
    if (connection !== "CONECTADO") return;
    const events: Array<Omit<Alarm, "id" | "timestamp">> = [];
    if (telemetry.safetyStatus.emergencyStop)
      events.push({ severity: "fault", code: "SAF-001", message: "Paro de emergencia activo" });
    if (!telemetry.safetyStatus.guardClosed)
      events.push({ severity: "fault", code: "SAF-002", message: "Protección/puerta abierta" });
    if (telemetry.driveAlarm)
      events.push({ severity: "fault", code: "DRV-001", message: `Variador: ${telemetry.driveAlarm}` });
    if (telemetry.vibrationRms > settings.limits.vibrationLimit)
      events.push({
        severity: "warn",
        code: "VIB-001",
        message: `Vibración ${telemetry.vibrationRms} mm/s sobre el límite ${settings.limits.vibrationLimit} mm/s`,
      });
    if (telemetry.sensorStatus.rpmSensor !== "OK")
      events.push({ severity: "warn", code: "SEN-002", message: "Sensor de RPM degradado" });

    const key = events.map((e) => e.code).join("|");
    if (key && key !== lastAlarmKey.current) {
      lastAlarmKey.current = key;
      setAlarms((prev) =>
        [
          ...events.map((e) => ({ ...e, id: `${e.code}-${Date.now()}`, timestamp: Date.now() })),
          ...prev,
        ].slice(0, 40),
      );
    }
    if (!key) lastAlarmKey.current = "";
  }, [telemetry, connection, settings.limits.vibrationLimit]);

  const configureTransport = useCallback(
    (patch: Partial<TransportConfig>) => {
      service.configure(patch);
      setTransport(service.getConfig());
    },
    [service],
  );

  useEffect(() => {
    configureTransport({ targetRpm: rotor.targetRpm });
  }, [rotor.targetRpm, configureTransport]);

  const sendCommand = useCallback(
    async (cmd: Command) => {
      const result = await service.send(cmd);
      if (result.accepted) toast.success(result.message);
      else toast.error(result.message);
    },
    [service],
  );

  const measurementGuard = useMemo<Guard>(() => {
    const reasons: string[] = [];
    if (connection !== "CONECTADO") reasons.push("Sin comunicación con el hardware");
    if (!telemetry.safetyStatus.runPermit) reasons.push("Sin permiso de giro del sistema de seguridad");
    if (telemetry.safetyStatus.emergencyStop) reasons.push("Paro de emergencia activo");
    if (!telemetry.safetyStatus.guardClosed) reasons.push("Protección abierta");
    if (!telemetry.rpmStable) reasons.push("Velocidad no estable");
    if (telemetry.signalQuality < settings.limits.minSignalQuality)
      reasons.push(`Calidad de señal ${telemetry.signalQuality} % < ${settings.limits.minSignalQuality} %`);
    if (telemetry.sensorStatus.angularReference !== "OK") reasons.push("Referencia angular no válida");
    return { allowed: reasons.length === 0, reasons };
  }, [connection, telemetry, settings.limits.minSignalQuality]);

  const captureMeasurement = useCallback(
    (slot: "initial" | TrialKey | "verification") => {
      const t = telemetryRef.current;
      if (!measurementGuard.allowed) {
        toast.error("Medición bloqueada", { description: measurementGuard.reasons[0] });
        return;
      }
      setWorkflow((prev) => {
        // Máquina de estados: no permitir saltos lógicos incorrectos
        if (slot === "trialA" && !prev.initial) {
          toast.error("Se requiere una medición inicial válida");
          return prev;
        }
        if (slot === "trialB" && !prev.trialA) {
          toast.error("Se requiere la medición con masa de prueba en el plano A");
          return prev;
        }
        if (slot === "verification" && !prev.correction) {
          toast.error("No existe corrección calculada para verificar");
          return prev;
        }
        if (slot === "verification" && !prev.correctionApplied) {
          toast.error("Confirme primero que la masa de corrección fue colocada");
          return prev;
        }
        const s = sample(slot, t, rotor.planes);
        const next: WorkflowState = { ...prev, [slot]: s } as WorkflowState;
        if (slot === "initial") next.phase = "TEST_WEIGHT";
        if (slot === "trialA") next.phase = rotor.planes === 2 ? "TEST_WEIGHT" : "CALCULATION";
        if (slot === "trialB") next.phase = "CALCULATION";
        if (slot === "verification") next.phase = "COMPLETED";
        return next;
      });

      if (slot === "verification") {
        setWorkflow((prev) => {
          const initial = prev.initial?.planeA.amplitude ?? 0;
          const final = prev.verification?.planeA.amplitude ?? 0;
          const reduction = initial > 0 ? ((initial - final) / initial) * 100 : 0;
          const ok = final <= settings.limits.warningLimit && reduction >= settings.tolerances.minReduction;
          setHistory((h) => [
            {
              id: `JOB-${Date.now()}`,
              date: Date.now(),
              rotor: rotor.name,
              operator: settings.operator,
              type: rotor.planes === 2 ? "2 Planos" : "1 Plano",
              rpm: prev.verification?.rpm ?? rotor.targetRpm,
              initialVibration: initial,
              finalVibration: final,
              reduction: Math.round(reduction * 10) / 10,
              correction: prev.correction
                ? `A: ${prev.correction.planeA.mass} g @ ${prev.correction.planeA.angle}°${
                    prev.correction.planeB ? ` · B: ${prev.correction.planeB.mass} g @ ${prev.correction.planeB.angle}°` : ""
                  }`
                : "—",
              result: ok ? "BALANCEADO" : "NECESITA CORRECCION",
              simulated: prev.verification?.simulated ?? true,
            },
            ...h,
          ]);
          return prev;
        });
        toast.success("Verificación registrada en el historial");
      } else {
        toast.success("Medición capturada");
      }
    },
    [measurementGuard, rotor, settings.limits.warningLimit, settings.tolerances.minReduction, settings.operator],
  );

  const setTestWeight = useCallback(
    (plane: "A" | "B", weight: Partial<TestWeight>) => {
      setWorkflow((prev) => ({
        ...prev,
        [plane === "A" ? "testWeightA" : "testWeightB"]: {
          ...(plane === "A" ? prev.testWeightA : prev.testWeightB),
          ...weight,
        },
      }));
      service.getSimulator().setTrialWeight(true);
    },
    [service],
  );

  const requestCalculation = useCallback(async () => {
    const w = workflow;
    if (!w.initial) {
      toast.error("Falta la medición inicial");
      return;
    }
    if (!w.trialA) {
      toast.error("Falta la medición con masa de prueba");
      return;
    }
    if (rotor.planes === 2 && !w.trialB) {
      toast.error("Falta la medición con masa de prueba en el plano B");
      return;
    }
    setWorkflow((p) => ({ ...p, calculating: true }));
    try {
      const payload =
        rotor.planes === 1
          ? {
              planes: 1 as const,
              initial: w.initial.planeA,
              trial: w.trialA.planeA,
              testWeight: w.testWeightA,
              correctionRadius: rotor.correctionRadiusA,
            }
          : {
              planes: 2 as const,
              initialA: w.initial.planeA,
              initialB: w.initial.planeB ?? w.initial.planeA,
              trialAonA: w.trialA.planeA,
              trialAonB: w.trialA.planeB ?? w.trialA.planeA,
              trialBonA: w.trialB!.planeA,
              trialBonB: w.trialB!.planeB ?? w.trialB!.planeA,
              testWeightA: w.testWeightA,
              testWeightB: w.testWeightB,
              correctionRadiusA: rotor.correctionRadiusA,
              correctionRadiusB: rotor.correctionRadiusB,
            };
      const result = (await calculateCorrection({ data: payload })) as CorrectionResult;
      setWorkflow((p) => ({
        ...p,
        correction: result,
        correctionApplied: false,
        calculating: false,
        phase: "CORRECTION",
      }));
      service.getSimulator().setTrialWeight(false);
      result.warnings.forEach((wr) => toast.warning(wr));
      toast.success("Corrección calculada por el motor de cálculo");
    } catch (error) {
      setWorkflow((p) => ({ ...p, calculating: false, phase: "FAULT" }));
      toast.error("El motor de cálculo rechazó los datos", {
        description: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }, [workflow, rotor, service]);

  const confirmCorrectionApplied = useCallback(() => {
    setWorkflow((p) => {
      if (!p.correction) {
        toast.error("No existe corrección calculada");
        return p;
      }
      return { ...p, correctionApplied: true, phase: "VERIFICATION" };
    });
    service.getSimulator().applyCorrection();
    toast.info("Corrección registrada. Ejecute la verificación.");
  }, [service]);

  const resetWorkflow = useCallback(() => {
    setWorkflow(INITIAL_WORKFLOW);
    service.getSimulator().resetCorrection();
    service.getSimulator().setTrialWeight(false);
  }, [service]);

  const value = useMemo<SystemContextValue>(
    () => ({
      telemetry,
      connection,
      connectionDetail,
      transport,
      configureTransport,
      reconnect: () => service.connect(),
      disconnect: () => service.disconnect(),
      sendCommand,
      settings,
      updateSettings: (patch) => setSettings((p) => ({ ...p, ...patch })),
      rotor,
      updateRotor: (patch) => setRotor((p) => ({ ...p, ...patch })),
      workflow,
      measurementGuard,
      captureMeasurement,
      setTestWeight,
      requestCalculation,
      confirmCorrectionApplied,
      resetWorkflow,
      alarms,
      clearAlarms: () => setAlarms([]),
      history,
      calibrations,
      addCalibration: (record) =>
        setCalibrations((prev) => [{ ...record, id: `CAL-${Date.now()}`, date: Date.now() }, ...prev]),
      scenario: transport.scenario,
      setScenario: (s) => configureTransport({ scenario: s }),
    }),
    [
      telemetry,
      connection,
      connectionDetail,
      transport,
      configureTransport,
      sendCommand,
      settings,
      rotor,
      workflow,
      measurementGuard,
      captureMeasurement,
      setTestWeight,
      requestCalculation,
      confirmCorrectionApplied,
      resetWorkflow,
      alarms,
      history,
      calibrations,
      service,
    ],
  );

  return <SystemContext.Provider value={value}>{children}</SystemContext.Provider>;
}

export function useSystem() {
  const ctx = useContext(SystemContext);
  if (!ctx) throw new Error("useSystem debe usarse dentro de <SystemProvider>");
  return ctx;
}
