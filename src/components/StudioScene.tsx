"use client";

import {
  Component,
  Suspense,
  useEffect,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  CameraControls,
  CameraControlsImpl,
  ContactShadows,
  Environment,
  Lightformer,
} from "@react-three/drei";
import * as THREE from "three";
import { Desk, SaylChair } from "./DeskObjects";
import { getAmbience } from "@/lib/ambience";
import { deskOffset } from "@/lib/desk";
import {
  ENTER_FLIGHT_MS,
  LEAVE_FLIGHT_DELAY_MS,
  LEAVE_FLIGHT_MS,
  easeInOut,
} from "@/lib/transitions";

// React Three Fiber 9 still constructs a THREE.Clock, which three r183+ reports
// as deprecated on every load. Nothing here reads that clock, so route three's
// console output through its official hook and drop only that message.
// Remove once React Three Fiber creates a THREE.Timer instead.
THREE.setConsoleFunction((type, message, ...params) => {
  if (
    type === "warn" &&
    message.startsWith("THREE.Clock: This module has been deprecated")
  )
    return;
  console[type](message, ...params);
});

// camera-controls eases with a smooth damp that takes the frame delta as its
// time step. Under `frameloop="demand"` the first frame after an idle spell
// carries the whole idle time as its delta (seconds, not milliseconds), and the
// damp then lands almost on its target in that one frame: the camera snapped
// into the monitor after a pause and always snapped home when leaving the
// desktop. Clamp the step so every glide starts from rest at a plausible frame
// time (the cap only bites below 30 fps); drei takes the subclass through its
// `impl` prop.
class SteadyControls extends CameraControlsImpl {
  update(delta: number) {
    return super.update(Math.min(delta, 1 / 30));
  }
}

// A camera pose in camera-controls' terms: spherical about the orbit target.
type Pose = {
  theta: number;
  phi: number;
  radius: number;
  target: THREE.Vector3;
};
type Flight = { from: Pose; to: Pose; start: number; duration: number };
const scratch = { target: new THREE.Vector3(), position: new THREE.Vector3() };

export type SceneMode =
  | "loading"
  | "intro"
  | "room"
  | "entering"
  | "desktop"
  | "leaving";
type SceneProps = {
  mode: SceneMode;
  height: number;
  settledHeight: number;
  onHeight: (cm: number, moving: boolean) => void;
  onDeskControl: () => void;
  ambience: number;
  reset: number;
  reducedMotion: boolean;
  onEnter: () => void;
  onReady: () => void;
  onError: () => void;
  onIntroComplete: () => void;
};

