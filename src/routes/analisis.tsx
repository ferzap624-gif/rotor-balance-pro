import { createFileRoute } from "@tanstack/react-router";

import { Panel } from "@/components/industrial/Panel";
import { PageHeader } from "@/components/shell/PageHeader";
import { RealtimeValue } from "@/components/industrial/RealtimeValue";
import { FftChart, HarmonicsTable } from "@/components/industrial/FftChart";
import { WaveformChart } from "@/components/industrial/WaveformChart";
import { VectorBalanceChart } from "@/components/industrial/VectorBalanceChart";
import { PhaseIndicator } from "@/components/industrial/Gauges";
import { SignalQualityBar, SensorStatus } from "@/components/industrial/StatusIndicators";
import { useSystem } from "@/store/system-store";

export const Route = createFileRoute("/analisis")({
  head: () => ({
    meta: [
      { title: "Análisis de vibración — Balanceador Dinámico" },
      {
        name: "description",
        content:
          "Espectro FFT, forma de onda temporal, componentes 1X/2X/3X y calidad de señal para análisis profesional de vibraciones.",
      },
      { property: "og:title", content: "Análisis de vibración — Balanceador Dinámico" },
      { property: "og:description", content: "FFT, forma de onda, armónicos y vector de vibración." },
    ],
  }),
  component: AnalysisPage,
});

function AnalysisPage() {
  const { telemetry, settings, rotor } = useSystem();
  const unit = settings.units.vibration;

  return (
    <div>
      <PageHeader
        title="Análisis de vibración"
        subtitle={`${rotor.name} · ${telemetry.rpm} rpm · 1× = ${telemetry.harmonics.x1.frequency.toFixed(1)} Hz`}
      />

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-3">
          <Panel title="Espectro de vibración (FFT)" subtitle="use la barra inferior para zoom">
            <FftChart spectrum={telemetry.spectrum} harmonics={telemetry.harmonics} unit={unit} height={280} />
          </Panel>

          <Panel title="Forma de onda temporal" subtitle="frecuencia de muestreo 1 kHz · ventana 200 ms">
            <WaveformChart waveform={telemetry.waveform} unit={unit} height={230} />
            <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-4">
              <RealtimeValue label="RPM" value={telemetry.rpm} unit="rpm" size="sm" />
              <RealtimeValue label="Muestreo" value="1000" unit="Hz" size="sm" />
              <RealtimeValue label="RMS" value={telemetry.vibrationRms.toFixed(2)} unit={unit} size="sm" />
              <RealtimeValue label="Peak" value={telemetry.vibrationPeak.toFixed(2)} unit={unit} size="sm" />
            </div>
          </Panel>

          <div className="grid gap-3 lg:grid-cols-2">
            <Panel title="Componentes principales">
              <HarmonicsTable harmonics={telemetry.harmonics} unit={unit} />
            </Panel>
            <Panel title="Vector de vibración 1×">
              <VectorBalanceChart
                size={240}
                vectors={[
                  {
                    key: "x1",
                    label: "1× vibración",
                    vector: { amplitude: telemetry.harmonics.x1.amplitude, angle: telemetry.harmonics.x1.phase },
                    kind: "initial",
                    unit,
                  },
                  {
                    key: "x2",
                    label: "2× vibración",
                    vector: { amplitude: telemetry.harmonics.x2.amplitude, angle: telemetry.harmonics.x2.phase },
                    kind: "trial",
                    unit,
                  },
                ]}
              />
            </Panel>
          </div>
        </div>

        <div className="min-w-0 space-y-3">
          <Panel title="Fase 1×">
            <PhaseIndicator phase={telemetry.phase} />
          </Panel>
          <Panel title="Calidad / coherencia de señal">
            <SignalQualityBar
              quality={telemetry.signalQuality}
              issues={telemetry.qualityIssues}
              minimum={settings.limits.minSignalQuality}
            />
          </Panel>
          <Panel title="Sensores">
            <SensorStatus sensors={telemetry.sensorStatus} />
          </Panel>
          <Panel title="Aceleración y temperatura" bodyClassName="grid grid-cols-2 gap-2">
            <RealtimeValue label="Aceleración" value={telemetry.acceleration.toFixed(3)} unit="g" size="sm" />
            <RealtimeValue label="Temp. sensor" value={telemetry.temperature.toFixed(1)} unit="°C" size="sm" />
          </Panel>
        </div>
      </div>
    </div>
  );
}
