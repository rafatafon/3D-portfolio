"use client";

import { memo, useEffect, useMemo } from "react";
import * as THREE from "three";
import {
  mergeGeometries,
  mergeVertices,
} from "three/addons/utils/BufferGeometryUtils.js";
import { Box, textureFromCanvas } from "./primitives";

// Owala FreeSip modelled on the owner's own bottle: a matte slate-blue body,
// a tan collar with the wordmark embossed on its side, a tall cream lid that
// climbs toward the front, a white spout cover hinged at the back on two
// coil springs, a flat sage loop framing the cover, and a coral push button.
const slate = "#353c4a";
const tan = "#b3a88f";
const cream = "#dcd3bb";
const coverWhite = "#f1efe8";
const sage = "#627a69";
const coral = "#d9534f";

// Lid dome, in lid-local units (y = 0 on the collar): a superellipse of
// revolution with a short straight wall, then tipped so the front (+z) stands
// taller than the back, as the side photo shows.
const lidRadius = 0.104;
const lidWall = 0.03;
const lidDome = 0.085;
const lidExponent = 2.4;
const lidTilt = 0.12;

function domeHeight(x: number, z: number) {
  const r = Math.min(Math.hypot(x, z) / lidRadius, 0.9995);
  const y =
    lidWall + lidDome * Math.pow(1 - Math.pow(r, lidExponent), 1 / lidExponent);
  return y * (1 + (lidTilt * z) / lidRadius);
}

function domeNormal(x: number, z: number, out: THREE.Vector3) {
  // On the straight wall the surface faces straight out.
  if (Math.hypot(x, z) >= lidRadius * 0.99) return out.set(x, 0, z).normalize();
  const e = 0.0015;
  const dx = (domeHeight(x + e, z) - domeHeight(x - e, z)) / (2 * e);
  const dz = (domeHeight(x, z + e) - domeHeight(x, z - e)) / (2 * e);
  return out.set(-dx, 1, -dz).normalize();
}

