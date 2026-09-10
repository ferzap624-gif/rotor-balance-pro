import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * MOTOR DE CÁLCULO — se ejecuta en el backend, no en la interfaz.
 * La interfaz sólo envía mediciones validadas y representa el resultado.
 * El algoritmo puede sustituirse aquí sin rediseñar ninguna pantalla.
 */

const vectorSchema = z.object({
  amplitude: z.number().nonnegative(),
  angle: z.number(),
});

const singlePlaneSchema = z.object({
  planes: z.literal(1),
  initial: vectorSchema,
  trial: vectorSchema,
  testWeight: z.object({
    mass: z.number().positive(),
    radius: z.number().positive(),
    angle: z.number(),
  }),
  correctionRadius: z.number().positive(),
});

const twoPlaneSchema = z.object({
  planes: z.literal(2),
  initialA: vectorSchema,
  initialB: vectorSchema,
  trialAonA: vectorSchema,
  trialAonB: vectorSchema,
  trialBonA: vectorSchema,
  trialBonB: vectorSchema,
  testWeightA: z.object({ mass: z.number().positive(), radius: z.number().positive(), angle: z.number() }),
  testWeightB: z.object({ mass: z.number().positive(), radius: z.number().positive(), angle: z.number() }),
  correctionRadiusA: z.number().positive(),
  correctionRadiusB: z.number().positive(),
});

const inputSchema = z.discriminatedUnion("planes", [singlePlaneSchema, twoPlaneSchema]);

type Complex = { re: number; im: number };

const pol = (amplitude: number, angleDeg: number): Complex => ({
  re: amplitude * Math.cos((angleDeg * Math.PI) / 180),
  im: amplitude * Math.sin((angleDeg * Math.PI) / 180),
});
const sub = (a: Complex, b: Complex): Complex => ({ re: a.re - b.re, im: a.im - b.im });
const mul = (a: Complex, b: Complex): Complex => ({
  re: a.re * b.re - a.im * b.im,
  im: a.re * b.im + a.im * b.re,
});
const div = (a: Complex, b: Complex): Complex => {
  const d = b.re * b.re + b.im * b.im;
  if (d === 0) return { re: 0, im: 0 };
  return { re: (a.re * b.re + a.im * b.im) / d, im: (a.im * b.re - a.re * b.im) / d };
};
const scale = (a: Complex, k: number): Complex => ({ re: a.re * k, im: a.im * k });
const abs = (a: Complex) => Math.hypot(a.re, a.im);
const arg = (a: Complex) => ((Math.atan2(a.im, a.re) * 180) / Math.PI + 360) % 360;

const round = (v: number, d = 2) => Math.round(v * 10 ** d) / 10 ** d;

export const calculateCorrection = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    const warnings: string[] = [];

    if (data.planes === 1) {
      const v0 = pol(data.initial.amplitude, data.initial.angle);
      const v1 = pol(data.trial.amplitude, data.trial.angle);
      const wt = pol(data.testWeight.mass, data.testWeight.angle);
      const delta = sub(v1, v0);

      if (abs(delta) < abs(v0) * 0.15) {
        warnings.push("La masa de prueba produjo un cambio menor al 15 %: use una masa mayor.");
      }

      // Coeficiente de influencia α = ΔV / Wt ; masa de corrección Wc = -V0 / α
      const alpha = div(delta, wt);
      const wc = abs(alpha) === 0 ? { re: 0, im: 0 } : scale(div(v0, alpha), -1);

      // Corrección del radio: m·r = constante
      const radiusFactor = data.testWeight.radius / data.correctionRadius;
      const mass = abs(wc) * radiusFactor;

      return {
        planes: 1 as const,
        planeA: { mass: round(mass), angle: round(arg(wc), 0), radius: data.correctionRadius },
        engine: "influence-coefficient-v1 (server)",
        method: "Masa de prueba — 1 plano",
        computedAt: Date.now(),
        warnings,
      };
    }

    const v0a = pol(data.initialA.amplitude, data.initialA.angle);
    const v0b = pol(data.initialB.amplitude, data.initialB.angle);
    const wa = pol(data.testWeightA.mass, data.testWeightA.angle);
    const wb = pol(data.testWeightB.mass, data.testWeightB.angle);

    const aAA = div(sub(pol(data.trialAonA.amplitude, data.trialAonA.angle), v0a), wa);
    const aBA = div(sub(pol(data.trialAonB.amplitude, data.trialAonB.angle), v0b), wa);
    const aAB = div(sub(pol(data.trialBonA.amplitude, data.trialBonA.angle), v0a), wb);
    const aBB = div(sub(pol(data.trialBonB.amplitude, data.trialBonB.angle), v0b), wb);

    // Resolver [aAA aAB; aBA aBB] · [Wa; Wb] = -[V0a; V0b]
    const det = sub(mul(aAA, aBB), mul(aAB, aBA));
    if (abs(det) < 1e-9) {
      warnings.push("Sistema mal condicionado: las masas de prueba no son independientes.");
    }
    const rhsA = scale(v0a, -1);
    const rhsB = scale(v0b, -1);
    const wCa = div(sub(mul(rhsA, aBB), mul(aAB, rhsB)), det);
    const wCb = div(sub(mul(aAA, rhsB), mul(rhsA, aBA)), det);

    const fa = data.testWeightA.radius / data.correctionRadiusA;
    const fb = data.testWeightB.radius / data.correctionRadiusB;

    return {
      planes: 2 as const,
      planeA: { mass: round(abs(wCa) * fa), angle: round(arg(wCa), 0), radius: data.correctionRadiusA },
      planeB: { mass: round(abs(wCb) * fb), angle: round(arg(wCb), 0), radius: data.correctionRadiusB },
      engine: "influence-coefficient-v1 (server)",
      method: "Coeficientes de influencia — 2 planos",
      computedAt: Date.now(),
      warnings,
    };
  });
