import { HardwareSimulator } from "./simulator";
import type {
  Command,
  CommandResult,
  ConnectionState,
  SimulatorScenario,
  Telemetry,
  TransportMode,
} from "./types";

/**
 * HardwareCommunicationService
 * Capa de comunicación DESACOPLADA. La interfaz nunca sabe si detrás hay
 * un simulador, un ESP32, un PLC, una API REST o un WebSocket.
 */

export interface TransportConfig {
  mode: TransportMode;
  /** http(s)://host o ws(s)://host según el modo */
  endpoint: string;
  pollIntervalMs: number;
  scenario: SimulatorScenario;
  targetRpm: number;
}

export const DEFAULT_TRANSPORT: TransportConfig = {
  mode: "MODE_SIMULATION",
  endpoint: "ws://192.168.4.1/telemetry",
  pollIntervalMs: 200,
  scenario: "DESBALANCE",
  targetRpm: 1800,
};

type TelemetryListener = (frame: Telemetry) => void;
type StatusListener = (state: ConnectionState, detail: string) => void;

interface Transport {
  connect(): void;
  disconnect(): void;
  send(cmd: Command): Promise<CommandResult>;
}

export class HardwareCommunicationService {
  private config: TransportConfig = { ...DEFAULT_TRANSPORT };
  private telemetryListeners = new Set<TelemetryListener>();
  private statusListeners = new Set<StatusListener>();
  private connection: ConnectionState = "DESCONECTADO";
  private transport: Transport | null = null;
  private simulator = new HardwareSimulator();
  private timer: ReturnType<typeof setInterval> | null = null;
  private socket: WebSocket | null = null;

  getConfig() {
    return { ...this.config };
  }

  getConnectionState() {
    return this.connection;
  }

  getSimulator() {
    return this.simulator;
  }

  onTelemetry(fn: TelemetryListener) {
    this.telemetryListeners.add(fn);
    return () => this.telemetryListeners.delete(fn);
  }

  onStatus(fn: StatusListener) {
    this.statusListeners.add(fn);
    return () => this.statusListeners.delete(fn);
  }

  configure(patch: Partial<TransportConfig>) {
    const modeChanged = patch.mode !== undefined && patch.mode !== this.config.mode;
    this.config = { ...this.config, ...patch };
    this.simulator.configure({ scenario: this.config.scenario, targetRpm: this.config.targetRpm });
    if (modeChanged) {
      this.disconnect();
      this.connect();
    }
  }

  connect() {
    this.disconnect();
    this.setStatus("CONECTANDO", `Abriendo enlace ${this.config.mode}`);
    switch (this.config.mode) {
      case "MODE_SIMULATION":
        this.transport = this.simulationTransport();
        break;
      case "MODE_WEBSOCKET":
      case "MODE_ESP32":
        this.transport = this.websocketTransport();
        break;
      case "MODE_API":
      case "MODE_PLC":
        this.transport = this.restTransport();
        break;
    }
    this.transport?.connect();
  }

