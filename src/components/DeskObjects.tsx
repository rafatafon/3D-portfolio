"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { RoundedBox, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { DESK_SPEED, deskOffset } from "@/lib/desk";

type Vec3 = [number, number, number];
const white = "#e8e8e5";
const black = "#25282c";

// The monitor only responds while its screen faces the camera, so a visitor
// orbiting behind the desk cannot step inside through the back panel. The
// screen looks down its group's +z axis; a click ray travelling against that
// axis means the camera is in front. -0.4 allows roughly a 65° cone.
const screenNormal = new THREE.Vector3();
function screenFacesCamera(
  event: Pick<ThreeEvent<MouseEvent>, "eventObject" | "ray">,
) {
  event.eventObject.getWorldDirection(screenNormal);
  return screenNormal.dot(event.ray.direction) < -0.4;
}

function textureFromCanvas(
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

function woodTexture() {
  return textureFromCanvas(
    (ctx) => {
      ctx.fillStyle = "#b08257";
      ctx.fillRect(0, 0, 1024, 512);
      let seed = 42;
      const rand = () => {
        seed = (seed * 16807) % 2147483647;
        return seed / 2147483647;
      };
      for (let i = 0; i < 1800; i++) {
        const y = rand() * 512;
        ctx.strokeStyle =
          rand() > 0.5
            ? `rgba(55,28,10,${rand() * 0.18})`
            : `rgba(247,210,161,${rand() * 0.2})`;
        ctx.lineWidth = rand() * 1.6 + 0.2;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(
          260,
          y + rand() * 16,
          700,
          y - rand() * 18,
          1024,
          y + rand() * 9,
        );
        ctx.stroke();
      }
    },
    1024,
    512,
  );
}

function keyboardTexture(dark = false) {
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

function labelTexture(text: string, color = "#eee", font = "bold 68px Arial") {
  return textureFromCanvas(
    (ctx) => {
      ctx.fillStyle = color;
      ctx.font = font;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, 256, 64);
    },
    512,
    128,
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
  radius = 0.018,
  color = white,
  metalness = 0,
  roughness = 0.45,
}: {
  points: Vec3[];
  radius?: number;
  color?: string;
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

function Label({
  text,
  color,
  font,
  position,
  size,
  rotation,
}: {
  text: string;
  color?: string;
  font?: string;
  position: Vec3;
  size: [number, number];
  rotation?: Vec3;
}) {
  const map = useMemo(
    () => labelTexture(text, color, font),
    [text, color, font],
  );
  useEffect(() => () => map.dispose(), [map]);
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={size} />
      <meshBasicMaterial
        map={map}
        transparent
        toneMapped={false}
        depthWrite={false}
      />
    </mesh>
  );
}

function CurvedLabel({
  text,
  color,
  font,
  radius,
  height,
  arc,
  position,
}: {
  text: string;
  color?: string;
  font?: string;
  radius: number;
  height: number;
  arc: number;
  position: Vec3;
}) {
  // Wraps the label around a cylinder segment centred on +z, so text on a
  // curved band is not clipped the way a flat plane would be.
  const map = useMemo(
    () => labelTexture(text, color, font),
    [text, color, font],
  );
  useEffect(() => () => map.dispose(), [map]);
  return (
    <mesh position={position}>
      <cylinderGeometry
        args={[radius, radius, height, 24, 1, true, -arc / 2, arc]}
      />
      <meshBasicMaterial
        map={map}
        transparent
        toneMapped={false}
        depthWrite={false}
      />
    </mesh>
  );
}

function BentPanel({
  width,
  height,
  depth = 0,
  position,
  texture,
  screen = false,
  waking = false,
  sleeping = false,
}: {
  width: number;
  height: number;
  depth?: number;
  position: Vec3;
  texture?: THREE.Texture;
  screen?: boolean;
  waking?: boolean;
  sleeping?: boolean;
}) {
  const screenMaterial = useRef<THREE.MeshBasicMaterial>(null);
  const wakeStarted = useRef(0);
  useEffect(() => {
    wakeStarted.current = performance.now();
  }, [waking]);
  useFrame(() => {
    if (!screenMaterial.current) return;
    const brightness = sleeping
      ? 0
      : waking
        ? THREE.MathUtils.smoothstep(
            (performance.now() - wakeStarted.current) / 1000,
            2.3,
            3.5,
          ) * 0.88
        : 0.88;
    screenMaterial.current.color.setScalar(brightness);
  });
  const geometry = useMemo(() => {
    const geo = depth
      ? new THREE.BoxGeometry(width, height, depth, 64, 1, 1)
      : new THREE.PlaneGeometry(width, height, 64, 1);
    const p = geo.attributes.position;
    const radius = 2.2;
    for (let i = 0; i < p.count; i++) {
      const angle = p.getX(i) / radius;
      p.setXYZ(
        i,
        Math.sin(angle) * radius,
        p.getY(i),
        p.getZ(i) + radius * (1 - Math.cos(angle)),
      );
    }
    geo.computeVertexNormals();
    return geo;
  }, [width, height, depth]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh position={position} geometry={geometry} castShadow={!screen}>
      {screen ? (
        <meshBasicMaterial
          ref={screenMaterial}
          map={texture}
          toneMapped={false}
          color={sleeping || waking ? "#000" : "#e1e1e1"}
        />
      ) : (
        <meshStandardMaterial
          color="#16181c"
          roughness={0.38}
          metalness={0.3}
        />
      )}
    </mesh>
  );
}

const Laptop = memo(function Laptop({
  wallpaper,
  keyboard,
}: {
  wallpaper: THREE.Texture;
  keyboard: THREE.Texture;
}) {
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
      <Box
        size={[0.35, 0.003, 0.175]}
        position={[0, 0.024, 0.16]}
        color="#424448"
        radius={0.012}
        metalness={0.75}
        roughness={0.31}
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.024, -0.105]}>
        <planeGeometry args={[0.66, 0.3]} />
        <meshStandardMaterial map={keyboard} roughness={0.55} />
      </mesh>
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
      <group position={[0, 0.025, -0.282]} rotation={[-0.19, 0, 0]}>
        <Box
          size={[0.86, 0.56, 0.024]}
          position={[0, 0.28, 0]}
          color="#333539"
          radius={0.016}
          metalness={0.8}
          roughness={0.28}
        />
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

function roundedProfile(width: number, height: number, radius: number) {
  const shape = new THREE.Shape();
  const x = -width / 2,
    y = -height / 2;
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  return shape;
}

const AirPods = memo(function AirPods() {
  const parts = useMemo(() => {
    const shell = new THREE.ExtrudeGeometry(roundedProfile(0.17, 0.25, 0.069), {
      depth: 0.039,
      bevelEnabled: true,
      bevelSegments: 6,
      steps: 1,
      bevelSize: 0.012,
      bevelThickness: 0.012,
      curveSegments: 16,
    });
    shell.translate(0, 0, -0.0195);
    const cushionShape = roundedProfile(0.163, 0.245, 0.067);
    cushionShape.holes.push(roundedProfile(0.092, 0.169, 0.044));
    const cushion = new THREE.ExtrudeGeometry(cushionShape, {
      depth: 0.034,
      bevelEnabled: true,
      bevelSegments: 5,
      steps: 1,
      bevelSize: 0.008,
      bevelThickness: 0.008,
      curveSegments: 16,
    });
    cushion.translate(0, 0, -0.017);
    const lining = new THREE.ShapeGeometry(
      roundedProfile(0.12, 0.196, 0.052),
      20,
    );
    const canopy = new THREE.PlaneGeometry(Math.PI, 0.104, 64, 8);
    const positions = canopy.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const angle = positions.getX(i) + Math.PI / 2;
      const z = positions.getY(i);
      // A soft mesh sling suspended below the two structural headband rails.
      const sag = 0.018 * (1 - Math.pow(z / 0.052, 2)) * Math.sin(angle);
      positions.setXYZ(
        i,
        Math.cos(angle) * 0.224,
        0.43 + Math.sin(angle) * 0.32 - sag,
        z,
      );
    }
    canopy.computeVertexNormals();
    const knit = textureFromCanvas(
      (ctx) => {
        ctx.fillStyle = "#888a8c";
        ctx.fillRect(0, 0, 128, 128);
        for (let y = 0; y < 128; y += 4) {
          for (let x = 0; x < 128; x += 4) {
            ctx.fillStyle = (x + y) % 8 ? "#77797b" : "#999b9d";
            ctx.fillRect(x, y, 2, 3);
          }
        }
      },
      128,
      128,
    );
    knit.wrapS = knit.wrapT = THREE.RepeatWrapping;
    knit.repeat.set(8, 8);
    return { shell, cushion, lining, canopy, knit };
  }, []);
  useEffect(
    () => () => Object.values(parts).forEach((part) => part.dispose()),
    [parts],
  );
  const rail = (z: number): Vec3[] =>
    Array.from({ length: 33 }, (_, i) => {
      const a = (Math.PI * i) / 32;
      return [Math.cos(a) * 0.224, 0.43 + Math.sin(a) * 0.32, z];
    });

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
        points={[
          [0, 0.038, 0],
          [0, 0.36, 0],
          [0, 0.723, 0],
        ]}
        radius={0.011}
        color="#c4cbd0"
        metalness={1}
        roughness={0.15}
      />
      {/* The curved cradle follows the underside of the sling; it cannot poke through it. */}
      <Tube
        points={[
          [-0.057, 0.711, 0],
          [-0.028, 0.721, 0],
          [0, 0.724, 0],
          [0.028, 0.721, 0],
          [0.057, 0.711, 0],
        ]}
        radius={0.007}
        color="#858b91"
        metalness={0.35}
        roughness={0.5}
      />
      <mesh geometry={parts.canopy} castShadow>
        <meshStandardMaterial
          color="#44484b"
          map={parts.knit}
          bumpMap={parts.knit}
          bumpScale={0.0008}
          roughness={0.95}
          side={THREE.DoubleSide}
        />
      </mesh>
      <Tube
        points={rail(-0.052)}
        radius={0.009}
        color="#34383b"
        roughness={0.65}
      />
      <Tube
        points={rail(0.052)}
        radius={0.009}
        color="#34383b"
        roughness={0.65}
      />
      {[-1, 1].map((side) => (
        <group key={side}>
          {/* Polished telescoping stems meet the cup swivel above the aluminum shell. */}
          <Tube
            points={[
              [side * 0.224, 0.43, 0],
              [side * 0.224, 0.399, 0],
              [side * 0.211, 0.381, 0],
            ]}
            radius={0.008}
            color="#d1d8dd"
            metalness={1}
            roughness={0.12}
          />
          <group
            position={[side * 0.213, 0.255, 0]}
            rotation={[0, side * -0.16, side * -0.095]}
          >
            <mesh
              geometry={parts.shell}
              rotation={[0, Math.PI / 2, 0]}
              castShadow
              receiveShadow
            >
              <meshPhysicalMaterial
                color="#555d65"
                metalness={0.85}
                roughness={0.33}
                clearcoat={0.15}
              />
            </mesh>
            <mesh
              geometry={parts.cushion}
              position={[-side * 0.051, 0, 0]}
              rotation={[0, Math.PI / 2, 0]}
              castShadow
            >
              <meshStandardMaterial
                color="#414549"
                map={parts.knit}
                bumpMap={parts.knit}
                bumpScale={0.0007}
                roughness={1}
              />
            </mesh>
            <mesh
              geometry={parts.lining}
              position={[-side * 0.033, 0, 0]}
              rotation={[0, Math.PI / 2, 0]}
            >
              <meshStandardMaterial
                color="#16191d"
                map={parts.knit}
                roughness={1}
                side={THREE.DoubleSide}
              />
            </mesh>
            <mesh position={[0, 0.131, 0]} castShadow>
              <sphereGeometry args={[0.013, 16, 12]} />
              <meshStandardMaterial
                color="#929ba1"
                metalness={1}
                roughness={0.2}
              />
            </mesh>
            <Box
              size={[0.002, 0.023, 0.004]}
              position={[side * 0.032, -0.063, 0.039]}
              color="#15191d"
              radius={0.001}
            />
            {side === 1 && (
              <>
                <mesh position={[0.009, 0.134, -0.048]} castShadow>
                  <cylinderGeometry args={[0.012, 0.012, 0.011, 32]} />
                  <meshStandardMaterial
                    color="#a5adb5"
                    metalness={0.85}
                    roughness={0.25}
                  />
                </mesh>
                <Box
                  size={[0.015, 0.008, 0.031]}
                  position={[0.006, 0.133, 0.045]}
                  color="#8a949e"
                  radius={0.004}
                  metalness={0.8}
                />
              </>
            )}
          </group>
        </group>
      ))}
    </group>
  );
});

