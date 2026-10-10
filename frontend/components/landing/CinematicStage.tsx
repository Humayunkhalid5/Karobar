"use client";

import { Line, RoundedBox } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useRef, type MutableRefObject } from "react";
import { MathUtils, type Group } from "three";

const palette = { ink: "#052d25", mint: "#65d9b5", mintDark: "#15946e", coral: "#ef735f", gold: "#d0a652", goldLight: "#f0d590" };

function sample(values: number[], stage: number) {
  const start = Math.min(Math.floor(stage), values.length - 1);
  const end = Math.min(start + 1, values.length - 1);
  return MathUtils.lerp(values[start], values[end], MathUtils.smoothstep(stage - start, 0, 1));
}

function LogoFace({ back = false }: { back?: boolean }) {
  return <group position={[0, 0, back ? -0.245 : 0.245]} rotation={back ? [0, Math.PI, 0] : [0, 0, 0]}>
    <RoundedBox args={[0.22, 1.12, 0.1]} radius={0.025} smoothness={3} position={[-0.29, 0.05, 0]}><meshPhysicalMaterial color={palette.ink} roughness={0.18} metalness={0.42} clearcoat={1} /></RoundedBox>
    <RoundedBox args={[0.2, 0.74, 0.1]} radius={0.025} smoothness={3} position={[0.02, 0.34, 0]} rotation={[0, 0, -0.72]}><meshPhysicalMaterial color={palette.ink} roughness={0.18} metalness={0.42} clearcoat={1} /></RoundedBox>
    <RoundedBox args={[0.2, 0.7, 0.1]} radius={0.025} smoothness={3} position={[0.02, -0.3, 0]} rotation={[0, 0, 0.72]}><meshPhysicalMaterial color={palette.ink} roughness={0.18} metalness={0.42} clearcoat={1} /></RoundedBox>
    <Line points={[[-0.82, 0.02, 0.07], [-0.47, 0.02, 0.07], [-0.38, 0.22, 0.07], [-0.26, -0.22, 0.07], [-0.12, 0.14, 0.07], [0.02, 0.02, 0.07], [0.35, 0.02, 0.07]]} color={palette.mint} lineWidth={4} />
    <RoundedBox args={[0.16, 0.52, 0.11]} radius={0.025} smoothness={3} position={[0.18, -0.56, 0.08]} rotation={[0, 0, 0.76]}><meshPhysicalMaterial color={palette.mintDark} roughness={0.13} metalness={0.34} clearcoat={1} /></RoundedBox>
    <RoundedBox args={[0.16, 0.82, 0.11]} radius={0.025} smoothness={3} position={[0.54, -0.35, 0.08]} rotation={[0, 0, -0.76]}><meshPhysicalMaterial color={palette.mint} roughness={0.13} metalness={0.34} clearcoat={1} /></RoundedBox>
  </group>;
}

function BrandCoin() {
  return <group>
    <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[1.68, 1.68, 0.34, 96, 3]} /><meshPhysicalMaterial color="#a87425" roughness={0.2} metalness={0.74} clearcoat={1} clearcoatRoughness={0.13} /></mesh>
    <mesh position={[0, 0, 0.18]}><circleGeometry args={[1.56, 96]} /><meshPhysicalMaterial color={palette.gold} roughness={0.17} metalness={0.68} clearcoat={1} clearcoatRoughness={0.1} /></mesh>
    <mesh position={[0, 0, -0.18]} rotation={[0, Math.PI, 0]}><circleGeometry args={[1.56, 96]} /><meshPhysicalMaterial color="#bc8a36" roughness={0.2} metalness={0.7} clearcoat={1} /></mesh>
    {[1.38, 1.18].map((radius, index) => <mesh key={radius} position={[0, 0, 0.205]}><ringGeometry args={[radius - 0.035, radius, 96]} /><meshPhysicalMaterial color={index ? palette.goldLight : "#825315"} roughness={0.16} metalness={0.78} clearcoat={1} /></mesh>)}
    {Array.from({ length: 56 }, (_, index) => { const angle = index / 56 * Math.PI * 2; return <mesh key={index} position={[Math.cos(angle) * 1.66, Math.sin(angle) * 1.66, 0]} rotation={[0, 0, angle]}><boxGeometry args={[0.04, 0.14, 0.38]} /><meshPhysicalMaterial color={index % 2 ? "#98601b" : palette.goldLight} roughness={0.25} metalness={0.7} /></mesh>; })}
    <LogoFace /><LogoFace back />
  </group>;
}

