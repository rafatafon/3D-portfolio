"use client";

import { memo, useEffect, useMemo } from "react";
import * as THREE from "three";
import { Box, textureFromCanvas, type Vec3 } from "./primitives";

// AirPods Max in Midnight, hanging on a silver headphone stand. Everything is
// procedural: squircle ear cups and knit cushions are lofted superellipses,
// the headband frame is one closed sweep (two arms that meet in a rounded Y
// above each stem), and the knit is painted on a canvas.

const shellColor = "#363c47";
const armColor = "#30343c";
const chrome = "#d3d8dc";

// Headband arc in stand-local units: an ellipse centred above the stand post.
const arcX = 0.224;
const arcY = 0.32;
const arcBase = 0.43;
// Arc angle where the arms meet above each stem, and how far the U spans.
const armEnd = 0.26;
const armSpan = 0.26;
const armGap = 0.052;

// Ear-cup outline: a superellipse with these semi-axes (cup-local x is the
// cup's width, y its height).
const cupA = 0.097;
const cupB = 0.137;
const cupN = 3.4;

function arcPoint(a: number, inset = 0) {
  const nx = Math.cos(a) / arcX;
  const ny = Math.sin(a) / arcY;
  const len = Math.hypot(nx, ny);
  return new THREE.Vector3(
    Math.cos(a) * arcX - (nx / len) * inset,
    arcBase + Math.sin(a) * arcY - (ny / len) * inset,
    0,
  );
}

function arcNormal(p: THREE.Vector3) {
  // Outward normal of the headband ellipse nearest to p.
  const a = Math.atan2((p.y - arcBase) / arcY, p.x / arcX);
  return new THREE.Vector3(
    Math.cos(a) / arcX,
    Math.sin(a) / arcY,
    0,
  ).normalize();
}

// 0 at the bottom of the Y, rising as a quarter circle to 1 where the arms
// run parallel.
function armSpread(a: number) {
  const d = Math.min(a - armEnd, Math.PI - armEnd - a) / armSpan;
  if (d <= 0) return 0;
  if (d >= 1) return 1;
  return Math.sqrt(1 - (1 - d) * (1 - d));
}