// Owala FreeSip colorway taken from the product references: a matte teal
// powder-coated body, light gray lid, periwinkle flip cap, teal carry loop,
// and a pale yellow collar ring carrying the wordmark.
const owalaTeal = "#3a7c8e";
const owalaInk = "#1f4b58";
const owalaLid = "#c8cbd6";
const owalaCap = "#5c64a6";
const owalaStrap = "#1e8087";
const owalaRing = "#ecf0d2";
const owalaButton = "#3c3e46";
const wordmarkFont =
  'bold 100px "Arial Rounded MT Bold", "Helvetica Neue", Arial, sans-serif';

function roundedRectPath(path: THREE.Path, width: number, height: number) {
  // A stadium outline: straight sides with fully rounded ends.
  const r = width / 2;
  const x = -r;
  const y = -height / 2;
  path.moveTo(x, y + r);
  path.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  path.absarc(x + width - r, y + r, r, Math.PI * 1.5, Math.PI * 2, false);
  path.lineTo(x + width, y + height - r);
  path.absarc(x + width - r, y + height - r, r, 0, Math.PI / 2, false);
  path.absarc(x + r, y + height - r, r, Math.PI / 2, Math.PI, false);
  path.lineTo(x, y + r);
}

const Owala = memo(function Owala() {
  const parts = useMemo(() => {
    // Straight-walled body with a soft foot and a shoulder that tucks in
    // under the lid collar, as on the 32 oz FreeSip.
    const body = new THREE.LatheGeometry(
      [
        new THREE.Vector2(0, 0),
        new THREE.Vector2(0.082, 0),
        new THREE.Vector2(0.098, 0.005),
        new THREE.Vector2(0.106, 0.018),
        new THREE.Vector2(0.108, 0.05),
        new THREE.Vector2(0.108, 0.47),
        new THREE.Vector2(0.106, 0.497),
        new THREE.Vector2(0.1, 0.515),
        new THREE.Vector2(0.092, 0.526),
        new THREE.Vector2(0.086, 0.53),
        new THREE.Vector2(0, 0.53),
      ],
      56,
    );
    // Bullet-shaped gray lid base; the flip cap is embedded in its top front.
    const lid = new THREE.LatheGeometry(
      [
        new THREE.Vector2(0, 0),
        new THREE.Vector2(0.095, 0),
        new THREE.Vector2(0.095, 0.015),
        new THREE.Vector2(0.093, 0.045),
        new THREE.Vector2(0.088, 0.07),
        new THREE.Vector2(0.079, 0.09),
        new THREE.Vector2(0.064, 0.107),
        new THREE.Vector2(0.042, 0.119),
        new THREE.Vector2(0.02, 0.124),
        new THREE.Vector2(0, 0.125),
      ],
      56,
    );
    // The carry loop is a flat silicone strap, so extrude a stadium outline
    // rather than sweeping a round tube.
    const outline = new THREE.Shape();
    roundedRectPath(outline, 0.106, 0.17);
    const hole = new THREE.Path();
    roundedRectPath(hole, 0.07, 0.134);
    outline.holes.push(hole);
    const strap = new THREE.ExtrudeGeometry(outline, {
      depth: 0.006,
      bevelEnabled: false,
      curveSegments: 18,
    });
    strap.translate(0, 0, -0.003);
    return { body, lid, strap };
  }, []);
  useEffect(
    () => () => Object.values(parts).forEach((geometry) => geometry.dispose()),
    [parts],
  );
  return (
    <group
      name="Teal Owala FreeSip bottle"
      position={[1.64, 1.683, 0.38]}
      rotation={[0, 0.55, 0]}
    >
      <mesh geometry={parts.body} castShadow receiveShadow>
        <meshStandardMaterial
          color={owalaTeal}
          metalness={0.12}
          roughness={0.58}
        />
      </mesh>
      {/* Wordmark printed low on the front, reading upward. */}
      <group rotation={[0, -0.3, 0]}>
        <Label
          text="owala"
          color={owalaInk}
          font={wordmarkFont}
          position={[0, 0.17, 0.1105]}
          size={[0.21, 0.0525]}
          rotation={[0, 0, Math.PI / 2]}
        />
      </group>
      {/* Pale collar ring between body and lid, embossed with the wordmark. */}
      <mesh position={[0, 0.543, 0]} castShadow>
        <cylinderGeometry args={[0.096, 0.096, 0.026, 56]} />
        <meshStandardMaterial color={owalaRing} roughness={0.6} />
      </mesh>
      <CurvedLabel
        text="owala"
        color="#d3d8b2"
        font={wordmarkFont}
        radius={0.0975}
        height={0.022}
        arc={0.9}
        position={[0, 0.543, 0]}
      />
      <group position={[0, 0.556, 0]}>
        <mesh geometry={parts.lid} castShadow>
          <meshStandardMaterial color={owalaLid} roughness={0.5} />
        </mesh>
        {/* Periwinkle flip cap seated in the top front of the lid. */}
        <mesh
          position={[0, 0.1, 0.018]}
          rotation={[0.22, 0, 0]}
          scale={[0.064, 0.046, 0.068]}
          castShadow
        >
          <sphereGeometry args={[1, 40, 28]} />
          <meshStandardMaterial color={owalaCap} roughness={0.45} />
        </mesh>
        <mesh
          position={[0, 0.115, -0.03]}
          rotation={[0, 0, Math.PI / 2]}
          castShadow
        >
          <cylinderGeometry args={[0.005, 0.005, 0.085, 16]} />
          <meshStandardMaterial color={owalaButton} roughness={0.4} />
        </mesh>
        {/* Push button under the cap's front lip. */}
        <Box
          size={[0.03, 0.026, 0.018]}
          position={[0, 0.07, 0.09]}
          color={owalaButton}
          radius={0.006}
          rotation={[0.3, 0, 0]}
          roughness={0.4}
        />
        {/* Carry loop standing behind the cap, leaning back. */}
        <mesh
          geometry={parts.strap}
          position={[0, 0.105, -0.058]}
          rotation={[-0.4, 0, 0]}
          castShadow
        >
          <meshStandardMaterial color={owalaStrap} roughness={0.7} />
        </mesh>
      </group>
    </group>
  );
});

