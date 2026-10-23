"use client";

import { memo, useEffect, useMemo } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { textureFromCanvas, type Vec3 } from "./primitives";

// Apple Magic Keyboard with Touch ID (compact layout): a wedge-shaped silver
// aluminium body, white keys with real relief, painted legends, and the round
// Touch ID key at the top right. Positioned on the desk top by the Desk
// component (the position is the body's centre).
//
// Draw calls: body (1), all keys merged into one geometry (1), one transparent
// legend plane (1), Touch ID ring + face (2).

const WIDTH = 0.92;
const DEPTH = 0.32;
const BACK_HEIGHT = 0.037;
const FRONT_HEIGHT = 0.024;
const BOTTOM = -BACK_HEIGHT / 2;
const FRONT_TOP = BOTTOM + FRONT_HEIGHT;
const BACK_TOP = BOTTOM + BACK_HEIGHT;
const TILT = Math.atan((BACK_TOP - FRONT_TOP) / DEPTH);

const PITCH_X = 0.061;
const PITCH_Z = 0.0495;
const GAP = 0.0085;
const ROWS = 6;
const UNITS = 14.5;
const AREA_W = UNITS * PITCH_X;
const AREA_D = ROWS * PITCH_Z;
const KEY_H = 0.0055;
const KEY_SINK = 0.0015;
const KEY_TOP = KEY_H - KEY_SINK;

const SILVER = "#babfc3";
const KEY_WHITE = "#f5f5f3";
const INK = "rgba(84, 86, 92, 1)";

type Icon = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
) => void;

type Key = {
  w: number;
  // Centered single legend (letters) or two stacked legends (shifted symbol).
  main?: string;
  top?: string;
  // Small modifier glyph and word, and where the glyph sits.
  glyph?: string;
  word?: string;
  corner?: "left" | "right";
  // Function-row pictogram plus its F-number.
  icon?: Icon;
  fn?: string;
  arrow?: "left" | "right" | "updown";
  touchId?: boolean;
  dot?: boolean;
};

// Small line pictograms for the function row, drawn with canvas paths so they
// do not depend on which symbol fonts the browser has.
const sun =
  (rays: number): Icon =>
  (ctx, x, y, s) => {
    ctx.beginPath();
    ctx.arc(x, y, s * 0.2, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * s * 0.32, y + Math.sin(a) * s * 0.32);
      ctx.lineTo(
        x + Math.cos(a) * s * (0.32 + rays),
        y + Math.sin(a) * s * (0.32 + rays),
      );
      ctx.stroke();
    }
  };
