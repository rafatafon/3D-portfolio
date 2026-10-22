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
  ContactShadows,
  Environment,
  Lightformer,
} from "@react-three/drei";
import * as THREE from "three";
import { Desk, SaylChair } from "./DeskObjects";
import { getAmbience } from "@/lib/ambience";
import { deskOffset } from "@/lib/desk";

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
  ambience: number;
  reset: number;
  reducedMotion: boolean;
  onEnter: () => void;
  onMusic: () => void;
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
  const reframe = useRef<(() => void) | null>(null);
  const tracking = useRef(false);
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
    // camera-controls animates to the exact azimuth of the requested position,
    // so after free 360° orbiting a preset could take the long way round. Aim
    // for the equivalent azimuth nearest the current one instead.
    const glideTo = (
      position: [number, number, number],
      target: [number, number, number],
      transition: boolean,
    ) => {
      const spherical = new THREE.Spherical().setFromVector3(
        new THREE.Vector3(...position).sub(new THREE.Vector3(...target)),
      );
      void current.setLookAt(...position, ...target, transition);
      const turns = Math.round(
        (current.azimuthAngle - spherical.theta) / (2 * Math.PI),
      );
      void current.rotateTo(
        spherical.theta + turns * 2 * Math.PI,
        spherical.phi,
        transition,
      );
    };
    if (mode === "loading" || mode === "intro") {
      const start: [number, number, number] = narrow
        ? [4.7, 2.6, 4.4]
        : [5.3, 2.8, 4.2];
      glideTo(start, [0, 1.25, 0.1], false);
    } else if (mode === "entering" || mode === "desktop") {
      const eye = 2.34 + deskOffset(height);
      glideTo([0.08, eye, 1.45], [0.08, eye, -0.78], !reducedMotion);
    } else {
      glideTo(
        home,
        [0, 1.27, 0],
        mode === "leaving" || reset > 0 ? !reducedMotion : false,
      );
    }
    // Immediate camera moves do not emit a transition-start event. Render them
    // explicitly when reduced motion or a skipped intro uses demand rendering.
    invalidate();
  }, [mode, reset, height, reducedMotion, narrow, invalidate]);

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
          intensity={props.ambience > 75 ? 1.4 : 1.1}
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
            reducedMotion={props.reducedMotion}
            onEnter={props.onEnter}
            onMusic={props.onMusic}
          />
          <SaylChair />
          <ContactShadows
            position={[0, -0.013, 0]}
            opacity={props.ambience > 75 ? 0.65 : 0.37}
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