// Sweeps an elliptical cross-section along a curve. The cross-section's long
// axis (rn) follows the headband's radial direction, so the arms read as flat
// bands rather than round wires.
function sweepGeometry(
  points: THREE.Vector3[],
  closed: boolean,
  samples: number,
  rn: number,
  rb: number,
  radial = 8,
) {
  const curve = new THREE.CatmullRomCurve3(points, closed, "centripetal");
  const rings = closed ? samples : samples + 1;
  const positions: number[] = [];
  const indices: number[] = [];
  const t = new THREE.Vector3();
  const n = new THREE.Vector3();
  const b = new THREE.Vector3();
  for (let i = 0; i < rings; i++) {
    const u = i / samples;
    const p = curve.getPointAt(u);
    curve.getTangentAt(u, t);
    const r = arcNormal(p);
    b.crossVectors(t, r).normalize();
    n.crossVectors(b, t).normalize();
    for (let j = 0; j < radial; j++) {
      const th = (j / radial) * Math.PI * 2;
      positions.push(
        p.x + n.x * rn * Math.cos(th) + b.x * rb * Math.sin(th),
        p.y + n.y * rn * Math.cos(th) + b.y * rb * Math.sin(th),
        p.z + n.z * rn * Math.cos(th) + b.z * rb * Math.sin(th),
      );
    }
  }
  const segs = closed ? rings : rings - 1;
  for (let i = 0; i < segs; i++) {
    const i2 = (i + 1) % rings;
    for (let j = 0; j < radial; j++) {
      const j2 = (j + 1) % radial;
      const p00 = i * radial + j;
      const p01 = i * radial + j2;
      const p10 = i2 * radial + j;
      const p11 = i2 * radial + j2;
      indices.push(p00, p01, p10, p01, p11, p10);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function superellipse(t: number, n = cupN) {
  const c = Math.cos(t);
  const s = Math.sin(t);
  return [
    Math.sign(c) * Math.pow(Math.abs(c), 2 / n),
    Math.sign(s) * Math.pow(Math.abs(s), 2 / n),
  ];
}

// Lofts a profile of (scale, depth) pairs around the cup's superellipse
// outline: scale 1 is the full outline, depth runs along the cup's +z.
function loftGeometry(
  profile: [number, number][],
  closedProfile: boolean,
  segments: number,
  uScale = 1,
  vScale = 1,
) {
  const path = closedProfile ? [...profile, profile[0]] : profile;
  const lengths = [0];
  for (let j = 1; j < path.length; j++) {
    const ds = (path[j][0] - path[j - 1][0]) * cupB;
    const dz = path[j][1] - path[j - 1][1];
    lengths.push(lengths[j - 1] + Math.hypot(ds, dz));
  }
  const total = lengths[lengths.length - 1];
  const rows = path.length;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i <= segments; i++) {
    const [ux, uy] = superellipse((i / segments) * Math.PI * 2);
    for (let j = 0; j < rows; j++) {
      const [s, z] = path[j];
      positions.push(cupA * s * ux, cupB * s * uy, z);
      uvs.push((i / segments) * uScale, (lengths[j] / total) * vScale);
    }
  }
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < rows - 1; j++) {
      const a = i * rows + j;
      const b = (i + 1) * rows + j;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  // Weld the normals across the duplicated seams so the shading stays smooth.
  const normal = geometry.attributes.normal as THREE.BufferAttribute;
  const weld = (a: number, b: number) => {
    const x = normal.getX(a) + normal.getX(b);
    const y = normal.getY(a) + normal.getY(b);
    const z = normal.getZ(a) + normal.getZ(b);
    const len = Math.hypot(x, y, z) || 1;
    normal.setXYZ(a, x / len, y / len, z / len);
    normal.setXYZ(b, x / len, y / len, z / len);
  };
  for (let j = 0; j < rows; j++) weld(j, segments * rows + j);
  if (closedProfile)
    for (let i = 0; i <= segments; i++) weld(i * rows, i * rows + rows - 1);
  return geometry;
}

function arc(
  cs: number,
  cz: number,
  rs: number,
  rz: number,
  from: number,
  to: number,
  steps: number,
): [number, number][] {
  return Array.from({ length: steps + 1 }, (_, k) => {
    const a = from + ((to - from) * k) / steps;
    return [cs + rs * Math.cos(a), cz + rz * Math.sin(a)];
  });
}

// Shell depth: the inner face (against the cushion) and the outer rim.
const shellInner = -0.028;
const shellOuter = 0.034;
const shellDome = 0.009;
const domeEdge = 0.86;

function shellProfile(): [number, number][] {
  const dome: [number, number][] = [0.7, 0.5, 0.28, 0].map((s) => [
    s,
    shellOuter + shellDome * Math.pow(1 - (s / domeEdge) ** 2, 1.5),
  ]);
  return [
    [0, shellInner],
    [0.6, shellInner],
    ...arc(0.94, shellInner + 0.006, 0.06, 0.006, -Math.PI / 2, 0, 3),
    ...arc(
      domeEdge,
      shellOuter - 0.014,
      1 - domeEdge,
      0.014,
      0,
      Math.PI / 2,
      5,
    ),
    ...dome,
  ];
}

function cushionProfile(): [number, number][] {
  const steps = 16;
  return Array.from({ length: steps }, (_, k) => {
    const a = (k / steps) * Math.PI * 2;
    const c = Math.cos(a);
    const s = Math.sin(a);
    return [
      0.8 + 0.205 * Math.sign(c) * Math.pow(Math.abs(c), 0.6),
      -0.058 + 0.03 * Math.sign(s) * Math.pow(Math.abs(s), 0.6),
    ];
  });
}

function knitTexture() {
  const texture = textureFromCanvas(
    (ctx) => {
      ctx.fillStyle = "#45484f";
      ctx.fillRect(0, 0, 128, 128);
      // A staggered grid of tiny perforations with a lit rim on each.
      for (let row = 0; row < 16; row++) {
        for (let col = 0; col < 16; col++) {
          const x = col * 8 + (row % 2 ? 4 : 0) + 4;
          const y = row * 8 + 4;
          ctx.fillStyle = "#4f535a";
          ctx.beginPath();
          ctx.arc(x - 0.6, y - 0.6, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#24262b";
          ctx.beginPath();
          ctx.arc(x, y, 2.1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    },
    128,
    128,
  );
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function canopyGeometry() {
  const cols = 48;
  const rows = 6;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i <= cols; i++) {
    const a = armEnd + ((Math.PI - 2 * armEnd) * i) / cols;
    const f = armSpread(a);
    for (let j = 0; j <= rows; j++) {
      const v = (j / rows) * 2 - 1;
      // The mesh hangs between the arms and sags toward the middle.
      const p = arcPoint(a, 0.004 + 0.0155 * (1 - v * v) * f);
      positions.push(p.x, p.y, v * (armGap - 0.005) * f);
      uvs.push((i / cols) * 12, (j / rows) * 1.5);
    }
  }
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const a = i * (rows + 1) + j;
      const b = (i + 1) * (rows + 1) + j;
      indices.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function framePoints() {
  // Front arm from the left Y to the right Y, then the back arm returning.
  const front: THREE.Vector3[] = [];
  const u = 7;
  for (let k = 0; k <= u; k++) {
    const phi = (k / u) * (Math.PI / 2);
    const p = arcPoint(armEnd + armSpan * (1 - Math.cos(phi)));
    front.push(p.setZ(armGap * Math.sin(phi)));
  }
  const mid = 22;
  for (let k = 1; k < mid; k++) {
    const a = armEnd + armSpan + ((Math.PI - 2 * (armEnd + armSpan)) * k) / mid;
    front.push(arcPoint(a).setZ(armGap));
  }
  for (let k = u; k >= 0; k--) {
    const phi = (k / u) * (Math.PI / 2);
    const p = arcPoint(Math.PI - armEnd - armSpan * (1 - Math.cos(phi)));
    front.push(p.setZ(armGap * Math.sin(phi)));
  }
  const back = front
    .slice(1, -1)
    .reverse()
    .map((p) => p.clone().setZ(-p.z));
  return [...front, ...back];
}

function housingPoints(side: number) {
  return Array.from({ length: 7 }, (_, k) => {
    const a = (armEnd + 0.012) * (1 - k / 6);
    const p = arcPoint(side === 1 ? a : Math.PI - a);
    return p;
  });
}

function tubeGeometry(points: Vec3[], radius: number, segments = 28) {
  return new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))),
    segments,
    radius,
    6,
    false,
  );
}

function Tube({
  points,
  radius,
  color,
  metalness = 0,
  roughness = 0.45,
}: {
  points: Vec3[];
  radius: number;
  color: string;
  metalness?: number;
  roughness?: number;
}) {
  const geometry = useMemo(
    () => tubeGeometry(points, radius),
    [points, radius],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial
        color={color}
        metalness={metalness}
        roughness={roughness}
      />
    </mesh>
  );
}

const postPoints: Vec3[] = [
  [0, 0.038, 0],
  [0, 0.36, 0],
  [0, 0.723, 0],
];
const cradlePoints: Vec3[] = [
  [-0.057, 0.711, 0],
  [-0.028, 0.721, 0],
  [0, 0.724, 0],
  [0.028, 0.721, 0],
  [0.057, 0.711, 0],
];

export const AirPodsMax = memo(function AirPodsMax() {
  const parts = useMemo(() => {
    const knit = knitTexture();
    const shell = loftGeometry(shellProfile(), false, 32);
    const cushion = loftGeometry(cushionProfile(), true, 32, 14, 4);
    const outline = new THREE.Shape(
      Array.from({ length: 33 }, (_, i) => {
        const [x, y] = superellipse((i / 32) * Math.PI * 2);
        return new THREE.Vector2(x * cupA * 0.62, y * cupB * 0.62);
      }),
    );
    const lining = new THREE.ShapeGeometry(outline);
    const liningUv = lining.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < liningUv.count; i++)
      liningUv.setXY(i, liningUv.getX(i) * 18, liningUv.getY(i) * 18);
    const frame = sweepGeometry(framePoints(), true, 96, 0.012, 0.0055);
    const housings = [1, -1].map((side) =>
      sweepGeometry(housingPoints(side), false, 10, 0.012, 0.0075),
    );
    const canopy = canopyGeometry();
    return { knit, shell, cushion, lining, frame, housings, canopy };
  }, []);
  useEffect(
    () => () => {
      const { housings, ...rest } = parts;
      Object.values(rest).forEach((part) => part.dispose());
      housings.forEach((part) => part.dispose());
    },
    [parts],
  );

  return (
    <group
      name="AirPods Max on stand"
      position={[1.46, 1.69, -0.38]}
      rotation={[0, -0.16, 0]}
    >
      {/* Elliptical weighted base and a post that ends below the canopy. */}
      <mesh
        position={[0, 0.023, 0]}
        scale={[1.35, 1, 1]}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[0.147, 0.151, 0.03, 64]} />
        <meshPhysicalMaterial
          color="#dce0e2"
          metalness={0.65}
          roughness={0.3}
          clearcoat={0.25}
        />
      </mesh>
      <mesh position={[0, 0.01, 0]} scale={[1.35, 1, 1]}>
        <cylinderGeometry args={[0.14, 0.14, 0.008, 64]} />
        <meshStandardMaterial color="#44474a" roughness={1} />
      </mesh>
      <Tube
        points={postPoints}
        radius={0.011}
        color="#c4cbd0"
        metalness={1}
        roughness={0.15}
      />
      {/* The curved cradle follows the underside of the canopy; it cannot poke through it. */}
      <Tube
        points={cradlePoints}
        radius={0.007}
        color="#858b91"
        metalness={0.35}
        roughness={0.5}
      />

      {/* Knit-mesh canopy slung between the two headband arms. */}
      <mesh geometry={parts.canopy} castShadow receiveShadow>
        <meshStandardMaterial
          color="#c9ccd4"
          map={parts.knit}
          bumpMap={parts.knit}
          bumpScale={0.6}
          roughness={0.95}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh geometry={parts.frame} castShadow receiveShadow>
        <meshStandardMaterial
          color={armColor}
          metalness={0.45}
          roughness={0.42}
        />
      </mesh>

      {[-1, 1].map((side) => (
        <group key={side}>
          {/* Band end above the telescoping chrome stem. */}
          <mesh
            geometry={parts.housings[side === 1 ? 0 : 1]}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial
              color={armColor}
              metalness={0.45}
              roughness={0.42}
            />
          </mesh>
          <mesh position={[side * arcX, arcBase - 0.002, 0]} castShadow>
            <cylinderGeometry args={[0.0105, 0.0105, 0.007, 20]} />
            <meshStandardMaterial
              color={chrome}
              metalness={0.95}
              roughness={0.2}
            />
          </mesh>
          <mesh
            position={[side * 0.2253, 0.412, 0.001]}
            rotation={[0, 0, side * -0.05]}
            castShadow
          >
            <cylinderGeometry args={[0.0062, 0.0062, 0.04, 16]} />
            <meshStandardMaterial
              color={chrome}
              metalness={0.95}
              roughness={0.2}
            />
          </mesh>
          <group
            position={[side * 0.213, 0.255, 0]}
            rotation={[0, side * -0.16, side * -0.095]}
          >
            <group rotation={[0, (side * Math.PI) / 2, 0]}>
              <mesh geometry={parts.shell} castShadow receiveShadow>
                <meshPhysicalMaterial
                  color={shellColor}
                  metalness={0.6}
                  roughness={0.45}
                  clearcoat={0.2}
                  clearcoatRoughness={0.4}
                />
              </mesh>
              <mesh geometry={parts.cushion} castShadow receiveShadow>
                <meshStandardMaterial
                  color="#d2d5dc"
                  map={parts.knit}
                  bumpMap={parts.knit}
                  bumpScale={0.5}
                  roughness={1}
                />
              </mesh>
              <mesh
                geometry={parts.lining}
                position={[0, 0, shellInner - 0.001]}
              >
                <meshStandardMaterial
                  color="#7a7d84"
                  map={parts.knit}
                  roughness={1}
                  side={THREE.DoubleSide}
                />
              </mesh>
            </group>
            {/* Chrome collar where the stem enters the cup. */}
            <mesh position={[0, cupB + 0.001, 0]} castShadow>
              <cylinderGeometry args={[0.0112, 0.0125, 0.008, 24]} />
              <meshStandardMaterial
                color={chrome}
                metalness={0.95}
                roughness={0.2}
              />
            </mesh>
            {side === 1 && (
              <>
                {/* Digital Crown (front) and noise-control button (back). */}
                <mesh position={[side * 0.003, 0.137, 0.05]} castShadow>
                  <cylinderGeometry args={[0.0105, 0.0105, 0.011, 28]} />
                  <meshStandardMaterial
                    color={shellColor}
                    metalness={0.7}
                    roughness={0.35}
                    flatShading
                  />
                </mesh>
                <Box
                  size={[0.007, 0.008, 0.026]}
                  position={[side * 0.003, 0.134, -0.05]}
                  color={shellColor}
                  radius={0.0034}
                  metalness={0.6}
                  roughness={0.4}
                />
              </>
            )}
          </group>
        </group>
      ))}
    </group>
  );
});
