"use client";

import { memo, useEffect, useMemo } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Box, textureFromCanvas } from "./primitives";

// Keyboard layout of the 14-inch MacBook Pro, in key units (u). Every row is
// 14.5u wide; rows run from the function row (0) to the bottom row (5).
type Key = {
  x: number;
  w: number;
  row: number;
  // Half-height arrow keys: "top" or "bottom" half of the row.
  half?: "top" | "bottom";
  label?: string;
  // Small symbol drawn above the label (modifiers, shifted digits).
  top?: string;
  align?: "left" | "right" | "center";
  touchId?: boolean;
};

const ROW_UNITS = 14.5;
const KEYBOARD_WIDTH = 0.66;
const UNIT = KEYBOARD_WIDTH / ROW_UNITS;
const KEYBOARD_DEPTH = UNIT * 6;
const KEYBOARD_Z = -0.105;
const KEY_GAP = 0.0068;
const KEY_HEIGHT = 0.005;
const KEY_Y = 0.0234;
const KEY_TOP = KEY_Y + KEY_HEIGHT / 2;

function buildLayout() {
  const keys: Key[] = [];
  const row = (index: number, items: Omit<Key, "x" | "row">[]) => {
    let x = 0;
    for (const item of items) {
      keys.push({ ...item, x, row: index });
      x += item.w;
    }
  };
  row(0, [
    { w: 1.5, label: "esc", align: "left" },
    ...Array.from({ length: 12 }, (_, i) => ({ w: 1, label: `F${i + 1}` })),
    { w: 1, touchId: true },
  ]);
  const digits = "1234567890";
  const shifted = "!@#$%^&*()";
  row(1, [
    { w: 1, label: "`", top: "~" },
    ...digits.split("").map((d, i) => ({ w: 1, label: d, top: shifted[i] })),
    { w: 1, label: "-", top: "_" },
    { w: 1, label: "=", top: "+" },
    { w: 1.5, label: "delete", align: "right" },
  ]);
  row(2, [
    { w: 1.5, label: "tab", align: "left" },
    ..."QWERTYUIOP".split("").map((c) => ({ w: 1, label: c })),
    { w: 1, label: "[", top: "{" },
    { w: 1, label: "]", top: "}" },
    { w: 1, label: "\\", top: "|" },
  ]);
  row(3, [
    { w: 1.8, label: "caps lock", align: "left" },
    ..."ASDFGHJKL".split("").map((c) => ({ w: 1, label: c })),
    { w: 1, label: ";", top: ":" },
    { w: 1, label: "'", top: '"' },
    { w: 1.7, label: "return", align: "right" },
  ]);
  row(4, [
    { w: 2.35, label: "shift", top: "⇧", align: "left" },
    ..."ZXCVBNM".split("").map((c) => ({ w: 1, label: c })),
    { w: 1, label: ",", top: "<" },
    { w: 1, label: ".", top: ">" },
    { w: 1, label: "/", top: "?" },
    { w: 2.15, label: "shift", top: "⇧", align: "right" },
  ]);
  row(5, [
    { w: 1, label: "globe", top: "fn", align: "left" },
    { w: 1, label: "control", top: "⌃", align: "left" },
    { w: 1, label: "option", top: "⌥", align: "left" },
    { w: 1.25, label: "command", top: "⌘", align: "right" },
    { w: 5 },
    { w: 1.25, label: "command", top: "⌘", align: "left" },
    { w: 1, label: "option", top: "⌥", align: "right" },
    { w: 1, label: "◀" },
  ]);
  const arrowX = ROW_UNITS - 2;
  keys.push({ x: arrowX, w: 1, row: 5, half: "top", label: "▲" });
  keys.push({ x: arrowX, w: 1, row: 5, half: "bottom", label: "▼" });
  keys.push({ x: arrowX + 1, w: 1, row: 5, label: "▶" });
  return keys;
}

