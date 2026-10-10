"use client";

import { Float, Line, Points, PointMaterial } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef, type MutableRefObject } from "react";
import type { Group } from "three";

export type SceneVariant = "globe" | "network" | "terrain" | "shield";

function makePoints(count: number, variant: SceneVariant) {
  const points = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) {
    const offset = index * 3;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const radius = variant === "terrain" ? 1.1 + Math.random() * 1.7 : 2.04 + (Math.random() - 0.5) * 0.16;
    points[offset] = radius * Math.sin(phi) * Math.cos(theta);
    points[offset + 1] = variant === "terrain" ? (Math.random() - 0.5) * 1.2 : radius * Math.cos(phi);
    points[offset + 2] = radius * Math.sin(phi) * Math.sin(theta);
  }
  return points;
}

function SceneObject({ variant }: { variant: SceneVariant }) {
  const root = useRef<Group>(null);
  const points = useMemo(() => makePoints(variant === "globe" ? 2400 : 1300, variant), [variant]);
  const rings = useMemo(() => Array.from({ length: 3 }, (_, ring) => Array.from({ length: 72 }, (_, step) => {
    const angle = (step / 71) * Math.PI * 2;
    const radius = 2.25 + ring * 0.22;
    return [Math.cos(angle) * radius, Math.sin(angle) * radius * (0.34 + ring * 0.06), 0] as [number, number, number];
  })), []);
  useFrame(({ clock, pointer }) => {
    if (!root.current) return;
    const pace = variant === "network" ? 0.16 : variant === "shield" ? 0.045 : 0.075;
    const scale = variant === "shield" ? 1.14 : variant === "terrain" ? 0.92 : 1;
    root.current.rotation.y = clock.getElapsedTime() * pace + pointer.x * 0.18;
    root.current.rotation.x = pointer.y * 0.1 + (variant === "terrain" ? 0.28 : 0);
    root.current.scale.setScalar(scale);
  });
  return <group ref={root} rotation={[0.18, -0.45, 0]}>
    <Points positions={points} stride={3} frustumCulled={false}>
      <PointMaterial transparent color="#1769ff" size={0.028} sizeAttenuation depthWrite={false} opacity={0.86} />
    </Points>
    {rings.map((ring, index) => <Line key={index} points={ring} color={index === 1 ? "#18b9ff" : "#92c8ff"} transparent opacity={variant === "shield" ? 0.72 : 0.45} lineWidth={variant === "network" && index === 1 ? 1.5 : 0.8} />)}
    {Array.from({ length: 8 }, (_, index) => {
      const angle = (index / 8) * Math.PI * 2;
      return <Float key={index} speed={1.3} rotationIntensity={0.2} floatIntensity={0.45}>
        <mesh position={[Math.cos(angle) * 2.1, Math.sin(angle * 1.7) * 1.1, Math.sin(angle) * 1.6]}>
          <sphereGeometry args={[0.07, 18, 18]} /><meshBasicMaterial color="#18b9ff" />
        </mesh>
      </Float>;
    })}
  </group>;
}

export function FinanceScene({ variant = "globe", className = "" }: { variant?: SceneVariant; className?: string }) {
  return <div aria-hidden="true" className={className}>
    <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 7], fov: 42 }} gl={{ alpha: true, antialias: true }}>
      <ambientLight intensity={1.5} />
      <pointLight position={[4, 4, 3]} color="#a8dcff" intensity={16} />
      <SceneObject variant={variant} />
    </Canvas>
  </div>;
}

