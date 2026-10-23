"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useFrame,
  useLoader,
  useThree,
  type ThreeEvent,
} from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { DESK_SPEED, deskOffset } from "@/lib/desk";
import { Box, textureFromCanvas, type Vec3 } from "./desk/primitives";
import { AirPodsMax } from "./desk/AirPodsMax";
import { DeskController, useGlow } from "./desk/DeskController";
import { MacBook } from "./desk/MacBook";
import { MagicKeyboard } from "./desk/MagicKeyboard";
import { MagicMouse } from "./desk/MagicMouse";
import { Owala } from "./desk/Owala";
import { paintScreenTexture } from "./desk/screenTexture";
import type { Locale } from "@/lib/i18n";

export { Box };

const white = "#e8e8e5";
// How the monitor's screen brightens under the pointer or during the arrival
// pulse, like a backlight turned up, without blowing out the open window:
// - SCREEN_LIFT: a plain multiplier, small enough that white stays under 250;
// - SCREEN_KNEE: the gain of a soft knee that lifts dark and mid tones and
//   leaves white where it is (see screenKnee);
// - SCREEN_BLEED: a cool additive backlight (linear light, fading out toward
//   white) that raises the near-black wallpaper about 25 levels.
// Lifted tones are capped just under the window's white so text keeps its
// contrast.
const SCREEN_LIFT = 0.07;
const SCREEN_KNEE = 2.2;
const SCREEN_BLEED = new THREE.Color("#9fb4cc").multiplyScalar(0.022);
const BEZEL_RIM = "#8fa4bb";
// Peak bezel rim: a little stronger in light moods, softer in the dark room.
const BEZEL_GLOW = 0.22;
const BEZEL_GLOW_DARK = 0.18;
// When the arrival pulses start after the room settles (ms): the monitor,
// then the controller; touch devices, which have no hover, get a second round.
const NUDGE_MONITOR = 1400;
const NUDGE_CONTROLLER = 1200;
const NUDGE_TOUCH_ROUND = 8500;
// The pulses play once per page load: returning from the desktop to the room
// does not replay them, a reload does.
// Which arrival pulses have played this page load, per object, so one
// playing early never starves the other.
const nudged = { monitor: false, controller: false };
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

function BentPanel({
  width,
  height,
  depth = 0,
  position,
  texture,
  screen = false,
  waking = false,
  sleeping = false,
  glowRef,
  rim = BEZEL_GLOW,
}: {
  width: number;
  height: number;
  depth?: number;
  position: Vec3;
  texture?: THREE.Texture;
  screen?: boolean;
  waking?: boolean;
  sleeping?: boolean;
  // The monitor's eased 0–1 affordance lift, shared by the bezel and the
  // screen so both ease once, in phase (Desk owns the easing).
  glowRef?: { current: number };
  // Peak emissive intensity of the bezel's rim.
  rim?: number;
}) {
  const screenMaterial = useRef<THREE.MeshBasicMaterial>(null);
  const screenGain = useMemo(() => ({ value: 1 }), []);
  const screenBleed = useMemo(() => ({ value: new THREE.Color(0) }), []);
  const screenKnee = useCallback(
    (shader: THREE.WebGLProgramParametersWithUniforms) => {
      shader.uniforms.screenGain = screenGain;
      shader.uniforms.screenBleed = screenBleed;
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "void main() {",
          "uniform float screenGain;\nuniform vec3 screenBleed;\nvoid main() {",
        )
        .replace(
          "#include <opaque_fragment>",
          "vec3 litScreen = outgoingLight * screenGain / (1.0 + (screenGain - 1.0) * outgoingLight) + screenBleed * (1.0 - outgoingLight);\noutgoingLight = min(litScreen, max(outgoingLight, vec3(0.92)));\n#include <opaque_fragment>",
        );
    },
    [screenGain, screenBleed],
  );
  const bezelMaterial = useRef<THREE.MeshStandardMaterial>(null);
  const wakeStarted = useRef(0);
  useEffect(() => {
    wakeStarted.current = performance.now();
  }, [waking]);
  useFrame(() => {
    const lift = glowRef?.current ?? 0;
    if (bezelMaterial.current)
      bezelMaterial.current.emissiveIntensity = rim * lift;
    screenGain.value = 1 + (SCREEN_KNEE - 1) * lift;
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
    screenMaterial.current.color.setScalar(
      brightness * (1 + SCREEN_LIFT * lift),
    );
    // The bleed follows the backlight, so a sleeping screen stays black.
    screenBleed.value
      .copy(SCREEN_BLEED)
      .multiplyScalar((lift * brightness) / 0.88);
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
          onBeforeCompile={screenKnee}
          toneMapped={false}
          color={sleeping || waking ? "#000" : "#e1e1e1"}
        />
      ) : (
        <meshStandardMaterial
          ref={bezelMaterial}
          color="#16181c"
          roughness={0.38}
          metalness={0.3}
          emissive={BEZEL_RIM}
          emissiveIntensity={0}
        />
      )}
    </mesh>
  );
}

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