const mission: Icon = (ctx, x, y, s) => {
  ctx.strokeRect(x - s * 0.5, y - s * 0.3, s * 0.45, s * 0.6);
  ctx.strokeRect(x + s * 0.08, y - s * 0.3, s * 0.42, s * 0.25);
  ctx.strokeRect(x + s * 0.08, y + s * 0.05, s * 0.42, s * 0.25);
};
const search: Icon = (ctx, x, y, s) => {
  ctx.beginPath();
  ctx.arc(x - s * 0.08, y - s * 0.08, s * 0.25, 0, Math.PI * 2);
  ctx.moveTo(x + s * 0.1, y + s * 0.1);
  ctx.lineTo(x + s * 0.35, y + s * 0.35);
  ctx.stroke();
};
const mic: Icon = (ctx, x, y, s) => {
  ctx.beginPath();
  ctx.roundRect(x - s * 0.12, y - s * 0.42, s * 0.24, s * 0.5, s * 0.12);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y - s * 0.02, s * 0.25, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.moveTo(x, y + s * 0.23);
  ctx.lineTo(x, y + s * 0.4);
  ctx.stroke();
};
const moon: Icon = (ctx, x, y, s) => {
  ctx.beginPath();
  ctx.arc(x, y, s * 0.32, 0.35 * Math.PI, 1.65 * Math.PI);
  ctx.arc(
    x + s * 0.2,
    y - s * 0.08,
    s * 0.26,
    1.35 * Math.PI,
    0.5 * Math.PI,
    true,
  );
  ctx.closePath();
  ctx.stroke();
};
const triangle = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  dir: 1 | -1,
) => {
  ctx.beginPath();
  ctx.moveTo(x - dir * s * 0.18, y - s * 0.2);
  ctx.lineTo(x + dir * s * 0.18, y);
  ctx.lineTo(x - dir * s * 0.18, y + s * 0.2);
  ctx.closePath();
  ctx.stroke();
};
const rewind: Icon = (ctx, x, y, s) => {
  triangle(ctx, x - s * 0.16, y, s, -1);
  triangle(ctx, x + s * 0.16, y, s, -1);
};
const forward: Icon = (ctx, x, y, s) => {
  triangle(ctx, x - s * 0.16, y, s, 1);
  triangle(ctx, x + s * 0.16, y, s, 1);
};
const playPause: Icon = (ctx, x, y, s) => {
  triangle(ctx, x - s * 0.16, y, s, 1);
  ctx.beginPath();
  ctx.moveTo(x + s * 0.16, y - s * 0.2);
  ctx.lineTo(x + s * 0.16, y + s * 0.2);
  ctx.moveTo(x + s * 0.3, y - s * 0.2);
  ctx.lineTo(x + s * 0.3, y + s * 0.2);
  ctx.stroke();
};
const speaker =
  (waves: number, muted = false): Icon =>
  (ctx, x, y, s) => {
    const left = x - s * 0.3;
    ctx.beginPath();
    ctx.moveTo(left, y - s * 0.1);
    ctx.lineTo(left + s * 0.12, y - s * 0.1);
    ctx.lineTo(left + s * 0.28, y - s * 0.26);
    ctx.lineTo(left + s * 0.28, y + s * 0.26);
    ctx.lineTo(left + s * 0.12, y + s * 0.1);
    ctx.lineTo(left, y + s * 0.1);
    ctx.closePath();
    ctx.stroke();
    for (let i = 1; i <= waves; i++) {
      ctx.beginPath();
      ctx.arc(
        left + s * 0.28,
        y,
        s * 0.12 * i + s * 0.04,
        -0.3 * Math.PI,
        0.3 * Math.PI,
      );
      ctx.stroke();
    }
    if (muted) {
      ctx.beginPath();
      ctx.moveTo(left - s * 0.06, y - s * 0.32);
      ctx.lineTo(left + s * 0.5, y + s * 0.32);
      ctx.stroke();
    }
  };
