import type {
  Command,
  MachineState,
  SimulatorScenario,
  SpectrumPoint,
  Telemetry,
  WaveformPoint,
} from "./types";

/**
 * SIMULADOR DE HARDWARE.
 * Genera tramas normalizadas equivalentes a las que entregará el ESP32 / PLC.
 * Se sustituye por el transporte real sin tocar la interfaz.
 */

interface ScenarioProfile {
  baseVibration: number;
  noise: number;
  rpmJitter: number;
  phase: number;
  signalQuality: number;
}

const PROFILES: Record<SimulatorScenario, ScenarioProfile> = {
  BALANCEADO: { baseVibration: 0.7, noise: 0.05, rpmJitter: 2, phase: 210, signalQuality: 97 },
  DESBALANCE: { baseVibration: 4.2, noise: 0.08, rpmJitter: 3, phase: 132, signalQuality: 94 },
  RUIDO: { baseVibration: 3.1, noise: 0.9, rpmJitter: 6, phase: 88, signalQuality: 61 },
  VIBRACION_ELEVADA: { baseVibration: 11.4, noise: 0.25, rpmJitter: 5, phase: 305, signalQuality: 88 },
  RPM_INESTABLE: { baseVibration: 3.6, noise: 0.3, rpmJitter: 95, phase: 154, signalQuality: 47 },
};

export interface SimulatorOptions {
  scenario: SimulatorScenario;
  targetRpm: number;
}

export class HardwareSimulator {
  private scenario: SimulatorScenario = "DESBALANCE";
  private targetRpm = 1800;
  private rpm = 0;
  private running = false;
  private measuring = false;
  private measurementTime = 0;
  private stableSince = 0;
  private emergency = false;
  private fault = false;
  private angularRefCaptured = true;
  /** Compensación aplicada por el operador (para simular mejora tras corregir) */
  private residualFactor = 1;
  private residualPhaseShift = 0;
  private t = 0;

  configure(options: Partial<SimulatorOptions>) {
    if (options.scenario) this.scenario = options.scenario;
    if (options.targetRpm) this.targetRpm = options.targetRpm;
  }

  getScenario() {
    return this.scenario;
  }

  /** Simula el efecto físico de una masa de corrección colocada correctamente. */
  applyCorrection(qualityFactor = 0.19) {
    this.residualFactor = qualityFactor;
    this.residualPhaseShift = 4;
  }

  resetCorrection() {
    this.residualFactor = 1;
    this.residualPhaseShift = 0;
  }

  /** Simula el efecto de una masa de prueba: cambia amplitud y fase. */
  private trialActive = false;
  setTrialWeight(active: boolean) {
    this.trialActive = active;
  }

  command(cmd: Command): { accepted: boolean; message: string } {
    switch (cmd.name) {
      case "DRIVE_START":
        if (this.emergency) return { accepted: false, message: "Paro de emergencia activo" };
        if (this.fault) return { accepted: false, message: "Falla activa: requiere reset" };
        this.running = true;
        return { accepted: true, message: "Arranque enviado al variador" };
      case "DRIVE_STOP":
        this.running = false;
        this.measuring = false;
        return { accepted: true, message: "Paro enviado al variador" };
      case "DRIVE_EMERGENCY":
        this.emergency = true;
        this.running = false;
        this.measuring = false;
        return { accepted: true, message: "Paro de emergencia simulado" };
      case "DRIVE_RESET_FAULT":
        this.fault = false;
        this.emergency = false;
        return { accepted: true, message: "Reset de falla ejecutado" };
      case "SET_TARGET_RPM":
        this.targetRpm = Number(cmd.payload?.rpm ?? this.targetRpm);
        return { accepted: true, message: `RPM objetivo: ${this.targetRpm}` };
      case "MEASURE_START":
        if (!this.running) return { accepted: false, message: "El rotor no está girando" };
        this.measuring = true;
        this.measurementTime = 0;
        return { accepted: true, message: "Adquisición iniciada" };
      case "MEASURE_STOP":
        this.measuring = false;
        return { accepted: true, message: "Adquisición detenida" };
      case "CAPTURE_ANGULAR_REFERENCE":
        this.angularRefCaptured = true;
        return { accepted: true, message: "Referencia angular capturada" };
      default:
        return { accepted: false, message: "Comando no soportado" };
    }
  }