function SceneWorld({ stage }: { stage: MutableRefObject<number> }) {
  const root = useRef<Group>(null);
  const coin = useRef<Group>(null);
  const displayedStage = useRef(0);
  const { viewport } = useThree();
  useFrame(({ clock, pointer }, delta) => {
    if (!root.current || !coin.current) return;
    displayedStage.current = MathUtils.damp(displayedStage.current, stage.current, 2.15, delta);
    const current = displayedStage.current;
    const elapsed = clock.getElapsedTime();
    const mobile = viewport.width < 7;
    const x = sample(mobile ? [0.42, -0.28, 0.38, -0.3, 0.34, -0.26, 0.38] : [2.45, -2.05, 2.35, -2, 2.1, -1.95, 2.35], current);
    const y = sample(mobile ? [2.05, 2.02, 2.06, 2.04, 2.06, 2.04, 2] : [0.08, 0, 0.18, 0, 0.04, 0, 0], current);
    const sectionProgress = current - Math.floor(current);
    const depthArc = Math.sin(sectionProgress * Math.PI);
    const restingScale = sample(mobile ? [0.34, 0.37, 0.36, 0.36, 0.38, 0.36, 0.4] : [1.1, 1.06, 1.02, 1.04, 1.08, 1.04, 1.12], current);
    const scale = restingScale * (1 - depthArc * (mobile ? 0.42 : 0.82));
    root.current.position.x = MathUtils.damp(root.current.position.x, x, 2.4, delta);
    root.current.position.y = MathUtils.damp(root.current.position.y, y + Math.sin(elapsed * 0.32) * 0.035, 2.4, delta);
    root.current.position.z = MathUtils.damp(root.current.position.z, -depthArc * (mobile ? 1.5 : 4.2), 2.2, delta);
    const nextScale = MathUtils.damp(root.current.scale.x, scale, 2.3, delta);
    root.current.scale.setScalar(nextScale);
    root.current.rotation.x = MathUtils.damp(root.current.rotation.x, pointer.y * 0.018 - 0.04, 2, delta);
    root.current.rotation.z = Math.sin(elapsed * 0.16) * 0.022;
    coin.current.rotation.y = 0.38 + Math.sin(elapsed * 0.18) * 0.2 + current * 0.085 + pointer.x * 0.035;
    coin.current.rotation.x = -0.08 + Math.sin(elapsed * 0.22) * 0.032;
  });
  return <group ref={root} scale={0.01}><group ref={coin}><BrandCoin /></group></group>;
}

function LoaderWorld({ opening }: { opening: boolean }) {
  const root = useRef<Group>(null);
  const coin = useRef<Group>(null);
  useFrame(({ clock }, delta) => {
    if (!root.current || !coin.current) return;
    const elapsed = clock.getElapsedTime();
    const nextScale = MathUtils.damp(root.current.scale.x, opening ? 2.05 : 0.82, opening ? 1.8 : 2.6, delta);
    root.current.scale.setScalar(nextScale);
    root.current.rotation.z = Math.sin(elapsed * 0.2) * 0.02;
    coin.current.rotation.y = opening ? elapsed * 0.42 : 0.38 + Math.sin(elapsed * 0.25) * 0.24;
    coin.current.rotation.x = Math.sin(elapsed * 0.24) * 0.055;
  });
  return <group ref={root} scale={0.01}><group ref={coin}><BrandCoin /></group></group>;
}

function Lights() { return <><ambientLight intensity={1.65} /><directionalLight position={[4, 6, 7]} color="#fff3c9" intensity={7.5} /><pointLight position={[-4, 1, 4]} color={palette.mint} intensity={18} /><pointLight position={[4, -2, 3]} color="#3978ed" intensity={13} /><pointLight position={[0, 4, -2]} color={palette.coral} intensity={7} /></>; }

export function CinematicStage({ stage }: { stage: MutableRefObject<number> }) {
  return <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 opacity-55 md:opacity-75"><Canvas dpr={[1, 1.35]} camera={{ position: [0, 0, 8.6], fov: 38 }} gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}><Lights /><SceneWorld stage={stage} /></Canvas></div>;
}

export function LoaderStage({ opening }: { opening: boolean }) {
  return <Canvas dpr={[1, 1.3]} camera={{ position: [0, 0, 7.5], fov: 35 }} gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}><Lights /><LoaderWorld opening={opening} /></Canvas>;
}
