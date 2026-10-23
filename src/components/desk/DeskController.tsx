"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Box, textureFromCanvas, type Vec3 } from "./primitives";

// The control box under the desk's front-right edge, built as a miniature of
// the HTML keypad it opens: a dark rounded body, a dotted grip, a black LED
// window with cyan seven-segment digits, and six raised keys. Only the small
// LED canvas is repainted, and only when the motor reports a new height.

const centre: Vec3 = [1.45, 1.54, 0.52];
const size: Vec3 = [0.26, 0.045, 0.12];
const face = centre[2] + size[2] / 2;

// Seven-segment patterns, segments a–g, for the digits the readout uses.
const segments: Record<string, string> = {
  "0": "abcdef",
  "1": "bc",
  "2": "abdeg",
  "3": "abcdg",
  "4": "bcfg",
  "5": "acdfg",
  "6": "acdefg",
  "7": "abc",
  "8": "abcdefg",
  "9": "abcdfg",
};

// LED canvas: the grip on the left, then the inset window.
const ledWidth = 0.088;
const ledHeight = 0.026;
const LED_W = 448;
const LED_H = 132;
const ledX = centre[0] - 0.117 + ledWidth / 2;

// Key row: six caps to the right of the window.
const keyLabels = ["up", "down", "1", "2", "3", "S"];
const keySize = 0.0175;
const keyStep = 0.0215;
const keyStart = centre[0] - 0.0155;
const keyRowWidth = keySize + keyStep * (keyLabels.length - 1);
const KEY_W = 760;
const KEY_H = Math.round((KEY_W * keySize) / keyRowWidth);

function paintGradientBody(ctx: CanvasRenderingContext2D) {
  const gradient = ctx.createLinearGradient(0, 0, 0, 64);
  gradient.addColorStop(0, "#34363c");
  gradient.addColorStop(1, "#16171a");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 8, 64);
}