  tick(dtMs: number): Telemetry {
    const dt = dtMs / 1000;
    this.t += dt;
    const profile = PROFILES[this.scenario];

    // Rampa de velocidad
    const target = this.running ? this.targetRpm : 0;
    const rate = this.running ? 420 : 620;
    const diff = target - this.rpm;
    this.rpm += Math.sign(diff) * Math.min(Math.abs(diff), rate * dt);
    const jitter = (Math.random() - 0.5) * profile.rpmJitter;
    const rpmOut = Math.max(0, this.rpm + (this.rpm > 30 ? jitter : 0));

    const nearTarget = this.rpm > 30 && Math.abs(this.rpm - target) < Math.max(12, target * 0.01);
    if (nearTarget) this.stableSince += dt;
    else this.stableSince = 0;
    const rpmStable = nearTarget && this.stableSince > 1.6 && profile.rpmJitter < 40;

    if (this.measuring) this.measurementTime += dt;

    // Amplitud 1X proporcional al régimen
    const speedRatio = this.targetRpm > 0 ? Math.min(1, this.rpm / this.targetRpm) : 0;
    const trialGain = this.trialActive ? 1.42 : 1;
    const trialPhase = this.trialActive ? -37 : 0;
    const x1Amp =
      profile.baseVibration *
      this.residualFactor *
      trialGain *
      speedRatio ** 2 *
      (1 + (Math.random() - 0.5) * profile.noise * 0.4);
    const x1Phase =
      (profile.phase + this.residualPhaseShift + trialPhase + (Math.random() - 0.5) * (profile.noise * 14) + 360) % 360;

    const f1 = rpmOut / 60;
    const x2Amp = x1Amp * (0.19 + profile.noise * 0.1);
    const x3Amp = x1Amp * (0.07 + profile.noise * 0.06);
    const broadband = x1Amp * profile.noise * 0.8;

    const rms = Math.sqrt(x1Amp ** 2 + x2Amp ** 2 + x3Amp ** 2 + broadband ** 2);
    const peak = rms * 1.41;

    let quality = profile.signalQuality;
    const issues: string[] = [];
    if (!rpmStable && this.rpm > 30) {
      quality -= 18;
      issues.push("RPM inestable");
    }
    if (rms < 0.15) {
      quality -= 25;
      issues.push("Señal insuficiente");
    }
    if (profile.noise > 0.5) issues.push("Ruido excesivo");
    if (!this.angularRefCaptured) {
      quality -= 40;
      issues.push("Referencia angular perdida");
    }
    if (this.measuring && this.measurementTime < 2) issues.push("Datos insuficientes");
    quality = Math.max(0, Math.min(100, quality + (Math.random() - 0.5) * 3));

    const machineState = this.resolveState(rpmStable, target);

    return {
      machineState,
      rpm: Number(rpmOut.toFixed(0)),
      rpmStable,
      vibrationRms: round(rms, 2),
      vibrationPeak: round(peak, 2),
      acceleration: round((rms * 2 * Math.PI * f1) / 1000, 3),
      harmonics: {
        x1: { frequency: round(f1, 1), amplitude: round(x1Amp, 2), phase: round(x1Phase, 0) },
        x2: { frequency: round(f1 * 2, 1), amplitude: round(x2Amp, 2), phase: round((x1Phase * 2) % 360, 0) },
        x3: { frequency: round(f1 * 3, 1), amplitude: round(x3Amp, 2), phase: round((x1Phase * 3) % 360, 0) },
      },
      phase: round(x1Phase, 0),
      driveFrequency: round((rpmOut / 60) * 2, 1),
      motorCurrent: round(this.running ? 3.1 + speedRatio * 4.4 + Math.random() * 0.2 : 0, 2),
      motorPower: round(this.running ? 0.4 + speedRatio * 1.9 : 0, 2),
      rotationDirection: "CW",
      temperature: round(28 + speedRatio * 9 + Math.random(), 1),
      sensorStatus: {
        accelerometerA: "OK",
        accelerometerB: "OK",
        rpmSensor: this.scenario === "RPM_INESTABLE" ? "DEGRADADO" : "OK",
        angularReference: this.angularRefCaptured ? "OK" : "SIN_DATOS",
      },
      driveStatus: this.resolveDrive(target),
      driveAlarm: this.fault ? "F-021 Sobrecorriente" : null,
      safetyStatus: {
        emergencyStop: this.emergency,
        guardClosed: true,
        runPermit: !this.emergency && !this.fault,
        plcOnline: true,
      },
      signalQuality: round(quality, 0),
      qualityIssues: issues,
      measurementTime: round(this.measurementTime, 1),
      spectrum: buildSpectrum(f1, x1Amp, x2Amp, x3Amp, broadband),
      waveform: buildWaveform(this.t, f1, x1Amp, x2Amp, broadband),
      timestamp: Date.now(),
      simulated: true,
    };
  }

