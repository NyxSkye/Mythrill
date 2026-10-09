import { useState } from "react";
import Scene from "./components/three/Scene";
import BookEditor from "./components/book/bookEditor";

export default function App() {
  const [view, setView] = useState<"3d" | "edit">("edit");
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <button style={{ position: "fixed", top: 8, right: 8, zIndex: 10 }} onClick={() => setView(view === "3d" ? "edit" : "3d")}>
        Switch to {view === "3d" ? "editor" : "3D"}
      </button>
        {view === "3d" ? <Scene /> : <BookEditor />}
    </div>
  );
}