function CameraRig({
  mode,
  reset,
  height,
  reducedMotion,
  onIntroComplete,
  frame,
}: Pick<
  SceneProps,
  "mode" | "reset" | "height" | "reducedMotion" | "onIntroComplete"
> & { frame: RefObject<HTMLDivElement | null> }) {
  const controls = useRef<CameraControls>(null);
  const started = useRef<number | null>(null);
  const completed = useRef(false);
  // The desk height only matters for the eye level when entering the desktop.
  // Read it through a ref so changing the height in the room never re-runs
  // the preset below and snaps the camera back to the home view.
  const heightRef = useRef(height);
  heightRef.current = height;
  const reframe = useRef<(() => void) | null>(null);
  const tracking = useRef(false);
  const flight = useRef<Flight | null>(null);
  const { size, invalidate, camera, gl } = useThree();
  const narrow = size.width < 650;
  const home: [number, number, number] = narrow
    ? [5.1, 3.6, 6.2]
    : [6.1, 4.25, 7.4];

  // The canvas fills the viewport so zooming and orbiting never crop the model.
  // Offset the projection so the desk is framed inside `.scene-frame`, whose
  // position per breakpoint lives in globals.css.
  useEffect(() => {
    const target = frame.current;
    const canvas = gl.domElement;
    if (!target) return;
    const apply = () => {
      const c = canvas.getBoundingClientRect();
      const f = target.getBoundingClientRect();
      if (!c.width || !c.height || !f.width || !f.height) return;
      const scale = c.height / f.height;
      const centerX = f.left - c.left + f.width / 2;
      const centerY = f.top - c.top + f.height / 2;
      camera.setViewOffset(
        c.width,
        c.height,
        c.width / 2 - centerX * scale,
        c.height / 2 - centerY * scale,
        c.width * scale,
        c.height * scale,
      );
      invalidate();
    };
    apply();
    reframe.current = apply;
    const observer = new ResizeObserver(apply);
    observer.observe(target);
    observer.observe(canvas);
    // When `.scene-frame` transitions (the collapsible side panel), follow it
    // every rendered frame: a ResizeObserver misses pure moves and does not
    // tick in step with the transition. The useFrame below re-applies the
    // offset and keeps the demand loop alive only while properties are running.
    const running = new Set<string>();
    let safety: ReturnType<typeof setTimeout> | undefined;
    const stop = () => {
      running.clear();
      clearTimeout(safety);
      tracking.current = false;
      apply();
    };
    const begin = (event: TransitionEvent) => {
      if (event.target !== target) return;
      running.add(event.propertyName);
      tracking.current = true;
      clearTimeout(safety);
      safety = setTimeout(stop, 1500);
      invalidate();
    };
    const end = (event: TransitionEvent) => {
      if (event.target !== target) return;
      running.delete(event.propertyName);
      if (running.size === 0) stop();
    };
    target.addEventListener("transitionrun", begin);
    target.addEventListener("transitionend", end);
    target.addEventListener("transitioncancel", end);
    return () => {
      observer.disconnect();
      target.removeEventListener("transitionrun", begin);
      target.removeEventListener("transitionend", end);
      target.removeEventListener("transitioncancel", end);
      clearTimeout(safety);
      tracking.current = false;
      reframe.current = null;
      camera.clearViewOffset();
    };
  }, [camera, gl, invalidate, size, frame]);

  useFrame(() => {
    // Runs inside R3F's frame, right before rendering, so the desk moves in the
    // same frame as the CSS transition; apply() invalidates the next frame.
    if (tracking.current) reframe.current?.();
  });

  useEffect(() => {
    const current = controls.current;
    if (!current) return;
    current.smoothTime = reducedMotion ? 0 : 0.6;
    started.current = null;
    completed.current = false;
    flight.current = null;
    type Point = [number, number, number];
    const poseOf = (position: Point, target: Point): Pose => {
      const centre = new THREE.Vector3(...target);
      const spherical = new THREE.Spherical().setFromVector3(
        new THREE.Vector3(...position).sub(centre),
      );
      return {
        theta: spherical.theta,
        phi: THREE.MathUtils.clamp(
          spherical.phi,
          current.minPolarAngle,
          current.maxPolarAngle,
        ),
        radius: spherical.radius,
        target: centre,
      };
    };
    // camera-controls animates to the exact azimuth of the requested position,
    // so after free 360° orbiting a preset could take the long way round. Aim
    // for the equivalent azimuth nearest the current one instead.
    const nearestTurn = (theta: number) =>
      theta +
      Math.round((current.azimuthAngle - theta) / (2 * Math.PI)) * 2 * Math.PI;
    const glideTo = (position: Point, target: Point, transition: boolean) => {
      const pose = poseOf(position, target);
      void current.setLookAt(...position, ...target, transition);
      void current.rotateTo(nearestTurn(pose.theta), pose.phi, transition);
    };
    // Entering and leaving are fixed-length flights, stepped in the useFrame
    // below: the camera swings around the desk in spherical space on an
    // ease-in-out curve timed to the CSS (overlay, shade, desktop) and
    // independent of the frame rate, instead of the damp's fast start and
    // long tail.
    const fly = (
      position: Point,
      target: Point,
      duration: number,
      delay = 0,
    ) => {
      const to = poseOf(position, target);
      to.theta = nearestTurn(to.theta);
      flight.current = {
        from: {
          theta: current.azimuthAngle,
          phi: current.polarAngle,
          radius: current.distance,
          target: current.getTarget(new THREE.Vector3(), false),
        },
        to,
        start: performance.now() + delay,
        duration,
      };
    };
    const eye = 2.34 + deskOffset(heightRef.current);
    const screen: [Point, Point] = [
      [0.08, eye, 1.45],
      [0.08, eye, -0.78],
    ];
    const room: [Point, Point] = [home, [0, 1.27, 0]];
    if (mode === "loading" || mode === "intro") {
      const start: Point = narrow ? [4.7, 2.6, 4.4] : [5.3, 2.8, 4.2];
      glideTo(start, [0, 1.25, 0.1], false);
    } else if (mode === "entering" && !reducedMotion) {
      fly(...screen, ENTER_FLIGHT_MS);
    } else if (mode === "entering" || mode === "desktop") {
      glideTo(...screen, false);
    } else if (mode === "leaving" && !reducedMotion) {
      fly(...room, LEAVE_FLIGHT_MS, LEAVE_FLIGHT_DELAY_MS);
    } else {
      glideTo(...room, reset > 0 ? !reducedMotion : false);
    }
    // Immediate camera moves do not emit a transition-start event. Render them
    // explicitly when reduced motion or a skipped intro uses demand rendering.
    invalidate();
  }, [mode, reset, reducedMotion, narrow, invalidate]);

  useFrame(() => {
    // Priority -2 runs ahead of drei's controls.update() at -1, so the pose
    // set here reaches the camera in the same frame.
    const current = controls.current;
    const path = flight.current;
    if (!current || !path) return;
    const progress = THREE.MathUtils.clamp(
      (performance.now() - path.start) / path.duration,
      0,
      1,
    );
    const eased = easeInOut(progress);
    const target = scratch.target
      .copy(path.from.target)
      .lerp(path.to.target, eased);
    const position = scratch.position
      .setFromSphericalCoords(
        THREE.MathUtils.lerp(path.from.radius, path.to.radius, eased),
        THREE.MathUtils.lerp(path.from.phi, path.to.phi, eased),
        THREE.MathUtils.lerp(path.from.theta, path.to.theta, eased),
      )
      .add(target);
    void current.setLookAt(
      position.x,
      position.y,
      position.z,
      target.x,
      target.y,
      target.z,
      false,
    );
    if (progress === 1) flight.current = null;
    invalidate();
  }, -2);

  useFrame(() => {
    if (mode !== "intro" || !controls.current || completed.current) return;
    const now = performance.now();
    if (started.current === null) started.current = now;
    const progress = Math.min((now - started.current) / 4000, 1);
    const eased = progress * progress * (3 - 2 * progress);
    const from = narrow ? [4.7, 2.6, 4.4] : [5.3, 2.8, 4.2];
    const x =
      THREE.MathUtils.lerp(from[0], home[0], eased) +
      Math.sin(progress * Math.PI) * 0.65;
    void controls.current.setLookAt(
      x,
      THREE.MathUtils.lerp(from[1], home[1], eased),
      THREE.MathUtils.lerp(from[2], home[2], eased),
      0,
      THREE.MathUtils.lerp(1.25, 1.27, eased),
      0.1 * (1 - eased),
      false,
    );
    if (progress === 1) {
      completed.current = true;
      onIntroComplete();
    } else invalidate();
  });

  return (
    <CameraControls
      ref={controls}
      impl={SteadyControls}
      enabled={mode === "room"}
      minDistance={5}
      maxDistance={16}
      minPolarAngle={0.15}
      maxPolarAngle={1.5}
      dollySpeed={0.4}
      truckSpeed={0}
    />
  );
}