  private resolveState(rpmStable: boolean, target: number): MachineState {
    if (this.emergency) return "FALLA";
    if (this.fault) return "FALLA";
    if (this.measuring) return "MIDIENDO";
    if (!this.running && this.rpm < 5) return "LISTA";
    if (this.rpm < target - 15) return "ACELERANDO";
    if (!this.running && this.rpm >= 5) return "ESPERANDO";
    if (!rpmStable) return "ESTABILIZANDO";
    return "ESPERANDO";
  }

  private resolveDrive(target: number) {
    if (this.fault || this.emergency) return "FALLA" as const;
    if (!this.running && this.rpm < 5) return "PARADO" as const;
    if (this.rpm < target - 15) return "ACELERANDO" as const;
    if (!this.running) return "DESACELERANDO" as const;
    return "EN_MARCHA" as const;
  }
}

function round(v: number, d: number) {
  const f = 10 ** d;
  return Math.round(v * f) / f;
}

function buildSpectrum(
  f1: number,
  a1: number,
  a2: number,
  a3: number,
  noise: number,
): SpectrumPoint[] {
  const points: SpectrumPoint[] = [];
  const maxF = 120;
  const step = 0.5;
  for (let f = 0; f <= maxF; f += step) {
    let amp = noise * 0.25 * Math.random() + 0.02;
    amp += peak(f, f1, a1);
    amp += peak(f, f1 * 2, a2);
    amp += peak(f, f1 * 3, a3);
    amp += peak(f, f1 * 4, a3 * 0.4);
    points.push({ frequency: round(f, 1), amplitude: round(amp, 3) });
  }
  return points;
}

function peak(f: number, center: number, amp: number) {
  if (center <= 0) return 0;
  const w = 0.9;
  return amp * Math.exp(-((f - center) ** 2) / (2 * w * w));
}

function buildWaveform(
  t0: number,
  f1: number,
  a1: number,
  a2: number,
  noise: number,
): WaveformPoint[] {
  const points: WaveformPoint[] = [];
  const durationMs = 200;
  const n = 200;
  for (let i = 0; i < n; i++) {
    const ms = (i / n) * durationMs;
    const s = t0 + ms / 1000;
    const v =
      a1 * 1.41 * Math.sin(2 * Math.PI * f1 * s) +
      a2 * 1.41 * Math.sin(2 * Math.PI * f1 * 2 * s + 1.1) +
      (Math.random() - 0.5) * noise * 2;
    points.push({ t: round(ms, 1), v: round(v, 3) });
  }
  return points;
}