const CoffeeMug = memo(function CoffeeMug() {
  const body = useMemo(
    () =>
      // The profile runs up the outside, over the rim, and back down the
      // inside so the mug is hollow and shows the coffee surface.
      new THREE.LatheGeometry(
        [
          new THREE.Vector2(0, 0),
          new THREE.Vector2(0.07, 0),
          new THREE.Vector2(0.079, 0.003),
          new THREE.Vector2(0.083, 0.012),
          new THREE.Vector2(0.083, 0.03),
          new THREE.Vector2(0.086, 0.07),
          new THREE.Vector2(0.09, 0.16),
          new THREE.Vector2(0.091, 0.205),
          new THREE.Vector2(0.09, 0.213),
          new THREE.Vector2(0.084, 0.213),
          new THREE.Vector2(0.082, 0.2),
          new THREE.Vector2(0.08, 0.1),
          new THREE.Vector2(0.077, 0.04),
          new THREE.Vector2(0.07, 0.03),
          new THREE.Vector2(0, 0.03),
        ],
        56,
      ),
    [],
  );
  useEffect(() => () => body.dispose(), [body]);
  return (
    <group
      name="Ceramic coffee mug"
      position={[1.3, 1.683, -0.05]}
      rotation={[0, -2.35, 0]}
    >
      <mesh geometry={body} castShadow receiveShadow>
        <meshPhysicalMaterial
          color="#f2f0ea"
          roughness={0.3}
          clearcoat={0.6}
          clearcoatRoughness={0.25}
        />
      </mesh>
      <mesh position={[0, 0.168, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.0805, 48]} />
        <meshPhysicalMaterial
          color="#2a160d"
          roughness={0.12}
          clearcoat={1}
          clearcoatRoughness={0.08}
        />
      </mesh>
      <Tube
        points={[
          [0.078, 0.172, 0],
          [0.128, 0.166, 0],
          [0.15, 0.13, 0],
          [0.15, 0.082, 0],
          [0.128, 0.05, 0],
          [0.078, 0.046, 0],
        ]}
        radius={0.012}
        color="#f2f0ea"
        roughness={0.3}
      />
    </group>
  );
});

