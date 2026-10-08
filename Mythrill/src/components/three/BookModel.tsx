import { useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useBookStore } from "../../store/useBookStore";

// ---- FLIP TUNING ----
const AXIS: "x" | "y" | "z" = "y"; // hinge axis
const SIGN = -1;                   // flip to 1 if it swings the wrong way

// ---- VIEW TUNING (edit these to change how the book looks) ----
const MODEL_SCALE = 1.75;                  // bigger number = bigger book
const MODEL_POSITION: [number, number, number] = [0, 0, 0];
const MODEL_ROTATION: [number, number, number] = [-5, 0, 0]; // radians, e.g. Math.PI / 2 = 90°

export default function BookModel() {
  const { scene } = useGLTF("/models/book.glb");
  const setTotal = useBookStore((s) => s.setTotal);

  // Flippable parts, in order: front cover first, then pages
  const flippers = useMemo(() => {
    const front: THREE.Object3D[] = [];
    const pages: THREE.Object3D[] = [];
    const back: THREE.Object3D[] = [];

    scene.traverse((o) => {
      if (!(o as THREE.Mesh).isMesh) return;
      if (/front/i.test(o.name)) front.push(o);
      else if (/^page([._]?\d+)?$/i.test(o.name)) pages.push(o);
      else if (/back/i.test(o.name)) back.push(o);
    });

    const num = (o: THREE.Object3D) => parseInt(o.name.replace(/\D/g, "") || "0");
    pages.sort((a, b) => num(a) - num(b));

    const all = [...front, ...pages, ...back];
    all.forEach((o) => (o.userData.baseRot = o.rotation[AXIS]));
    return all;
  }, [scene]);

  useEffect(() => {
    console.log("flippers:", flippers.length, flippers.map((p) => p.name));
    setTotal(flippers.length);
  }, [flippers, setTotal]);

  useFrame((_, dt) => {
    const current = useBookStore.getState().currentIndex;
    flippers.forEach((p, i) => {
      const target = p.userData.baseRot + (i < current ? Math.PI * SIGN : 0);
      p.rotation[AXIS] = THREE.MathUtils.damp(p.rotation[AXIS], target, 6, dt);
    });
  });

  return (
    <group scale={MODEL_SCALE} position={MODEL_POSITION} rotation={MODEL_ROTATION}>
      <primitive object={scene} />
    </group>
  );
}