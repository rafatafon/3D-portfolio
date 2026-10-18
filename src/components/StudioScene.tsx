"use client";

import { Component, Suspense, useEffect, useRef, type ReactNode } from "react";
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

export type SceneMode =
  | "loading"
  | "intro"
  | "room"
  | "entering"
  | "desktop"
  | "leaving";
type SceneProps = {
  mode: SceneMode;
  standing: boolean;
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
  standing,
  reducedMotion,
  onIntroComplete,
}: Pick<
  SceneProps,
  "mode" | "reset" | "standing" | "reducedMotion" | "onIntroComplete"
>) {
  const controls = useRef<CameraControls>(null);
  const started = useRef<number | null>(null);
  const completed = useRef(false);
  const { size, invalidate } = useThree();
  const narrow = size.width < 650;
  const home: [number, number, number] = narrow
    ? [5.1, 3.6, 6.2]
    : [6.1, 4.25, 7.4];

  useEffect(() => {
    const current = controls.current;
    if (!current) return;
    current.smoothTime = reducedMotion ? 0 : 0.6;
    started.current = null;
    completed.current = false;
    if (mode === "loading" || mode === "intro") {
      void current.setLookAt(
        narrow ? 4.7 : 5.3,
        narrow ? 2.6 : 2.8,
        narrow ? 4.4 : 4.2,
        0,
        1.25,
        0.1,
        false,
      );
      invalidate();
    } else if (mode === "entering" || mode === "desktop") {
      void current.setLookAt(
        0.08,
        2.34 + (standing ? 0.48 : 0),
        1.45,
        0.08,
        2.34 + (standing ? 0.48 : 0),
        -0.78,
        !reducedMotion,
      );
    } else {
      void current.setLookAt(
        ...((narrow ? [5.1, 3.6, 6.2] : [6.1, 4.25, 7.4]) as [
          number,
          number,
          number,
        ]),
        0,
        1.27,
        0,
        mode === "leaving" || reset > 0 ? !reducedMotion : false,
      );
    }
    // Immediate camera moves do not emit a transition-start event. Render them
    // explicitly when reduced motion or a skipped intro uses demand rendering.
    invalidate();
  }, [mode, reset, standing, reducedMotion, narrow, invalidate]);

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
      minPolarAngle={0.62}
      maxPolarAngle={1.46}
      minAzimuthAngle={-0.85}
      maxAzimuthAngle={1.3}
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
  return (
    <SceneErrorBoundary onError={props.onError}>
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
            standing={props.standing}
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
            key={String(props.standing)}
          />
          <CameraRig {...props} />
          <Ready onReady={props.onReady} onError={props.onError} />
        </Suspense>
      </Canvas>
    </SceneErrorBoundary>
  );
}