export const Desk = memo(function Desk({
  height,
  onHeight,
  onDeskControl,
  reducedMotion,
  onEnter,
  waking,
  sleeping,
  screenDark,
  locale,
  attentive,
  monitorUsed,
  controllerUsed,
}: {
  height: number;
  onHeight: (cm: number, moving: boolean) => void;
  onDeskControl: () => void;
  reducedMotion: boolean;
  onEnter: () => void;
  waking: boolean;
  sleeping: boolean;
  screenDark: boolean;
  locale: Locale;
  // True while the visitor is in the room and can use the desk.
  attentive: boolean;
  // Whether the features behind the two objects were already used through
  // the HTML (the Explore button, the toolbar's keypad button).
  monitorUsed: boolean;
  controllerUsed: boolean;
}) {
  // Affordance for the two clickable objects: a quiet lift while the pointer
  // is over them, and once per page load, on arrival, one soft pulse each (the
  // monitor, then the controller) so first-time visitors know they do
  // something. Touch devices, which have no hover, get one more round later
  // unless the features have been used. Nothing moves at rest, and reduced
  // motion gets no pulses (hover still lifts, instantly).
  const [monitorHover, setMonitorHover] = useState(false);
  const [monitorPulse, setMonitorPulse] = useState(0);
  const [controllerHover, setControllerHover] = useState(false);
  const [controllerPulse, setControllerPulse] = useState(0);
  const used = useRef({ monitor: false, controller: false });
  const usedOutside = useRef({
    monitor: monitorUsed,
    controller: controllerUsed,
  });
  usedOutside.current = { monitor: monitorUsed, controller: controllerUsed };
  // The monitor's lift eases here once and is shared by its two panels.
  const monitorLift = useRef(0);
  useGlow(monitorHover ? 1 : 0, monitorPulse, reducedMotion, (value) => {
    monitorLift.current = value;
  });
  useEffect(() => {
    if (!attentive || reducedMotion) return;
    if (nudged.monitor && nudged.controller) return;
    const timers: number[] = [];
    const pulse = (
      key: "monitor" | "controller",
      set: (at: number) => void,
      at: number,
    ) => {
      timers.push(
        window.setTimeout(() => {
          // Counted only once a pulse actually starts, so leaving the room
          // early (or a development double-mount) does not use it up.
          nudged[key] = true;
          if (!used.current[key] && !usedOutside.current[key])
            set(performance.now());
        }, at),
      );
    };
    // A pulse that already played is not repeated; a controller pulse left
    // on its own takes the monitor's slot instead of waiting behind it.
    const monitorAt = nudged.monitor ? null : NUDGE_MONITOR;
    const controllerAt = nudged.controller
      ? null
      : monitorAt === null
        ? NUDGE_MONITOR
        : NUDGE_MONITOR + NUDGE_CONTROLLER;
    const round = (offset: number) => {
      if (monitorAt !== null)
        pulse("monitor", setMonitorPulse, monitorAt + offset);
      if (controllerAt !== null)
        pulse("controller", setControllerPulse, controllerAt + offset);
    };
    round(0);
    if (window.matchMedia("(hover: none)").matches)
      round(NUDGE_TOUCH_ROUND - NUDGE_MONITOR);
    // Only the timers are cancelled: a pulse already running finishes its
    // envelope on its own rather than snapping to rest.
    return () => timers.forEach(clearTimeout);
  }, [attentive, reducedMotion]);
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
  const textures = useMemo(() => ({ wood: woodTexture() }), []);
  // The monitor shows the desktop the visitor is about to enter: repainted
  // only when the wallpaper, mood (dark Finder chrome), or language changes.
  const { invalidate } = useThree();
  const portrait = useLoader(THREE.ImageLoader, "/images/fredy-portrait.png");
  const screen = useMemo(
    () =>
      paintScreenTexture({
        wallpaper: wallpaper.image as HTMLCanvasElement,
        portrait,
        dark: screenDark,
        locale,
      }),
    [wallpaper, portrait, screenDark, locale],
  );
  useEffect(() => {
    invalidate();
    return () => screen.dispose();
  }, [screen, invalidate]);
  useEffect(
    () => () => Object.values(textures).forEach((texture) => texture.dispose()),
    [textures],
  );
  // Motorised height: the keypad sets a target in cm and the desk travels
  // there at a constant speed inside the frame loop, moving the top group and
  // stretching the upper leg segments imperatively so nothing re-renders.
  // The frameloop is on demand, so each moving frame requests the next one.
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
            used.current.controller = true;
            onDeskControl();
          }}
          onPointerOver={(event) => {
            event.stopPropagation();
            document.body.style.cursor = "pointer";
            setControllerHover(true);
          }}
          onPointerOut={() => {
            document.body.style.cursor = "auto";
            setControllerHover(false);
          }}
        >
          {/* A larger, invisible hit target: the box itself is only 4.5 cm tall. */}
          <mesh position={[1.45, 1.535, 0.5]}>
            <boxGeometry args={[0.36, 0.13, 0.2]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
          <DeskController
            initial={Math.round(height)}
            register={registerReadout}
            glow={controllerHover ? 1 : 0}
            pulseAt={controllerPulse}
            reducedMotion={reducedMotion}
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
            if (!screenFacesCamera(event)) return;
            used.current.monitor = true;
            onEnter();
          }}
          onPointerOver={(event) => {
            event.stopPropagation();
            const facing = screenFacesCamera(event);
            document.body.style.cursor = facing ? "pointer" : "auto";
            setMonitorHover(facing);
          }}
          onPointerMove={(event) => {
            event.stopPropagation();
            const facing = screenFacesCamera(event);
            document.body.style.cursor = facing ? "pointer" : "auto";
            setMonitorHover(facing);
          }}
          onPointerOut={() => {
            document.body.style.cursor = "auto";
            setMonitorHover(false);
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
            glowRef={monitorLift}
            rim={screenDark ? BEZEL_GLOW_DARK : BEZEL_GLOW}
          />
          <BentPanel
            width={2.105}
            height={0.887}
            position={[0, 2.35, 0.032]}
            texture={screen}
            screen
            waking={waking}
            sleeping={sleeping}
            glowRef={monitorLift}
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
        <MacBook wallpaper={wallpaper} />
        <MagicKeyboard position={[0.16, 1.719, 0.23]} />
        {/* Positions are the contact point on the desk mat (its top is y 1.694). */}
        <MagicMouse position={[0.9, 1.694, 0.24]} />
        <AirPodsMax />
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