// The small display on the desk's front edge mirrors the keypad readout. It
// keeps its own state so the desk tree does not re-render while the motor runs.
function DeskReadout({
  initial,
  register,
}: {
  initial: number;
  register: (set: (cm: number) => void) => void;
}) {
  const [cm, setCm] = useState(initial);
  useEffect(() => register(setCm), [register]);
  return (
    <Label
      text={`${cm}  ↑  ↓`}
      position={[1.45, 1.539, 0.582]}
      size={[0.19, 0.036]}
      color="#c5efff"
    />
  );
}

export const Desk = memo(function Desk({
  height,
  onHeight,
  onDeskControl,
  reducedMotion,
  onEnter,
  waking,
  sleeping,
}: {
  height: number;
  onHeight: (cm: number, moving: boolean) => void;
  onDeskControl: () => void;
  reducedMotion: boolean;
  onEnter: () => void;
  waking: boolean;
  sleeping: boolean;
}) {
  const sourceWallpaper = useTexture("/images/pro-wallpaper-portrait.jpg");
  const wallpaper = useMemo(() => {
    const image = sourceWallpaper.image as HTMLImageElement;
    // Rotate the original portrait image clockwise at its native resolution.
    return textureFromCanvas(
      (ctx) => {
        ctx.translate(image.height, 0);
        ctx.rotate(Math.PI / 2);
        ctx.drawImage(image, 0, 0);
      },
      image.height,
      image.width,
    );
  }, [sourceWallpaper]);
  useEffect(() => () => wallpaper.dispose(), [wallpaper]);
  const textures = useMemo(() => {
    wallpaper.colorSpace = THREE.SRGBColorSpace;
    const screen = textureFromCanvas(
      (ctx) => {
        const image = wallpaper.image as HTMLCanvasElement;
        const cropHeight = image.width * (540 / 1280);
        ctx.drawImage(
          image,
          0,
          (image.height - cropHeight) / 2,
          image.width,
          cropHeight,
          0,
          0,
          1280,
          540,
        );
        ctx.fillStyle = "#ffffff26";
        ctx.fillRect(0, 0, 1280, 22);
        ctx.fillStyle = "#fff";
        ctx.font = "12px Arial";
        ctx.fillText(
          "●    Finder     File     Edit     View     Go     Window     Help",
          14,
          15,
        );
        ctx.fillStyle = "#ffffff40";
        ctx.beginPath();
        ctx.roundRect(405, 475, 470, 55, 16);
        ctx.fill();
        ["#52b5f5", "#dedee5", "#84b9f3", "#ffc34b", "#4396ff", "#eee"].forEach(
          (c, i) => {
            ctx.fillStyle = c;
            ctx.beginPath();
            ctx.roundRect(422 + i * 74, 483, 39, 39, 9);
            ctx.fill();
          },
        );
        ["Selected work", "About me", "Experience"].forEach((s, i) => {
          ctx.fillStyle = "#5cbcf6";
          ctx.beginPath();
          ctx.roundRect(1172, 53 + i * 103, 56, 40, 5);
          ctx.fill();
          ctx.fillStyle = "#fff";
          ctx.font = "12px Arial";
          ctx.fillText(s, 1156, 111 + i * 103);
        });
      },
      1280,
      540,
    );
    return {
      wood: woodTexture(),
      keyboard: keyboardTexture(),
      laptopKeys: keyboardTexture(true),
      screen,
    };
  }, [wallpaper]);
  useEffect(
    () => () => Object.values(textures).forEach((texture) => texture.dispose()),
    [textures],
  );
  // Motorised height: the keypad sets a target in cm and the desk travels
  // there at a constant speed inside the frame loop, moving the top group and
  // stretching the upper leg segments imperatively so nothing re-renders.
  // The frameloop is on demand, so each moving frame requests the next one.
  const { invalidate } = useThree();
  const top = useRef<THREE.Group>(null);
  const legs = useRef<(THREE.Group | null)[]>([]);
  const current = useRef(height);
  const target = useRef(height);
  const shown = useRef(Math.round(height));
  const reported = useRef(height);
  const wasMoving = useRef(false);
  const readout = useRef<((cm: number) => void) | null>(null);
  const registerReadout = useCallback((set: (cm: number) => void) => {
    readout.current = set;
  }, []);
  useEffect(() => {
    target.current = height;
    invalidate();
  }, [height, invalidate]);
  useFrame((_, delta) => {
    const goal = target.current;
    let cm = current.current;
    if (cm !== goal) {
      const step = DESK_SPEED * Math.min(delta, 0.1);
      cm = reducedMotion
        ? goal
        : cm < goal
          ? Math.min(goal, cm + step)
          : Math.max(goal, cm - step);
      current.current = cm;
    }
    const rise = deskOffset(cm);
    if (top.current) top.current.position.y = rise;
    for (const leg of legs.current) if (leg) leg.scale.y = (0.5 + rise) / 0.5;
    const whole = Math.round(cm);
    if (whole !== shown.current) {
      shown.current = whole;
      readout.current?.(whole);
    }
    const moving = cm !== goal;
    const value = moving ? Math.round(cm * 2) / 2 : cm;
    if (value !== reported.current || (!moving && wasMoving.current)) {
      reported.current = value;
      onHeight(value, moving);
    }
    wasMoving.current = moving;
    if (moving) invalidate();
  });
  return (
    <group>
      {[-1.43, 1.43].map((x, index) => (
        <group key={x}>
          <Box
            size={[0.19, 0.7, 0.21]}
            position={[x, 0.47, -0.22]}
            color="#d7d9d9"
            metalness={0.5}
            roughness={0.35}
          />
          <Box
            size={[0.155, 0.66, 0.17]}
            position={[x, 0.96, -0.22]}
            color="#e7e8e6"
            metalness={0.35}
          />
          <group
            ref={(leg) => {
              legs.current[index] = leg;
            }}
            position={[x, 1.05, -0.22]}
          >
            <Box
              size={[0.12, 0.5, 0.13]}
              position={[0, 0.25, 0]}
              color="#f0f0ec"
              metalness={0.4}
            />
          </group>
          <Box
            size={[0.21, 0.075, 1.24]}
            position={[x, 0.075, -0.22]}
            color="#d5d7d7"
            metalness={0.5}
            roughness={0.35}
          />
          {[-0.72, 0.28].map((z) => (
            <Box
              key={z}
              size={[0.14, 0.035, 0.12]}
              position={[x, 0.025, z]}
              color="#404348"
              radius={0.012}
            />
          ))}
        </group>
      ))}
      <group ref={top}>
        <Box
          size={[3.65, 0.12, 1.62]}
          position={[0, 1.62, -0.24]}
          color="#fff"
          map={textures.wood}
          radius={0.032}
          roughness={0.42}
        />
        <Box
          size={[2.95, 0.1, 0.2]}
          position={[0, 1.49, -0.46]}
          color="#d5d8d9"
          metalness={0.4}
        />
        {/* The height controller under the front-right edge opens the keypad. */}
        <group
          name="Desk height controller"
          onClick={(event) => {
            event.stopPropagation();
            onDeskControl();
          }}
          onPointerOver={(event) => {
            event.stopPropagation();
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            document.body.style.cursor = "auto";
          }}
        >
          {/* A larger, invisible hit target: the box itself is only 4.5 cm tall. */}
          <mesh position={[1.45, 1.535, 0.5]}>
            <boxGeometry args={[0.36, 0.13, 0.2]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
          <Box
            size={[0.26, 0.045, 0.12]}
            position={[1.45, 1.54, 0.52]}
            color="#25292b"
            radius={0.012}
          />
          <DeskReadout
            initial={Math.round(height)}
            register={registerReadout}
          />
        </group>
        <Box
          size={[1.7, 0.012, 0.65]}
          position={[0.15, 1.688, 0.13]}
          color="#696760"
          radius={0.006}
          roughness={1}
        />
        <group
          name="LG curved ultrawide monitor"
          position={[0.08, 0, -0.78]}
          onClick={(event) => {
            // The monitor is opaque: stop the event before deciding, so a
            // click on its back never reaches anything behind it.
            event.stopPropagation();
            if (screenFacesCamera(event)) onEnter();
          }}
          onPointerOver={(event) => {
            event.stopPropagation();
            document.body.style.cursor = screenFacesCamera(event)
              ? "pointer"
              : "auto";
          }}
          onPointerMove={(event) => {
            event.stopPropagation();
            document.body.style.cursor = screenFacesCamera(event)
              ? "pointer"
              : "auto";
          }}
          onPointerOut={() => {
            document.body.style.cursor = "auto";
          }}
        >
          <Box
            size={[0.44, 0.032, 0.33]}
            position={[0, 1.707, -0.04]}
            color="#404246"
            radius={0.025}
            metalness={0.6}
            roughness={0.3}
          />
          <Box
            size={[0.105, 0.43, 0.095]}
            position={[0, 1.92, -0.07]}
            color="#484a4e"
            metalness={0.6}
            roughness={0.3}
          />
          <BentPanel
            width={2.16}
            height={0.95}
            depth={0.06}
            position={[0, 2.34, 0]}
          />
          <BentPanel
            width={2.105}
            height={0.887}
            position={[0, 2.35, 0.032]}
            texture={textures.screen}
            screen
            waking={waking}
            sleeping={sleeping}
          />
          <Label
            text="LG"
            position={[0, 1.887, 0.033]}
            size={[0.052, 0.014]}
            color="#c1c2c5"
          />
          <mesh position={[0.08, 1.886, 0.033]}>
            <circleGeometry args={[0.003, 8]} />
            <meshBasicMaterial color="#b0ddff" />
          </mesh>
        </group>
        <Laptop wallpaper={wallpaper} keyboard={textures.laptopKeys} />
        <Box
          size={[0.92, 0.037, 0.32]}
          position={[0.16, 1.719, 0.23]}
          color="#babfc3"
          radius={0.018}
          metalness={0.7}
          roughness={0.33}
        />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.16, 1.739, 0.23]}>
          <planeGeometry args={[0.89, 0.29]} />
          <meshStandardMaterial map={textures.keyboard} roughness={0.6} />
        </mesh>
        <mesh
          position={[0.9, 1.73, 0.24]}
          scale={[0.092, 0.035, 0.15]}
          castShadow
        >
          <sphereGeometry args={[1, 32, 20]} />
          <meshPhysicalMaterial
            color="#f7f7f5"
            roughness={0.18}
            clearcoat={0.8}
          />
        </mesh>
        <AirPods />
        <Owala />
        <CoffeeMug />
        <Tube
          points={[
            [0.08, 2.12, -0.88],
            [0.1, 1.75, -0.92],
            [0.55, 1.54, -0.92],
            [1.35, 1.53, -0.65],
          ]}
          radius={0.012}
          color="#292b2d"
        />
        <Box
          size={[0.75, 0.1, 0.14]}
          position={[0.8, 1.45, -0.73]}
          color="#45484a"
        />
      </group>
    </group>
  );
});