function paintLed(ctx: CanvasRenderingContext2D, cm: number) {
  const scale = LED_H / ledHeight;
  ctx.clearRect(0, 0, LED_W, LED_H);
  // Grip: two columns of small dots, as on the keypad.
  ctx.fillStyle = "#6a6e77";
  for (let row = 0; row < 6; row++)
    for (let col = 0; col < 2; col++) {
      ctx.beginPath();
      ctx.arc(14 + col * 13, 33 + row * 13.5, 3.4, 0, Math.PI * 2);
      ctx.fill();
    }
  // Inset black window with a soft inner shadow.
  const left = Math.round(0.014 * scale);
  ctx.fillStyle = "#050607";
  ctx.beginPath();
  ctx.roundRect(left, 0, LED_W - left, LED_H, 22);
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 10;
  ctx.shadowColor = "#000";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 6;
  ctx.beginPath();
  ctx.roundRect(left - 5, -5, LED_W - left + 10, LED_H + 10, 26);
  ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = "#ffffff12";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(left + 1, 1, LED_W - left - 2, LED_H - 2, 21);
  ctx.stroke();

  // Digits: "888.8" cells with the unlit segments faintly visible.
  const text = cm.toFixed(1).padStart(5, " ");
  const digits = text.replace(".", "").split("");
  const w = 44;
  const h = 76;
  const bar = 9;
  const gap = 24;
  const top = (LED_H - h) / 2 - 6;
  const startX = left + 24;
  ctx.save();
  ctx.transform(1, 0, -0.09, 1, 8, 0);
  digits.forEach((digit, index) => {
    const x = startX + index * (w + gap);
    const lit = segments[digit] ?? "";
    const bars: Record<string, [number, number, number, number]> = {
      a: [x + bar * 0.6, top, w - bar * 1.2, bar],
      g: [x + bar * 0.6, top + (h - bar) / 2, w - bar * 1.2, bar],
      d: [x + bar * 0.6, top + h - bar, w - bar * 1.2, bar],
      f: [x, top + bar * 0.6, bar, h / 2 - bar * 0.9],
      b: [x + w - bar, top + bar * 0.6, bar, h / 2 - bar * 0.9],
      e: [x, top + h / 2 + bar * 0.3, bar, h / 2 - bar * 0.9],
      c: [x + w - bar, top + h / 2 + bar * 0.3, bar, h / 2 - bar * 0.9],
    };
    for (const [name, [bx, by, bw, bh]] of Object.entries(bars)) {
      const on = lit.includes(name);
      ctx.fillStyle = on ? "#e2f8ff" : "#141c21";
      ctx.shadowColor = on ? "#7fdcffcc" : "transparent";
      ctx.shadowBlur = on ? 14 : 0;
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, bh, bar / 2);
      ctx.fill();
    }
    // The decimal point sits after the third digit.
    if (index === 2) {
      ctx.fillStyle = "#e2f8ff";
      ctx.shadowColor = "#7fdcffcc";
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(x + w + gap / 2, top + h - bar / 2, bar / 2 + 2, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  ctx.restore();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#8fb2c0";
  ctx.font = "600 26px Arial, sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("cm", LED_W - 18, LED_H - 26);
}

function paintKeyGlyphs(ctx: CanvasRenderingContext2D) {
  const step = (KEY_W * keyStep) / keyRowWidth;
  const cap = KEY_H;
  ctx.clearRect(0, 0, KEY_W, KEY_H);
  ctx.fillStyle = "#eef0f2";
  ctx.strokeStyle = "#eef0f2";
  ctx.lineWidth = cap * 0.09;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.font = `700 ${Math.round(cap * 0.46)}px Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  keyLabels.forEach((label, index) => {
    const x = cap / 2 + index * step;
    const y = cap / 2;
    const s = cap * 0.13;
    if (label === "up" || label === "down") {
      const flip = label === "up" ? 1 : -1;
      ctx.beginPath();
      ctx.moveTo(x - s * 1.25, y + (s * flip) / 1.6);
      ctx.lineTo(x, y - (s * flip) / 1.6);
      ctx.lineTo(x + s * 1.25, y + (s * flip) / 1.6);
      ctx.stroke();
    } else {
      ctx.fillText(label, x, y + cap * 0.03);
    }
  });
}

// Affordance timing shared with the monitor: hover lifts ease in over about
// 0.14 s and out over 0.25 s; the arrival pulse is a 1.2 s sine swell (rise
// 0.5 s, hold 0.2 s, fall 0.5 s) to the same peak as hover.
const EASE_IN = 0.14;
const EASE_OUT = 0.25;
const PULSE_RISE = 0.5;
const PULSE_HOLD = 0.2;
export const PULSE_LENGTH = PULSE_RISE * 2 + PULSE_HOLD;

function pulseEnvelope(seconds: number) {
  if (seconds <= 0 || seconds >= PULSE_LENGTH) return 0;
  const fall = PULSE_LENGTH - seconds;
  const edge = Math.min(seconds, fall, PULSE_RISE) / PULSE_RISE;
  return 0.5 - 0.5 * Math.cos(Math.PI * edge);
}

// Drives a 0–1 glow from a hover target and an optional pulse start time
// (performance.now() ms; 0 for none), calling `apply` every frame and asking
// for frames only while the value is still changing.
export function useGlow(
  glow: number,
  pulseAt: number,
  reducedMotion: boolean,
  apply: (value: number) => void,
) {
  const invalidate = useThree((state) => state.invalidate);
  const lift = useRef(0);
  useEffect(() => {
    invalidate();
  }, [glow, pulseAt, invalidate]);
  useFrame((_, delta) => {
    const gap = glow - lift.current;
    if (Math.abs(gap) > 0.002) {
      lift.current += reducedMotion
        ? gap
        : gap *
          (1 -
            Math.exp(-Math.min(delta, 0.1) / (gap > 0 ? EASE_IN : EASE_OUT)));
      invalidate();
    } else lift.current = glow;
    let pulse = 0;
    if (pulseAt) {
      const elapsed = (performance.now() - pulseAt) / 1000;
      pulse = pulseEnvelope(elapsed);
      // One more frame past the end settles the value back to rest.
      if (elapsed < PULSE_LENGTH + 0.1) invalidate();
    }
    apply(Math.max(lift.current, pulse));
  });
}

// How much the LED brightens under the pointer or during the arrival pulse,
// and the peak opacity of the cyan halo that makes the window glow.
const LED_LIFT = 0.6;
const HALO_OPACITY = 0.55;
const haloWidth = ledWidth * 1.45;
const haloHeight = ledHeight * 2.1;

function paintHalo(ctx: CanvasRenderingContext2D) {
  // A soft cyan disc; the wider plane stretches it into an ellipse.
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, "rgba(127, 220, 255, 0.85)");
  gradient.addColorStop(0.45, "rgba(127, 220, 255, 0.4)");
  gradient.addColorStop(1, "rgba(127, 220, 255, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
}

export function DeskController({
  initial,
  register,
  glow = 0,
  pulseAt = 0,
  reducedMotion = false,
}: {
  initial: number;
  register: (set: (cm: number) => void) => void;
  // 0–1 hover target for the LED window's glow.
  glow?: number;
  // Start time (performance.now() ms) of the arrival pulse; 0 for none.
  pulseAt?: number;
  reducedMotion?: boolean;
}) {
  const invalidate = useThree((state) => state.invalidate);
  const ledMaterial = useRef<THREE.MeshBasicMaterial>(null);
  const halo = useRef<THREE.Mesh>(null);
  const haloMaterial = useRef<THREE.MeshBasicMaterial>(null);
  useGlow(glow, pulseAt, reducedMotion, (value) => {
    ledMaterial.current?.color.setScalar(1 + LED_LIFT * value);
    if (haloMaterial.current)
      haloMaterial.current.opacity = HALO_OPACITY * value;
    if (halo.current) halo.current.visible = value > 0.002;
  });
  const textures = useMemo(
    () => ({
      body: textureFromCanvas(paintGradientBody, 8, 64),
      led: textureFromCanvas((ctx) => paintLed(ctx, initial), LED_W, LED_H),
      keys: textureFromCanvas(paintKeyGlyphs, KEY_W, KEY_H),
      halo: textureFromCanvas(paintHalo, 128, 128),
    }),
    // The initial height only seeds the first paint; later heights repaint.
    [],
  );
  useEffect(
    () => () => Object.values(textures).forEach((texture) => texture.dispose()),
    [textures],
  );
  useEffect(() => {
    const canvas = textures.led.image as HTMLCanvasElement;
    const ctx = canvas.getContext("2d")!;
    let shown = initial;
    register((cm) => {
      if (cm === shown) return;
      shown = cm;
      paintLed(ctx, cm);
      textures.led.needsUpdate = true;
      invalidate();
    });
    // The register callback is stable for the life of the desk.
  }, [register, textures, invalidate]);
  return (
    <group>
      <Box
        size={size}
        position={centre}
        color="#ffffff"
        radius={0.008}
        map={textures.body}
        roughness={0.5}
      />
      <mesh position={[ledX, centre[1], face + 0.0004]}>
        <planeGeometry args={[ledWidth, ledHeight]} />
        <meshBasicMaterial
          ref={ledMaterial}
          map={textures.led}
          transparent
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>
      {/* Additive halo over the window, shown only while it glows. */}
      <mesh
        ref={halo}
        position={[ledX + 0.004, centre[1], face + 0.0009]}
        visible={false}
        renderOrder={1}
      >
        <planeGeometry args={[haloWidth, haloHeight]} />
        <meshBasicMaterial
          ref={haloMaterial}
          map={textures.halo}
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>
      {keyLabels.map((label, index) => (
        <Box
          key={label}
          size={[keySize, keySize, 0.006]}
          position={[
            keyStart + keySize / 2 + index * keyStep,
            centre[1],
            face + 0.0005,
          ]}
          color="#34363b"
          radius={0.0028}
          roughness={0.45}
        />
      ))}
      <mesh position={[keyStart + keyRowWidth / 2, centre[1], face + 0.0037]}>
        <planeGeometry args={[keyRowWidth, keySize]} />
        <meshBasicMaterial
          map={textures.keys}
          transparent
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