const globe: Icon = (ctx, x, y, s) => {
  ctx.beginPath();
  ctx.arc(x, y, s * 0.3, 0, Math.PI * 2);
  ctx.moveTo(x - s * 0.3, y);
  ctx.lineTo(x + s * 0.3, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(x, y, s * 0.13, s * 0.3, 0, 0, Math.PI * 2);
  ctx.stroke();
};

const letters = (row: string) => row.split("").map((main) => ({ w: 1, main }));
const pairs = (row: [string, string][]) =>
  row.map(([top, main]) => ({ w: 1, top, main }));

// The compact Magic Keyboard with Touch ID, back row first; every row sums to
// 14.5 key units.
const LAYOUT: Key[][] = [
  [
    { w: 1.5, word: "esc", corner: "left" },
    { w: 1, icon: sun(0.08), fn: "F1" },
    { w: 1, icon: sun(0.16), fn: "F2" },
    { w: 1, icon: mission, fn: "F3" },
    { w: 1, icon: search, fn: "F4" },
    { w: 1, icon: mic, fn: "F5" },
    { w: 1, icon: moon, fn: "F6" },
    { w: 1, icon: rewind, fn: "F7" },
    { w: 1, icon: playPause, fn: "F8" },
    { w: 1, icon: forward, fn: "F9" },
    { w: 1, icon: speaker(0, true), fn: "F10" },
    { w: 1, icon: speaker(1), fn: "F11" },
    { w: 1, icon: speaker(3), fn: "F12" },
    { w: 1, touchId: true },
  ],
  [
    ...pairs([
      ["~", "`"],
      ["!", "1"],
      ["@", "2"],
      ["#", "3"],
      ["$", "4"],
      ["%", "5"],
      ["^", "6"],
      ["&", "7"],
      ["*", "8"],
      ["(", "9"],
      [")", "0"],
      ["_", "-"],
      ["+", "="],
    ]),
    { w: 1.5, glyph: "⌫", corner: "right" },
  ],
  [
    { w: 1.5, glyph: "⇥", corner: "left" },
    ...letters("QWERTYUIOP"),
    ...pairs([
      ["{", "["],
      ["}", "]"],
      ["|", "\\"],
    ]),
  ],
  [
    { w: 1.75, glyph: "⇪", corner: "left", dot: true },
    ...letters("ASDFGHJKL"),
    ...pairs([
      [":", ";"],
      ['"', "'"],
    ]),
    { w: 1.75, glyph: "↩", corner: "right" },
  ],
  [
    { w: 2.25, glyph: "⇧", corner: "left" },
    ...letters("ZXCVBNM"),
    ...pairs([
      ["<", ","],
      [">", "."],
      ["?", "/"],
    ]),
    { w: 2.25, glyph: "⇧", corner: "right" },
  ],
  [
    { w: 1, icon: globe },
    { w: 1, glyph: "⌃", word: "control", corner: "left" },
    { w: 1, glyph: "⌥", word: "option", corner: "left" },
    { w: 1.25, glyph: "⌘", word: "command", corner: "left" },
    { w: 5 },
    { w: 1.25, glyph: "⌘", word: "command", corner: "right" },
    { w: 1, glyph: "⌥", word: "option", corner: "right" },
    { w: 1, arrow: "left" },
    { w: 1, arrow: "updown" },
    { w: 1, arrow: "right" },
  ],
];

type Placed = Key & { x: number; z: number; kw: number; kd: number };

// Key rectangles in the plate's local frame (x right, z toward the front).
function placeKeys(): Placed[] {
  const placed: Placed[] = [];
  LAYOUT.forEach((row, r) => {
    let cursor = -AREA_W / 2;
    const z = -AREA_D / 2 + PITCH_Z * (r + 0.5);
    for (const key of row) {
      const span = key.w * PITCH_X;
      placed.push({
        ...key,
        x: cursor + span / 2,
        z,
        kw: span - GAP,
        kd: PITCH_Z - GAP,
      });
      cursor += span;
    }
  });
  return placed;
}

const SPLIT = 0.003;

function keyGeometry(keys: Placed[]) {
  const parts: THREE.BufferGeometry[] = [];
  const add = (w: number, d: number, x: number, z: number) => {
    const g = new RoundedBoxGeometry(
      w,
      KEY_H,
      d,
      2,
      Math.min(0.0024, d / 2 - 0.0001),
    );
    g.translate(x, KEY_H / 2 - KEY_SINK, z);
    parts.push(g);
  };
  for (const k of keys) {
    if (k.touchId) continue;
    if (k.arrow === "updown") {
      // The up and down arrows share one key slot as two half-height keys.
      const half = (k.kd - SPLIT) / 2;
      add(k.kw, half, k.x, k.z - (half + SPLIT) / 2);
      add(k.kw, half, k.x, k.z + (half + SPLIT) / 2);
    } else {
      add(k.kw, k.kd, k.x, k.z);
    }
  }
  const merged = mergeGeometries(parts)!;
  parts.forEach((g) => g.dispose());
  return merged;
}

const CANVAS_W = 2048;
const CANVAS_H = Math.round((CANVAS_W * AREA_D) / AREA_W);
const FONT =
  '-apple-system, "SF Pro Text", "Helvetica Neue", Arial, sans-serif';

function legendTexture(keys: Placed[]) {
  const sx = CANVAS_W / AREA_W;
  const sz = CANVAS_H / AREA_D;
  return textureFromCanvas(
    (ctx) => {
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = INK;
      ctx.strokeStyle = INK;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.textBaseline = "middle";
      for (const k of keys) {
        const cx = (k.x + AREA_W / 2) * sx;
        const cy = (k.z + AREA_D / 2) * sz;
        const w = k.kw * sx;
        const h = k.kd * sz;
        const left = cx - w / 2 + h * 0.16;
        const right = cx + w / 2 - h * 0.16;
        const text = (
          s: string,
          x: number,
          y: number,
          size: number,
          align: CanvasTextAlign,
        ) => {
          ctx.font = `${Math.round(size)}px ${FONT}`;
          ctx.textAlign = align;
          ctx.fillText(s, x, y);
        };
        ctx.lineWidth = Math.max(1.6, h * 0.035);
        if (k.main && k.top) {
          text(k.top, cx, cy - h * 0.2, h * 0.27, "center");
          text(k.main, cx, cy + h * 0.17, h * 0.3, "center");
        } else if (k.main) {
          text(k.main, cx, cy + h * 0.02, h * 0.34, "center");
        }
        if (k.icon && k.fn) {
          k.icon(ctx, cx, cy - h * 0.12, h * 0.36);
          text(k.fn, cx, cy + h * 0.26, h * 0.17, "center");
        } else if (k.icon) {
          k.icon(ctx, left + h * 0.12, cy + h * 0.2, h * 0.38);
        }
        if (k.word && k.glyph) {
          const gx = k.corner === "right" ? right : left;
          text(k.glyph, gx, cy - h * 0.2, h * 0.24, k.corner ?? "left");
          text(k.word, cx, cy + h * 0.24, h * 0.18, "center");
        } else if (k.word) {
          text(k.word, left, cy + h * 0.2, h * 0.2, "left");
        } else if (k.glyph) {
          const gx = k.corner === "right" ? right : left;
          text(k.glyph, gx, cy + h * 0.2, h * 0.26, k.corner ?? "left");
        }
        if (k.dot) {
          ctx.beginPath();
          ctx.arc(left + h * 0.04, cy - h * 0.2, h * 0.035, 0, Math.PI * 2);
          ctx.fill();
        }
        if (k.arrow) {
          const s = h * 0.13;
          const tri = (x: number, y: number, dx: number, dy: number) => {
            ctx.beginPath();
            ctx.moveTo(x + dx * s, y + dy * s);
            ctx.lineTo(
              x - dx * s * 0.6 - dy * s * 0.8,
              y - dy * s * 0.6 - dx * s * 0.8,
            );
            ctx.lineTo(
              x - dx * s * 0.6 + dy * s * 0.8,
              y - dy * s * 0.6 + dx * s * 0.8,
            );
            ctx.closePath();
            ctx.fill();
          };
          if (k.arrow === "left") tri(cx, cy + h * 0.2, -1, 0);
          if (k.arrow === "right") tri(cx, cy + h * 0.2, 1, 0);
          if (k.arrow === "updown") {
            tri(cx, cy - h * 0.25, 0, -1);
            tri(cx, cy + h * 0.25, 0, 1);
          }
        }
      }
    },
    CANVAS_W,
    CANVAS_H,
  );
}

// The side profile (a wedge, taller at the back) extruded across the width,
// with a bevel that rounds the left and right edges.
const BEVEL = 0.004;

function bodyGeometry() {
  // Profile in (s, y) where s = -z, so the back (z < 0) is at s > 0.
  const half = DEPTH / 2 - BEVEL;
  const corners: [number, number, number][] = [
    [-half, BOTTOM + BEVEL, 0.003],
    [half, BOTTOM + BEVEL, 0.007],
    [half, BACK_TOP - BEVEL, 0.012],
    [-half, FRONT_TOP - BEVEL, 0.006],
  ];
  const shape = new THREE.Shape();
  corners.forEach(([x, y, r], i) => {
    const prev = corners[(i + corners.length - 1) % corners.length];
    const next = corners[(i + 1) % corners.length];
    const towards = (p: [number, number, number]) => {
      const dx = p[0] - x;
      const dy = p[1] - y;
      const len = Math.hypot(dx, dy);
      return [x + (dx / len) * r, y + (dy / len) * r] as const;
    };
    const [ax, ay] = towards(prev);
    const [bx, by] = towards(next);
    if (i === 0) shape.moveTo(ax, ay);
    else shape.lineTo(ax, ay);
    shape.quadraticCurveTo(x, y, bx, by);
  });
  shape.closePath();
  const length = WIDTH - BEVEL * 2;
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: length,
    bevelEnabled: true,
    bevelThickness: BEVEL,
    bevelSize: BEVEL,
    bevelSegments: 4,
    curveSegments: 8,
  });
  geometry.translate(0, 0, -length / 2);
  geometry.rotateY(Math.PI / 2);
  geometry.computeVertexNormals();
  return geometry;
}

