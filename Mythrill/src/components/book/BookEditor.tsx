import { useEffect } from "react";
import { usePagesStore } from "../../store/usePagesStore";
import PageSidebar from "../sidebar/PageSidebar";
import PageCanvas from "./PageCanvas";

export default function BookEditor() {
  const { pages, currentPageId, selectedBlockId, saveState, init, selectPage, removeBlock } =
    usePagesStore();

  useEffect(() => { init(); }, [init]);

  // Delete key removes the selected block, but not while typing
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "TEXTAREA" || tag === "INPUT" || tag === "SELECT") return;
      if ((e.key === "Delete" || e.key === "Backspace") && selectedBlockId) removeBlock(selectedBlockId);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedBlockId, removeBlock]);

  const idx = pages.findIndex((p) => p.id === currentPageId);
  const spread = idx < 0 ? 0 : Math.floor((idx + 1) / 2);
  const totalSpreads = Math.floor(pages.length / 2) + 1;
  const left = pages[spread * 2 - 1];
  const right = pages[spread * 2];

  const goSpread = (s: number) => {
    const clamped = Math.max(0, Math.min(totalSpreads - 1, s));
    const target = pages[clamped * 2] ?? pages[clamped * 2 - 1];
    if (target) selectPage(target.id);
  };

  if (idx < 0) return <div style={{ padding: 24 }}>Loading…</div>;

  return (
    <div style={{ display: "flex", height: "100%" }}>
      <PageSidebar />

      <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: 16, overflow: "auto" }}>
        <span style={{ opacity: 0.6, fontSize: 13, height: 18 }}>
          {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved ✓" : ""}
        </span>

        <div style={{ display: "flex", background: "#5a3a1a", padding: 18, borderRadius: 10 }}>
          <PageCanvas page={left} side="left" active={left?.id === currentPageId} />
          <PageCanvas page={right} side="right" active={right?.id === currentPageId} />
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button onClick={() => goSpread(spread - 1)} disabled={spread === 0}>◀</button>
          <span>Spread {spread + 1} / {totalSpreads}</span>
          <button onClick={() => goSpread(spread + 1)} disabled={spread >= totalSpreads - 1}>▶</button>
        </div>
      </main>
    </div>
  );
}