function ScrollOrb({ progress }: { progress: MutableRefObject<number> }) {
  const root = useRef<Group>(null);
  const upper = useRef<Group>(null);
  const lower = useRef<Group>(null);
  const records = useRef<Group>(null);

  useFrame(({ clock, pointer }) => {
    if (!root.current || !upper.current || !lower.current || !records.current) return;
    const p = progress.current;
    const opening = Math.min(1, Math.max(0, (p - 0.38) / 0.42));
    const dissolve = Math.min(1, Math.max(0, (p - 0.84) / 0.16));
    const targetX = 1.25 - p * 0.45 - dissolve * 0.8;
    const targetY = 0.08 - p * 0.18;
    const targetScale = 0.98 + Math.sin(p * Math.PI) * 0.14 + dissolve * 1.7;

    root.current.position.x += (targetX - root.current.position.x) * 0.065;
    root.current.position.y += (targetY - root.current.position.y) * 0.065;
    root.current.scale.setScalar(root.current.scale.x + (targetScale - root.current.scale.x) * 0.06);
    root.current.rotation.y = clock.getElapsedTime() * 0.055 + p * 0.48 + pointer.x * 0.035;
    root.current.rotation.x = -0.08 + pointer.y * 0.025;

    upper.current.position.y += (opening * 0.72 - upper.current.position.y) * 0.075;
    lower.current.position.y += (-opening * 0.72 - lower.current.position.y) * 0.075;
    upper.current.rotation.z += (-opening * 0.11 - upper.current.rotation.z) * 0.075;
    lower.current.rotation.z += (opening * 0.11 - lower.current.rotation.z) * 0.075;
    records.current.scale.setScalar(0.72 + opening * 0.38);
    records.current.rotation.y = -0.24 + opening * 0.42;
    records.current.rotation.z = opening * 0.07;
  });

  return <group ref={root} position={[1.25, 0.08, 0]}>
    <group ref={upper}>
      <mesh>
        <sphereGeometry args={[1.62, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial color="#dff8f1" transmission={0.96} thickness={1.25} roughness={0.04} metalness={0.02} clearcoat={1} clearcoatRoughness={0.05} transparent opacity={0.68} />
      </mesh>
      <mesh scale={1.012}>
        <sphereGeometry args={[1.62, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshBasicMaterial color="#3c86e8" wireframe transparent opacity={0.075} />
      </mesh>
    </group>
    <group ref={lower}>
      <mesh>
        <sphereGeometry args={[1.62, 64, 32, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
        <meshPhysicalMaterial color="#e4f2ff" transmission={0.96} thickness={1.25} roughness={0.04} metalness={0.02} clearcoat={1} clearcoatRoughness={0.05} transparent opacity={0.68} />
      </mesh>
      <mesh scale={1.012}>
        <sphereGeometry args={[1.62, 64, 32, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
        <meshBasicMaterial color="#0c8f62" wireframe transparent opacity={0.065} />
      </mesh>
    </group>
    <group ref={records} scale={0.72}>
      {[
        { y: 0.42, z: -0.18, color: "#4b8fe8", width: 1.72 },
        { y: 0, z: 0, color: "#17a673", width: 2.08 },
        { y: -0.42, z: 0.18, color: "#e8795f", width: 1.52 },
      ].map((record) => <mesh key={record.y} position={[0, record.y, record.z]}>
        <boxGeometry args={[record.width, 0.16, 0.08]} />
        <meshPhysicalMaterial color={record.color} transmission={0.24} roughness={0.18} transparent opacity={0.72} clearcoat={1} />
      </mesh>)}
      <mesh position={[-0.72, 0, 0.33]}>
        <sphereGeometry args={[0.13, 24, 24]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.92} />
      </mesh>
    </group>
  </group>;
}

export function ScrollOrbScene({ progress, className = "" }: { progress: MutableRefObject<number>; className?: string }) {
  return <div aria-hidden="true" className={className}>
    <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 7.2], fov: 42 }} gl={{ alpha: true, antialias: true }}>
      <ambientLight intensity={2.1} />
      <directionalLight position={[4, 6, 5]} color="#ffffff" intensity={4.2} />
      <pointLight position={[-4, 1, 3]} color="#77b8ff" intensity={16} />
      <pointLight position={[4, -2, 2]} color="#78d6b5" intensity={13} />
      <ScrollOrb progress={progress} />
    </Canvas>
  </div>;
}
