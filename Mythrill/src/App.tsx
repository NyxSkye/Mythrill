import { useEffect, useState } from "react";
import Scene from "./components/three/Scene";
import BookEditor from "./components/book/BookEditor";
import { usePagesStore } from "./store/usePagesStore";
import { useBookStore } from "./store/useBookStore";

export default function App() {
  const [view, setView] = useState<"3d" | "edit">("edit");

  useEffect(() => { usePagesStore.getState().init(); }, []);

  const toggle = () => {
    if (view === "edit") {
      // open the 3D book at the spread you were editing
      const { pages, currentPageId } = usePagesStore.getState();
      const idx = pages.findIndex((p) => p.id === currentPageId);
      const spread = idx < 0 ? 0 : Math.floor((idx + 1) / 2);
      useBookStore.getState().setIndex(spread + 1); // +1 = the front cover is open
    }
    setView(view === "3d" ? "edit" : "3d");
  };

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <button style={{ position: "fixed", top: 8, right: 8, zIndex: 10 }} onClick={toggle}>
        Switch to {view === "3d" ? "editor" : "3D"}
      </button>
      {view === "3d" ? <Scene /> : <BookEditor />}
    </div>
  );
}