  disconnect() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.socket?.close();
    this.socket = null;
    this.transport?.disconnect();
    this.transport = null;
    this.setStatus("DESCONECTADO", "Enlace cerrado");
  }

  async send(cmd: Command): Promise<CommandResult> {
    if (!this.transport) return { accepted: false, message: "Sin enlace de comunicación" };
    return this.transport.send(cmd);
  }

  private setStatus(state: ConnectionState, detail: string) {
    this.connection = state;
    this.statusListeners.forEach((fn) => fn(state, detail));
  }

  private emit(frame: Telemetry) {
    this.telemetryListeners.forEach((fn) => fn(frame));
  }

  // ---- Transportes -------------------------------------------------------

  private simulationTransport(): Transport {
    return {
      connect: () => {
        this.setStatus("CONECTADO", "Simulador de hardware activo");
        this.timer = setInterval(() => {
          this.emit(this.simulator.tick(this.config.pollIntervalMs));
        }, this.config.pollIntervalMs);
      },
      disconnect: () => {
        if (this.timer) clearInterval(this.timer);
        this.timer = null;
      },
      send: async (cmd) => this.simulator.command(cmd),
    };
  }

  /** ESP32 / gateway con WebSocket. Trama JSON ya normalizada por el firmware. */
  private websocketTransport(): Transport {
    return {
      connect: () => {
        try {
          const socket = new WebSocket(this.config.endpoint);
          this.socket = socket;
          socket.onopen = () => this.setStatus("CONECTADO", `WebSocket ${this.config.endpoint}`);
          socket.onerror = () => this.setStatus("ERROR", "No se pudo abrir el WebSocket");
          socket.onclose = () => this.setStatus("DESCONECTADO", "WebSocket cerrado");
          socket.onmessage = (event) => {
            try {
              const frame = JSON.parse(String(event.data)) as Telemetry;
              this.emit({ ...frame, simulated: false });
            } catch {
              this.setStatus("ERROR", "Trama inválida recibida");
            }
          };
        } catch {
          this.setStatus("ERROR", "Endpoint WebSocket inválido");
        }
      },
      disconnect: () => {
        this.socket?.close();
        this.socket = null;
      },
      send: async (cmd) => {
        if (this.socket?.readyState !== WebSocket.OPEN) {
          return { accepted: false, message: "WebSocket no conectado" };
        }
        this.socket.send(JSON.stringify(cmd));
        return { accepted: true, message: `Comando ${cmd.name} enviado` };
      },
    };
  }

  /** PLC / gateway Modbus-OPC UA expuesto vía REST por el backend. */
  private restTransport(): Transport {
    return {
      connect: () => {
        this.setStatus("CONECTANDO", `Consultando ${this.config.endpoint}`);
        const poll = async () => {
          try {
            const res = await fetch(`${this.config.endpoint}/telemetry`);
            if (!res.ok) throw new Error(String(res.status));
            const frame = (await res.json()) as Telemetry;
            this.setStatus("CONECTADO", `REST ${this.config.endpoint}`);
            this.emit({ ...frame, simulated: false });
          } catch {
            this.setStatus("ERROR", "Sin respuesta del gateway");
          }
        };
        void poll();
        this.timer = setInterval(poll, Math.max(200, this.config.pollIntervalMs));
      },
      disconnect: () => {
        if (this.timer) clearInterval(this.timer);
        this.timer = null;
      },
      send: async (cmd) => {
        try {
          const res = await fetch(`${this.config.endpoint}/command`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(cmd),
          });
          if (!res.ok) return { accepted: false, message: `Rechazado (${res.status})` };
          return (await res.json()) as CommandResult;
        } catch {
          return { accepted: false, message: "Gateway inaccesible" };
        }
      },
    };
  }
}

export const OFFLINE_TELEMETRY: Telemetry = {
  machineState: "DESCONECTADA",
  rpm: 0,
  rpmStable: false,
  vibrationRms: 0,
  vibrationPeak: 0,
  acceleration: 0,
  harmonics: {
    x1: { frequency: 0, amplitude: 0, phase: 0 },
    x2: { frequency: 0, amplitude: 0, phase: 0 },
    x3: { frequency: 0, amplitude: 0, phase: 0 },
  },
  phase: 0,
  driveFrequency: 0,
  motorCurrent: 0,
  motorPower: 0,
  rotationDirection: "CW",
  temperature: 0,
  sensorStatus: {
    accelerometerA: "SIN_DATOS",
    accelerometerB: "SIN_DATOS",
    rpmSensor: "SIN_DATOS",
    angularReference: "SIN_DATOS",
  },
  driveStatus: "SIN_COMUNICACION",
  driveAlarm: null,
  safetyStatus: { emergencyStop: false, guardClosed: false, runPermit: false, plcOnline: false },
  signalQuality: 0,
  qualityIssues: ["Sin comunicación con el hardware"],
  measurementTime: 0,
  spectrum: [],
  waveform: [],
  timestamp: 0,
  simulated: false,
};