// A flat band swept along a path lying on the dome: its width runs across
// the surface and its thickness along the surface normal, so the loop reads
// as a strap resting on the lid rather than a wire or an upright ribbon.
function strapGeometry(points: THREE.Vector3[], width: number, depth: number) {
  const curve = new THREE.CatmullRomCurve3(points, false, "centripetal");
  const segments = 72;
  const positions: number[] = [];
  const index: number[] = [];
  const normal = new THREE.Vector3();
  const across = new THREE.Vector3();
  const out = new THREE.Vector3();
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const point = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t);
    domeNormal(point.x, point.z, normal);
    across.crossVectors(tangent, normal).normalize();
    out.crossVectors(across, tangent).normalize();
    for (const [w, n] of [
      [1, 1],
      [-1, 1],
      [-1, 0],
      [1, 0],
    ]) {
      positions.push(
        point.x + (across.x * w * width) / 2 + out.x * n * depth,
        point.y + (across.y * w * width) / 2 + out.y * n * depth,
        point.z + (across.z * w * width) / 2 + out.z * n * depth,
      );
    }
    if (i === segments) break;
    for (let k = 0; k < 4; k++) {
      const a = i * 4 + k;
      const b = i * 4 + ((k + 1) % 4);
      index.push(a, a + 4, b, b, a + 4, b + 4);
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

function wordmarkTexture(
  text: string,
  color: string,
  font: string,
  shade?: string,
) {
  return textureFromCanvas(
    (ctx) => {
      ctx.font = font;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      if (shade) {
        // A darker offset copy under the text reads as a raised emboss.
        ctx.fillStyle = shade;
        ctx.fillText(text, 258, 68);
      }
      ctx.fillStyle = color;
      ctx.fillText(text, 256, 64);
    },
    512,
    128,
  );
}

function decalMaterial(map: THREE.Texture) {
  return (
    <meshStandardMaterial
      map={map}
      transparent
      roughness={0.85}
      depthWrite={false}
      polygonOffset
      polygonOffsetFactor={-2}
    />
  );
}

export const Owala = memo(function Owala() {
  const parts = useMemo(() => {
    // Straight body rounding into the foot, tucking in a little under the
    // collar.
    const body = new THREE.LatheGeometry(
      [
        new THREE.Vector2(0, 0),
        new THREE.Vector2(0.088, 0),
        new THREE.Vector2(0.1, 0.004),
        new THREE.Vector2(0.106, 0.016),
        new THREE.Vector2(0.108, 0.04),
        new THREE.Vector2(0.108, 0.48),
        new THREE.Vector2(0.106, 0.51),
        new THREE.Vector2(0.103, 0.526),
        new THREE.Vector2(0.103, 0.535),
        new THREE.Vector2(0, 0.535),
      ],
      48,
    );
    // Tan collar band, a touch wider than the body, with softened edges.
    const collar = new THREE.LatheGeometry(
      [
        new THREE.Vector2(0.098, 0),
        new THREE.Vector2(0.107, 0),
        new THREE.Vector2(0.1095, 0.004),
        new THREE.Vector2(0.1095, 0.041),
        new THREE.Vector2(0.107, 0.045),
        new THREE.Vector2(0.098, 0.045),
      ],
      48,
    );
    // Cream lid: the tipped superellipse dome above a short wall.
    const profile = [new THREE.Vector2(lidRadius, 0)];
    for (let i = 0; i <= 16; i++) {
      const r = lidRadius * Math.cos((i / 16) * (Math.PI / 2)) ** 0.7;
      profile.push(
        new THREE.Vector2(
          r,
          lidWall +
            lidDome *
              Math.pow(
                1 - Math.pow(r / lidRadius, lidExponent),
                1 / lidExponent,
              ),
        ),
      );
    }
    profile.push(new THREE.Vector2(0, lidWall + lidDome));
    const lathe = new THREE.LatheGeometry(profile, 48);
    lathe.rotateY(Math.PI); // keep the lathe seam at the back
    lathe.deleteAttribute("normal");
    lathe.deleteAttribute("uv");
    const lid = mergeVertices(lathe);
    lathe.dispose();
    const lidPosition = lid.getAttribute("position");
    for (let i = 0; i < lidPosition.count; i++) {
      const z = lidPosition.getZ(i);
      lidPosition.setY(
        i,
        lidPosition.getY(i) * (1 + (lidTilt * z) / lidRadius),
      );
    }
    lid.computeVertexNormals();
    // Spout cover: a rounded block, square in plan with a fuller front,
    // standing out of the lid's crown; its flat top tips up toward the front.
    const coverShape = new THREE.Shape();
    const halfWidth = 0.047;
    const back = -0.056;
    const front = 0.066;
    // Shape y is world -z after the rotation below.
    coverShape.moveTo(-halfWidth + 0.012, -back);
    coverShape.lineTo(halfWidth - 0.012, -back);
    coverShape.quadraticCurveTo(halfWidth, -back, halfWidth, -back - 0.012);
    coverShape.lineTo(halfWidth, -front + 0.046);
    coverShape.quadraticCurveTo(halfWidth, -front, halfWidth - 0.046, -front);
    coverShape.lineTo(-halfWidth + 0.046, -front);
    coverShape.quadraticCurveTo(-halfWidth, -front, -halfWidth, -front + 0.046);
    coverShape.lineTo(-halfWidth, -back - 0.012);
    coverShape.quadraticCurveTo(-halfWidth, -back, -halfWidth + 0.012, -back);
    const coverExtrude = new THREE.ExtrudeGeometry(coverShape, {
      depth: 0.094,
      bevelEnabled: true,
      bevelThickness: 0.016,
      bevelSize: 0.014,
      bevelSegments: 4,
      curveSegments: 8,
    });
    coverExtrude.rotateX(-Math.PI / 2);
    coverExtrude.deleteAttribute("normal");
    coverExtrude.deleteAttribute("uv");
    const cover = mergeVertices(coverExtrude);
    coverExtrude.dispose();
    const coverPosition = cover.getAttribute("position");
    for (let i = 0; i < coverPosition.count; i++) {
      const y = coverPosition.getY(i);
      if (y > 0.04) coverPosition.setY(i, y + 0.2 * coverPosition.getZ(i));
    }
    cover.computeVertexNormals();
    // Sage loop: from the hinge nubs it lies along both sides of the cover
    // and closes over the lid's front face, just above the push button.
    const hingeZ = -0.064;
    const hingeY = domeHeight(0.074, hingeZ) + 0.01;
    const lift = 0.0025;
    const normal = new THREE.Vector3();
    const onDome = (x: number, z: number) => {
      // Points past the rim are pulled back onto the lid's front wall, so
      // the loop's closed end hangs level just above the push button.
      const r = Math.hypot(x, z);
      const scale = r > lidRadius ? lidRadius / r : 1;
      const px = x * scale;
      const pz = z * scale;
      domeNormal(px, pz, normal);
      return new THREE.Vector3(px, domeHeight(px, pz), pz).addScaledVector(
        normal,
        lift,
      );
    };
    // Plan of the U: straight sides beside the cover, then a rounded end
    // whose middle drops onto the front of the lid.
    const side = 0.072;
    const bend = 0.035;
    const path: THREE.Vector3[] = [];
    for (let i = 0; i <= 6; i++) {
      path.push(onDome(-side, hingeZ + ((bend - hingeZ) * i) / 6));
    }
    for (let i = 1; i < 32; i++) {
      // A squircle keeps the arms upright in front view, as in the photo.
      const c = Math.cos(Math.PI + (i / 32) * Math.PI);
      const s = Math.sin((i / 32) * Math.PI);
      path.push(
        onDome(
          side * Math.sign(c) * Math.abs(c) ** 0.6,
          bend + 0.076 * s ** 0.6,
        ),
      );
    }
    for (let i = 6; i >= 0; i--) {
      path.push(onDome(side, hingeZ + ((bend - hingeZ) * i) / 6));
    }
    const strap = strapGeometry(path, 0.017, 0.007);
    // Pivot nubs either side of the hinge, with a coil spring inside each.
    const nubs = mergeGeometries(
      [-1, 1].map((side) =>
        new THREE.CylinderGeometry(0.015, 0.015, 0.012, 20)
          .rotateZ(Math.PI / 2)
          .translate(side * 0.075, hingeY, hingeZ),
      ),
    )!;
    const coil: THREE.Vector2[] = [];
    for (let i = 0; i <= 12; i++) {
      coil.push(new THREE.Vector2(i % 2 ? 0.0085 : 0.0072, i * 0.0011));
    }
    const springs = mergeGeometries(
      [-1, 1].map((side) =>
        new THREE.LatheGeometry(coil, 8)
          .translate(0, -0.0066, 0)
          .rotateZ(Math.PI / 2)
          .translate(side * 0.0655, hingeY, hingeZ),
      ),
    )!;
    return { body, collar, lid, cover, strap, nubs, springs };
  }, []);
  const labels = useMemo(
    () => ({
      body: wordmarkTexture(
        "owala.",
        "#dfe3cf",
        '500 92px "Avenir Next", Futura, "Helvetica Neue", Arial, sans-serif',
      ),
      collar: wordmarkTexture(
        "owala",
        "#d8cfba",
        'bold 92px "Arial Rounded MT Bold", "Avenir Next", Arial, sans-serif',
        "#a89d86",
      ),
    }),
    [],
  );
  useEffect(
    () => () => {
      Object.values(parts).forEach((geometry) => geometry.dispose());
      Object.values(labels).forEach((texture) => texture.dispose());
    },
    [parts, labels],
  );
  return (
    <group
      name="Owala FreeSip bottle"
      position={[1.64, 1.683, 0.38]}
      rotation={[0, 0.55, 0]}
    >
      <mesh geometry={parts.body} castShadow receiveShadow>
        <meshStandardMaterial color={slate} roughness={0.78} />
      </mesh>
      {/* Wordmark printed low on the left side, reading upward. */}
      <mesh
        position={[-0.1095, 0.095, 0]}
        rotation={[0, -Math.PI / 2, Math.PI / 2]}
      >
        <planeGeometry args={[0.15, 0.0375]} />
        {decalMaterial(labels.body)}
      </mesh>
      <mesh
        geometry={parts.collar}
        position={[0, 0.53, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={tan} roughness={0.8} />
      </mesh>
      {/* Wordmark embossed on the collar, on the same side as the print. */}
      <mesh position={[0, 0.5525, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <cylinderGeometry
          args={[0.1105, 0.1105, 0.036, 24, 1, true, -0.66, 1.32]}
        />
        {decalMaterial(labels.collar)}
      </mesh>
      <group position={[0, 0.575, 0]}>
        <mesh geometry={parts.lid} castShadow receiveShadow>
          <meshStandardMaterial color={cream} roughness={0.72} />
        </mesh>
        <mesh
          geometry={parts.cover}
          position={[0, 0.03, 0]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color={coverWhite} roughness={0.6} />
        </mesh>
        <mesh geometry={parts.strap} castShadow receiveShadow>
          <meshStandardMaterial color={sage} roughness={0.75} />
        </mesh>
        <mesh geometry={parts.nubs} castShadow>
          <meshStandardMaterial color={sage} roughness={0.75} />
        </mesh>
        <mesh geometry={parts.springs}>
          <meshStandardMaterial
            color="#9ea2a6"
            metalness={0.85}
            roughness={0.35}
          />
        </mesh>
        {/* Push button on the lid's front wall, under the loop. */}
        <Box
          size={[0.042, 0.017, 0.014]}
          position={[0, 0.017, 0.099]}
          color={coral}
          radius={0.005}
          roughness={0.6}
        />
      </group>
    </group>
  );
});