export const SaylChair = memo(function SaylChair() {
  // A continuous suspension mesh, narrower at the shoulders, with a bowed lumbar region.
  const lattice = useMemo(() => {
    const point = (u: number, t: number): Vec3 => {
      const width = 0.47 - 0.15 * t + 0.025 * Math.sin(t * Math.PI);
      return [
        u * width,
        0.97 + t * 0.94,
        0.39 + t * 0.15 - 0.095 * Math.sin(t * Math.PI) + 0.1 * (1 - u * u),
      ];
    };
    const pieces: THREE.BufferGeometry[] = [];
    for (let row = 0; row < 29; row++)
      pieces.push(
        tubeGeometry(
          Array.from({ length: 13 }, (_, i) => point(i / 6 - 1, row / 28)),
          0.007,
          22,
        ),
      );
    for (let col = 0; col < 31; col++)
      pieces.push(
        tubeGeometry(
          Array.from({ length: 15 }, (_, i) => point(col / 15 - 1, i / 14)),
          0.007,
          24,
        ),
      );
    const merged = mergeGeometries(pieces);
    pieces.forEach((p) => p.dispose());
    return merged;
  }, []);
  useEffect(() => () => lattice.dispose(), [lattice]);
  return (
    <group
      name="Herman Miller Sayl chair"
      position={[0.24, 0, 1.48]}
      scale={1.12}
      rotation={[0, -0.32, 0]}
    >
      <mesh position={[0, 0.47, 0]} castShadow>
        <cylinderGeometry args={[0.044, 0.052, 0.62, 24]} />
        <meshStandardMaterial
          color="#282b2e"
          metalness={0.65}
          roughness={0.22}
        />
      </mesh>
      <mesh position={[0, 0.24, 0]} castShadow>
        <cylinderGeometry args={[0.085, 0.1, 0.19, 32]} />
        <meshStandardMaterial color="#b6bdc3" metalness={1} roughness={0.15} />
      </mesh>
      {Array.from({ length: 5 }, (_, i) => {
        const a = (i * Math.PI * 2) / 5,
          x = Math.sin(a) * 0.56,
          z = Math.cos(a) * 0.56;
        return (
          <group key={i}>
            <Tube
              points={[
                [0, 0.29, 0],
                [x * 0.45, 0.22, z * 0.45],
                [x * 0.87, 0.14, z * 0.87],
                [x, 0.12, z],
              ]}
              radius={0.035}
              color="#c1c6ca"
              metalness={1}
              roughness={0.16}
            />
            <group position={[x, 0.085, z]} rotation={[0, a, 0]}>
              {[-1, 1].map((side) => (
                <mesh
                  key={side}
                  position={[side * 0.042, 0, 0]}
                  rotation={[0, 0, Math.PI / 2]}
                  castShadow
                >
                  <cylinderGeometry args={[0.073, 0.073, 0.045, 24]} />
                  <meshStandardMaterial color="#16191c" roughness={0.8} />
                </mesh>
              ))}
            </group>
          </group>
        );
      })}
      <Box
        size={[0.62, 0.12, 0.5]}
        position={[0, 0.69, 0.06]}
        color="#d6d8d7"
        radius={0.05}
        roughness={0.5}
      />
      <Box
        size={[0.94, 0.09, 0.85]}
        position={[0, 0.79, -0.015]}
        color="#eeeeea"
        radius={0.04}
        roughness={0.4}
      />
      <Box
        size={[0.93, 0.14, 0.84]}
        position={[0, 0.88, -0.02]}
        color="#85878a"
        radius={0.068}
        roughness={0.95}
      />
      {[-1, 1].map((side) => (
        <group key={side}>
          <Tube
            points={[
              [side * 0.34, 0.73, 0.22],
              [side * 0.51, 0.83, 0.2],
              [side * 0.52, 1.1, 0.14],
              [side * 0.53, 1.22, 0.07],
            ]}
            radius={0.039}
            color="#e3e5e3"
            roughness={0.43}
          />
          <Box
            size={[0.17, 0.048, 0.4]}
            position={[side * 0.53, 1.25, -0.005]}
            color="#a8aaab"
            radius={0.023}
            roughness={0.75}
          />
        </group>
      ))}
      <mesh geometry={lattice} castShadow receiveShadow>
        <meshStandardMaterial color="#a6aaad" roughness={0.68} />
      </mesh>
      <Tube
        points={[
          [0, 0.66, 0.15],
          [0, 0.76, 0.48],
          [0, 1.12, 0.57],
          [0, 1.62, 0.65],
          [0, 1.87, 0.64],
        ]}
        radius={0.046}
        color="#eff0eb"
        roughness={0.42}
      />
      {[-1, 1].map((side) => (
        <Tube
          key={side}
          points={[
            [0, 1.14, 0.57],
            [side * 0.12, 1.54, 0.63],
            [side * 0.28, 1.88, 0.6],
          ]}
          radius={0.024}
          color="#e8eae6"
          roughness={0.43}
        />
      ))}
      <mesh position={[-0.22, 0.7, -0.2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.065, 0.065, 0.08, 24]} />
        <meshStandardMaterial color="#979b9d" roughness={0.6} />
      </mesh>
      <Box
        size={[0.2, 0.025, 0.065]}
        position={[0.44, 0.72, -0.13]}
        color="#7d8284"
        radius={0.012}
      />
    </group>
  );
});
