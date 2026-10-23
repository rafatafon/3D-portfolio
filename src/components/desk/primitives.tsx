"use client";

import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";

// Shared building blocks for the procedural desk objects: a rounded box with
// the standard material, and canvas-painted textures (the scene uses no
// external 3D assets or images beyond the wallpaper; see DESIGN.md).
export type Vec3 = [number, number, number];
const white = "#e8e8e5";

export function textureFromCanvas(
  draw: (ctx: CanvasRenderingContext2D) => void,
  width = 512,
  height = 512,
) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext("2d")!);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

export function keyboardTexture(dark = false) {
  return textureFromCanvas(
    (ctx) => {
      ctx.fillStyle = dark ? "#17181b" : "#bdbec0";
      ctx.fillRect(0, 0, 1024, 384);
      const rows = [
        "esc  1  2  3  4  5  6  7  8  9  0  -  =",
        "tab  Q  W  E  R  T  Y  U  I  O  P  [  ]",
        "caps  A  S  D  F  G  H  J  K  L  ;  '  ↵",
        "shift  Z  X  C  V  B  N  M  ,  .  /  ↑  ↑",
      ];
      rows.forEach((row, y) =>
        row.split("  ").forEach((label, x) => {
          ctx.fillStyle = dark ? "#25262a" : "#f3f3f1";
          ctx.beginPath();
          ctx.roundRect(8 + x * 78, 8 + y * 75, 69, 64, 8);
          ctx.fill();
          ctx.fillStyle = dark ? "#d0d1d4" : "#64666b";
          ctx.font = "17px Arial";
          ctx.fillText(label, 20 + x * 78, 43 + y * 75);
        }),
      );
      [0, 1, 2, 9, 10, 11, 12].forEach((x) => {
        ctx.fillStyle = dark ? "#25262a" : "#f3f3f1";
        ctx.beginPath();
        ctx.roundRect(8 + x * 78, 308, 69, 65, 8);
        ctx.fill();
      });
      ctx.beginPath();
      ctx.roundRect(242, 308, 454, 65, 8);
      ctx.fill();
    },
    1024,
    384,
  );
}

export function Box({
  size,
  position,
  color = white,
  radius = 0.02,
  rotation,
  metalness = 0,
  roughness = 0.55,
  map,
}: {
  size: Vec3;
  position: Vec3;
  color?: string;
  radius?: number;
  rotation?: Vec3;
  metalness?: number;
  roughness?: number;
  map?: THREE.Texture;
}) {
  return (
    <RoundedBox
      args={size}
      radius={Math.min(radius, Math.min(...size) / 2)}
      smoothness={3}
      position={position}
      rotation={rotation}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial
        color={color}
        roughness={roughness}
        metalness={metalness}
        map={map}
      />
    </RoundedBox>
  );
}
