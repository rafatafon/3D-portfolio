"use client";

import { memo, useEffect, useMemo } from "react";
import * as THREE from "three";
import { textureFromCanvas, type Vec3 } from "./primitives";

// Apple Magic Mouse: a seamless glossy white shell on a thin aluminium base,
// with the seam between them and a small grey Apple logo near the back.
//
// Every surface derives from one parametric footprint: a superellipse that
// tapers toward the front (-z), described in "mouse space" where u is across
// the width and t runs from -1 (front) to +1 (back). A point at radius r of
// that footprint satisfies |x / w(t)|^N + |t|^N = r^N, which makes the shell
// height a closed-form function of (x, z), so the logo decal can follow the
// curvature exactly.

const HALF_WIDTH = 0.09; // 0.18 wide
const HALF_LENGTH = 0.15; // 0.30 long
const N = 3.2; // superellipse exponent: rounded rectangle
const BASE_HEIGHT = 0.006; // aluminium plate
const SEAM = 0.0016; // dark gap between plate and shell
const SHELL_HEIGHT = 0.046; // peak of the arch above the seam
const SHELL_BOTTOM = BASE_HEIGHT + SEAM;

const RINGS = 8;
const SEGMENTS = 32;

// Half-width at a point along the length: narrower at the front.
const widthAt = (t: number) => HALF_WIDTH * (0.86 + 0.14 * ((t + 1) / 2));

// Arch along the length: highest a little behind centre, thin at the front.
const archAt = (t: number) => {
  const k = (t - 0.28) / 1.28;
  return 0.3 + 0.7 * Math.max(0, 1 - k * k);
};

// Cross-section from the centre (r 0) to the rim (r 1): a flat-ish crown
// that rolls over into steep sides.
const crownAt = (r: number) => Math.sqrt(Math.max(0, 1 - Math.pow(r, 2.6)));

const spow = (v: number, p: number) => Math.sign(v) * Math.pow(Math.abs(v), p);

// Footprint point at angle theta and radius r, in (x, z) local units.
function footprint(theta: number, r: number) {
  const t = r * spow(Math.sin(theta), 2 / N);
  const x = r * widthAt(t) * spow(Math.cos(theta), 2 / N);
  return { x, z: t * HALF_LENGTH, t };
}

function shellHeight(x: number, z: number) {
  const t = z / HALF_LENGTH;
  const r = Math.pow(
    Math.pow(Math.abs(x / widthAt(t)), N) + Math.pow(Math.abs(t), N),
    1 / N,
  );
  return SHELL_BOTTOM + SHELL_HEIGHT * archAt(t) * crownAt(Math.min(1, r));
}

function shellGeometry() {
  const positions: number[] = [0, shellHeight(0, 0), 0];
  const index: number[] = [];
  for (let i = 1; i <= RINGS; i++) {
    // Rings bunch up toward the rim, where the shell curves fastest.
    const r = Math.sin(((i / RINGS) * Math.PI) / 2);
    for (let j = 0; j < SEGMENTS; j++) {
      const { x, z } = footprint((j / SEGMENTS) * Math.PI * 2, r);
      positions.push(x, shellHeight(x, z), z);
    }
  }
  const at = (ring: number, seg: number) =>
    1 + (ring - 1) * SEGMENTS + (seg % SEGMENTS);
  for (let j = 0; j < SEGMENTS; j++) index.push(0, at(1, j + 1), at(1, j));
  for (let i = 1; i < RINGS; i++) {
    for (let j = 0; j < SEGMENTS; j++) {
      const a = at(i, j);
      const b = at(i, j + 1);
      const c = at(i + 1, j);
      const d = at(i + 1, j + 1);
      index.push(a, b, c, b, d, c);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setIndex(index);
  geometry.computeVertexNormals();
  return geometry;
}

// A flat slab of the footprint (scaled), from y 0 up to the given height.
function slabGeometry(scale: number, height: number, bevel: number) {
  const shape = new THREE.Shape();
  for (let j = 0; j < SEGMENTS; j++) {
    const { x, z } = footprint((j / SEGMENTS) * Math.PI * 2, scale);
    // Shape y maps to world -z after the rotation below.
    if (j === 0) shape.moveTo(x, -z);
    else shape.lineTo(x, -z);
  }
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: height - bevel * 2,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 1,
    curveSegments: 1,
  });
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, bevel, 0);
  return geometry;
}

const LOGO_SIZE = 0.032;
const LOGO_T = 0.46; // toward the back

// The logo plane, subdivided and draped onto the shell.
function logoGeometry() {
  const geometry = new THREE.PlaneGeometry(LOGO_SIZE, LOGO_SIZE, 6, 6);
  geometry.rotateX(-Math.PI / 2); // texture top faces the front (-z)
  const centreZ = LOGO_T * HALF_LENGTH;
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const z = position.getZ(i) + centreZ;
    position.setXYZ(i, x, shellHeight(x, z) + 0.0005, z);
  }
  geometry.computeVertexNormals();
  return geometry;
}

function appleLogoTexture() {
  return textureFromCanvas(
    (ctx) => {
      ctx.clearRect(0, 0, 256, 256);
      ctx.fillStyle = "#a9abaf";
      ctx.beginPath();
      ctx.moveTo(128, 96);
      ctx.bezierCurveTo(146, 82, 188, 78, 206, 110);
      ctx.bezierCurveTo(174, 128, 174, 180, 214, 194);
      ctx.bezierCurveTo(200, 230, 176, 254, 158, 252);
      ctx.bezierCurveTo(144, 252, 140, 244, 128, 244);
      ctx.bezierCurveTo(116, 244, 112, 252, 98, 252);
      ctx.bezierCurveTo(70, 252, 42, 204, 42, 162);
      ctx.bezierCurveTo(42, 116, 72, 88, 102, 88);
      ctx.bezierCurveTo(114, 88, 120, 96, 128, 96);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(130, 84);
      ctx.bezierCurveTo(130, 56, 150, 34, 172, 30);
      ctx.bezierCurveTo(172, 58, 152, 80, 130, 84);
      ctx.closePath();
      ctx.fill();
    },
    256,
    256,
  );
}

export const MagicMouse = memo(function MagicMouse({
  position,
}: {
  position: Vec3;
}) {
  const parts = useMemo(
    () => ({
      shell: shellGeometry(),
      base: slabGeometry(0.975, BASE_HEIGHT, 0.0015),
      seam: slabGeometry(0.96, SHELL_BOTTOM + 0.001, 0),
      logo: logoGeometry(),
      logoMap: appleLogoTexture(),
    }),
    [],
  );
  useEffect(
    () => () => Object.values(parts).forEach((part) => part.dispose()),
    [parts],
  );

  return (
    <group name="Magic Mouse" position={position}>
      <mesh geometry={parts.shell} castShadow>
        <meshPhysicalMaterial
          color="#f6f6f4"
          roughness={0.16}
          clearcoat={1}
          clearcoatRoughness={0.08}
        />
      </mesh>
      <mesh geometry={parts.seam}>
        <meshStandardMaterial color="#56585c" roughness={0.6} />
      </mesh>
      <mesh geometry={parts.base} castShadow>
        <meshStandardMaterial
          color="#c9cbce"
          metalness={0.85}
          roughness={0.35}
        />
      </mesh>
      <mesh geometry={parts.logo}>
        <meshStandardMaterial
          map={parts.logoMap}
          transparent
          depthWrite={false}
          roughness={0.3}
          metalness={0.2}
          polygonOffset
          polygonOffsetFactor={-2}
        />
      </mesh>
    </group>
  );
});
