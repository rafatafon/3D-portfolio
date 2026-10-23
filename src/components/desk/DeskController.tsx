"use client";

import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
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

export function DeskController({
  initial,
  register,
}: {
  initial: number;
  register: (set: (cm: number) => void) => void;
}) {
  const invalidate = useThree((state) => state.invalidate);
  const textures = useMemo(
    () => ({
      body: textureFromCanvas(paintGradientBody, 8, 64),
      led: textureFromCanvas((ctx) => paintLed(ctx, initial), LED_W, LED_H),
      keys: textureFromCanvas(paintKeyGlyphs, KEY_W, KEY_H),
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
          map={textures.led}
          transparent
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
