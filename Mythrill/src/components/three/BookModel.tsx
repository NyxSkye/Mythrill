import { useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useBookStore } from "../../store/useBookStore";

// TUNE THESE if pages move wrongly
const AXIS: "x" | "y" | "z" = "y"; // the axis the pages hinge around (along the spine)
const SIGN = -1; // flip to 1 if pages swing the wrong way

export default function BookModel() {
  const { scene } = useGLTF("/models/book.glb");
  const setTotal = useBookStore((s) => s.setTotal);

  const pages = useMemo(() => {
    const found: THREE.Object3D[] = [];
    scene.traverse((o) => {
      if (/^page[._]?\d+$/i.test(o.name)) {
        o.userData.baseRot = o.rotation[AXIS];
        found.push(o);
      }
    });
    found.sort(
      (a, b) => parseInt(a.name.replace(/\D/g, "")) - parseInt(b.name.replace(/\D/g, ""))
    );
    return found;
  }, [scene]);

  useEffect(() => {
    console.log("pages found:", pages.length, pages.map((p) => p.name));
    setTotal(pages.length);
  }, [pages, setTotal]);

  useFrame((_, dt) => {
    const current = useBookStore.getState().currentIndex;
    pages.forEach((p, i) => {
      const target = p.userData.baseRot + (i < current ? Math.PI * SIGN : 0);
      p.rotation[AXIS] = THREE.MathUtils.damp(p.rotation[AXIS], target, 6, dt);
    });
  });

  return <primitive object={scene} />;
}