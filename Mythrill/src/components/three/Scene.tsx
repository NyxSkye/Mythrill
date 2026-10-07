import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Suspense } from "react";
import BookModel from "./BookModel";
import { useBookStore } from "../../store/useBookStore";

export default function Scene() {
  const next = useBookStore((s) => s.next);
  const prev = useBookStore((s) => s.prev);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <Canvas camera={{ position: [0, 2, 8], fov: 50 }}>
        <ambientLight intensity={1.2} />
        <directionalLight position={[5, 5, 5]} intensity={2} />
        <Suspense fallback={null}>
          <BookModel />
        </Suspense>
        <OrbitControls />
      </Canvas>
      <div style={{ position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 12 }}>
        <button onClick={prev}>◀ Prev</button>
        <button onClick={next}>Next ▶</button>
      </div>
    </div>
  );
}