function Ready({
  onReady,
  onError,
}: {
  onReady: () => void;
  onError: () => void;
}) {
  const { gl, scene, camera, invalidate } = useThree();
  useEffect(() => {
    let cancelled = false;
    gl.compileAsync(scene, camera)
      .then(() => {
        if (!cancelled) {
          invalidate();
          onReady();
        }
      })
      .catch(() => {
        if (!cancelled) onError();
      });
    const lost = (event: Event) => {
      event.preventDefault();
      onError();
    };
    const canvas = gl.domElement;
    canvas.addEventListener("webglcontextlost", lost);
    return () => {
      cancelled = true;
      canvas.removeEventListener("webglcontextlost", lost);
    };
  }, [gl, scene, camera, invalidate, onReady, onError]);
  return null;
}

class SceneErrorBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function StudioScene(props: SceneProps) {
  const theme = getAmbience(props.ambience);
  // Ramp the fill light and contact shadows across the upper half of the
  // range instead of stepping at 75, so dragging the mood never pops.
  const night = THREE.MathUtils.clamp((props.ambience - 50) / 50, 0, 1);
  const frame = useRef<HTMLDivElement>(null);
  return (
    <SceneErrorBoundary onError={props.onError}>
      <div className="scene-frame" ref={frame} aria-hidden="true" />
      <Canvas
        shadows={{ type: THREE.PCFShadowMap }}
        dpr={[1, 1.5]}
        frameloop="demand"
        camera={{ position: [6.1, 4.25, 7.4], fov: 35, near: 0.1, far: 60 }}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.1;
        }}
        fallback={<span>Your browser does not support the 3D workspace.</span>}
      >
        <ambientLight intensity={theme.ambient} color={theme.fill} />
        <hemisphereLight args={[theme.fill, "#716356", theme.ambient * 0.7]} />
        <directionalLight
          position={[-3, 6, 3]}
          intensity={theme.intensity}
          color={theme.light}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-4}
          shadow-camera-right={4}
          shadow-camera-top={4}
          shadow-camera-bottom={-4}
          shadow-normalBias={0.025}
          shadow-bias={-0.0002}
        />
        <directionalLight
          position={[4, 4, -3]}
          intensity={1.1 + 0.3 * night}
          color={theme.fill}
        />
        <Suspense fallback={null}>
          <Environment resolution={128} frames={1} environmentIntensity={0.5}>
            <Lightformer
              form="rect"
              intensity={3}
              position={[-4, 6, 4]}
              scale={[8, 6, 1]}
              target={[0, 1, 0]}
            />
            <Lightformer
              form="rect"
              intensity={2}
              position={[5, 4, 1]}
              scale={[3, 6, 1]}
              target={[0, 1, 0]}
            />
            <Lightformer
              form="rect"
              intensity={1.5}
              position={[0, 4, -5]}
              scale={[8, 3, 1]}
              target={[0, 1, 0]}
            />
          </Environment>
          <Desk
            waking={props.mode === "intro"}
            sleeping={props.mode === "loading"}
            height={props.height}
            onHeight={props.onHeight}
            onDeskControl={props.onDeskControl}
            reducedMotion={props.reducedMotion}
            onEnter={props.onEnter}
          />
          <SaylChair />
          <ContactShadows
            position={[0, -0.013, 0]}
            opacity={0.37 + 0.28 * night}
            scale={12}
            blur={2.3}
            far={4}
            resolution={512}
            frames={1}
            key={String(props.settledHeight)}
          />
          <CameraRig {...props} frame={frame} />
          <Ready onReady={props.onReady} onError={props.onError} />
        </Suspense>
      </Canvas>
    </SceneErrorBoundary>
  );
}