export const MagicKeyboard = memo(function MagicKeyboard({
  position,
}: {
  position: Vec3;
}) {
  const parts = useMemo(() => {
    const keys = placeKeys();
    const touch = keys.find((k) => k.touchId)!;
    return {
      body: bodyGeometry(),
      keys: keyGeometry(keys),
      legends: legendTexture(keys),
      touch: [touch.x, touch.z] as const,
    };
  }, []);
  useEffect(
    () => () => {
      parts.body.dispose();
      parts.keys.dispose();
      parts.legends.dispose();
    },
    [parts],
  );
  const [x, y, z] = position;
  const [tx, tz] = parts.touch;
  const touchRadius = (PITCH_Z - GAP) * 0.47;
  return (
    <group position={[x, y, z]}>
      <mesh geometry={parts.body} castShadow receiveShadow>
        <meshStandardMaterial color={SILVER} metalness={0.7} roughness={0.33} />
      </mesh>
      {/* The key plate follows the sloped top surface. */}
      <group
        position={[0, (FRONT_TOP + BACK_TOP) / 2, 0]}
        rotation={[TILT, 0, 0]}
      >
        <mesh geometry={parts.keys} castShadow receiveShadow>
          <meshStandardMaterial color={KEY_WHITE} roughness={0.52} />
        </mesh>
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, KEY_TOP + 0.0003, 0]}
        >
          <planeGeometry args={[AREA_W, AREA_D]} />
          <meshStandardMaterial
            map={parts.legends}
            transparent
            depthWrite={false}
            roughness={0.52}
            polygonOffset
            polygonOffsetFactor={-2}
            polygonOffsetUnits={-2}
          />
        </mesh>
        {/* Touch ID: a brushed ring around a glossy sapphire-like face. */}
        <mesh position={[tx, 0.0012, tz]} receiveShadow>
          <cylinderGeometry args={[touchRadius, touchRadius, 0.0034, 40]} />
          <meshStandardMaterial
            color="#c9cdd1"
            metalness={0.8}
            roughness={0.22}
          />
        </mesh>
        <mesh position={[tx, 0.0016, tz]}>
          <cylinderGeometry
            args={[touchRadius * 0.86, touchRadius * 0.86, 0.0036, 40]}
          />
          <meshPhysicalMaterial
            color="#e4e5e8"
            roughness={0.12}
            metalness={0.1}
            clearcoat={1}
            clearcoatRoughness={0.05}
          />
        </mesh>
      </group>
    </group>
  );
});