// Centre and size of a key on the deck, in the laptop group's units.
function keyBox(key: Key) {
  const depth = key.half ? UNIT / 2 : UNIT;
  const rowZ = KEYBOARD_Z - KEYBOARD_DEPTH / 2 + key.row * UNIT;
  const z =
    key.half === "top"
      ? rowZ + UNIT / 4
      : key.half === "bottom"
        ? rowZ + (UNIT * 3) / 4
        : rowZ + UNIT / 2;
  return {
    x: -KEYBOARD_WIDTH / 2 + (key.x + key.w / 2) * UNIT,
    z,
    width: key.w * UNIT - KEY_GAP,
    depth: depth - (key.half ? KEY_GAP * 0.6 : KEY_GAP),
  };
}

const FONT = '"Helvetica Neue", Helvetica, Arial, sans-serif';

// All key legends on one transparent canvas laid over the key tops.
function legendTexture(keys: Key[]) {
  const pxPerUnit = 2048 / ROW_UNITS;
  const height = Math.round(pxPerUnit * 6);
  return textureFromCanvas(
    (ctx) => {
      ctx.clearRect(0, 0, 2048, height);
      ctx.fillStyle = "#d9dadd";
      ctx.strokeStyle = "#d9dadd";
      ctx.textBaseline = "middle";
      const gap = (KEY_GAP / UNIT) * pxPerUnit;
      for (const key of keys) {
        if (!key.label || key.touchId) continue;
        const rowH = key.half ? pxPerUnit / 2 : pxPerUnit;
        const left = key.x * pxPerUnit + gap / 2;
        const right = (key.x + key.w) * pxPerUnit - gap / 2;
        const top =
          key.row * pxPerUnit + (key.half === "bottom" ? pxPerUnit / 2 : 0);
        const cx = (left + right) / 2;
        const cy = top + rowH / 2;
        const pad = 14;
        if (key.half || "◀▶".includes(key.label)) {
          ctx.textAlign = "center";
          ctx.font = `${key.half ? 22 : 24}px ${FONT}`;
          ctx.fillText(key.label, cx, key.half ? cy : cy + 26);
          continue;
        }
        if (key.row === 0) {
          ctx.font = `25px ${FONT}`;
          if (key.align === "left") {
            ctx.textAlign = "left";
            ctx.fillText(key.label, left + pad, top + rowH - 30);
          } else {
            ctx.textAlign = "center";
            ctx.fillText(key.label, cx, top + rowH - 30);
            // A small brightness-style dot above each F-number.
            ctx.beginPath();
            ctx.arc(cx, top + 42, 7, 0, Math.PI * 2);
            ctx.lineWidth = 3;
            ctx.stroke();
          }
          continue;
        }
        if (key.label.length === 1 && key.top) {
          ctx.textAlign = "center";
          ctx.font = `34px ${FONT}`;
          ctx.fillText(key.top, cx, cy - 22);
          ctx.fillText(key.label, cx, cy + 24);
          continue;
        }
        if (key.label.length === 1) {
          ctx.textAlign = "center";
          ctx.font = `46px ${FONT}`;
          ctx.fillText(key.label, cx, cy + 2);
          continue;
        }
        // Modifiers: symbol near the top, word near the bottom, both on the
        // key's outer edge.
        const alignLeft = key.align !== "right";
        ctx.textAlign = alignLeft ? "left" : "right";
        const edge = alignLeft ? left + pad : right - pad;
        if (key.label === "globe") {
          const gx = left + pad + 15;
          const gy = top + rowH - 36;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(gx, gy, 15, 0, Math.PI * 2);
          ctx.moveTo(gx - 15, gy);
          ctx.lineTo(gx + 15, gy);
          ctx.stroke();
          ctx.beginPath();
          ctx.ellipse(gx, gy, 6.5, 15, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.textAlign = "right";
          ctx.font = `25px ${FONT}`;
          ctx.fillText("fn", right - pad, top + 34);
          continue;
        }
        if (key.top) {
          const symbolEdge =
            key.label === "command"
              ? alignLeft
                ? left + pad
                : right - pad
              : edge;
          ctx.font = `30px ${FONT}`;
          ctx.fillText(key.top, symbolEdge, top + 36);
        }
        ctx.font = `22px ${FONT}`;
        ctx.fillText(key.label, edge, top + rowH - 30);
      }
    },
    2048,
    height,
  );
}

// Apple logo silhouette (24-unit path) painted white on a transparent canvas;
// the material colour tints it.
const APPLE_PATH =
  "M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701";

function appleLogoTexture() {
  return textureFromCanvas((ctx) => {
    ctx.clearRect(0, 0, 512, 512);
    ctx.save();
    // The path spans roughly x 0.9–20.5, y 0–24.
    const scale = 512 / 24;
    ctx.translate((512 - 19.6 * scale) / 2 - 0.9 * scale, 0);
    ctx.scale(scale, scale);
    ctx.fillStyle = "#ffffff";
    ctx.fill(new Path2D(APPLE_PATH));
    ctx.restore();
  });
}

// MacBook Pro, Space Black: deck, keyboard, trackpad, and the lid with the
// wallpaper on its display. Positioned on the desk top by the Desk component.
export const MacBook = memo(function MacBook({
  wallpaper,
}: {
  wallpaper: THREE.Texture;
}) {
  const layout = useMemo(buildLayout, []);
  const keys = useMemo(() => {
    const regular = layout.filter((key) => !key.touchId);
    const geometry = new RoundedBoxGeometry(
      UNIT - KEY_GAP,
      KEY_HEIGHT,
      UNIT - KEY_GAP,
      2,
      0.0018,
    );
    const material = new THREE.MeshStandardMaterial({
      color: "#0c0c0e",
      roughness: 0.62,
      metalness: 0.1,
    });
    const mesh = new THREE.InstancedMesh(geometry, material, regular.length);
    const matrix = new THREE.Matrix4();
    regular.forEach((key, i) => {
      const box = keyBox(key);
      matrix.makeScale(
        box.width / (UNIT - KEY_GAP),
        1,
        box.depth / (UNIT - KEY_GAP),
      );
      matrix.setPosition(box.x, KEY_Y, box.z);
      mesh.setMatrixAt(i, matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }, [layout]);
  useEffect(
    () => () => {
      keys.geometry.dispose();
      (keys.material as THREE.Material).dispose();
      keys.dispose();
    },
    [keys],
  );
  const touchId = useMemo(
    () => keyBox(layout.find((key) => key.touchId)!),
    [layout],
  );
  const legends = useMemo(() => legendTexture(layout), [layout]);
  useEffect(() => () => legends.dispose(), [legends]);
  const appleLogo = useMemo(appleLogoTexture, []);
  useEffect(() => () => appleLogo.dispose(), [appleLogo]);
  const displayWallpaper = useMemo(() => {
    const texture = wallpaper.clone();
    const image = wallpaper.image as HTMLCanvasElement;
    texture.repeat.x = 0.803 / 0.5 / (image.width / image.height);
    texture.offset.x = (1 - texture.repeat.x) / 2;
    texture.needsUpdate = true;
    return texture;
  }, [wallpaper]);
  useEffect(() => () => displayWallpaper.dispose(), [displayWallpaper]);
  return (
    <group position={[-1.18, 1.72, 0.02]} rotation={[0, 0.23, 0]}>
      <Box
        size={[0.86, 0.045, 0.59]}
        position={[0, 0, 0]}
        color="#383a3d"
        radius={0.02}
        metalness={0.85}
        roughness={0.28}
      />
      {/* Trackpad: a hairline lighter chamfer under a flush glass-like top. */}
      <Box
        size={[0.3545, 0.0022, 0.1795]}
        position={[0, 0.0235, 0.16]}
        color="#6a6c71"
        radius={0.012}
        metalness={0.85}
        roughness={0.22}
      />
      <Box
        size={[0.35, 0.003, 0.175]}
        position={[0, 0.024, 0.16]}
        color="#3f4145"
        radius={0.012}
        metalness={0.75}
        roughness={0.34}
      />
      {/* Keys: one instanced mesh, legends on one transparent plane. */}
      <primitive object={keys} />
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, KEY_TOP + 0.0002, KEYBOARD_Z]}
      >
        <planeGeometry args={[KEYBOARD_WIDTH, KEYBOARD_DEPTH]} />
        <meshStandardMaterial
          map={legends}
          transparent
          depthWrite={false}
          roughness={0.6}
        />
      </mesh>
      {/* Touch ID: a slightly recessed, glossier key with a fine ring. */}
      <Box
        size={[touchId.width, KEY_HEIGHT * 0.7, touchId.depth]}
        position={[touchId.x, KEY_Y - KEY_HEIGHT * 0.15, touchId.z]}
        color="#141518"
        radius={0.0018}
        metalness={0.6}
        roughness={0.14}
      />
      {[-1, 1].map((side) => (
        <group key={side}>
          {Array.from({ length: 12 }, (_, i) => (
            <Box
              key={i}
              size={[0.036, 0.0015, 0.003]}
              position={[side * 0.373, 0.024, -0.235 + i * 0.024]}
              color="#151618"
              radius={0}
            />
          ))}
          {[0, 1].map((i) => (
            <Box
              key={i}
              size={[0.003, 0.013, 0.04]}
              position={[side * 0.431, 0, -0.16 + i * 0.09]}
              color="#111214"
              radius={0.005}
            />
          ))}
        </group>
      ))}
      <Box
        size={[0.16, 0.006, 0.008]}
        position={[0, 0.018, 0.292]}
        color="#222427"
        radius={0.003}
      />
      {/* Hinge barrel along the back edge: it closes the gap between the
         tilted lid and the deck, which otherwise shows the desk through it. */}
      <mesh
        position={[0, 0.024, -0.283]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
      >
        <cylinderGeometry args={[0.0125, 0.0125, 0.8, 24]} />
        <meshStandardMaterial
          color="#1c1d20"
          metalness={0.6}
          roughness={0.45}
        />
      </mesh>
      <group position={[0, 0.025, -0.282]} rotation={[-0.19, 0, 0]}>
        <Box
          size={[0.86, 0.56, 0.024]}
          position={[0, 0.28, 0]}
          color="#2e3034"
          radius={0.016}
          metalness={0.55}
          roughness={0.5}
        />
        {/* Glossy Apple logo on the back of the lid, facing away from the user. */}
        <mesh position={[0, 0.28, -0.0124]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[0.112, 0.112]} />
          <meshStandardMaterial
            map={appleLogo}
            color="#8d9097"
            emissive="#18191c"
            transparent
            depthWrite={false}
            metalness={0.9}
            roughness={0.14}
          />
        </mesh>
        <Box
          size={[0.829, 0.526, 0.004]}
          position={[0, 0.287, 0.014]}
          color="#08090b"
          radius={0.012}
        />
        <mesh position={[0, 0.287, 0.017]}>
          <planeGeometry args={[0.803, 0.5]} />
          <meshBasicMaterial map={displayWallpaper} toneMapped={false} />
        </mesh>
        <Box
          size={[0.093, 0.021, 0.004]}
          position={[0, 0.527, 0.02]}
          color="#070709"
          radius={0.005}
        />
        <mesh position={[0, 0.526, 0.023]}>
          <circleGeometry args={[0.0028, 12]} />
          <meshBasicMaterial color="#1d293b" />
        </mesh>
      </group>
    </group>
  );
});
