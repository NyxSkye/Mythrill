import { useEffect } from "react";
import { usePagesStore } from "../../store/usePagesStore";
import { useEditorShortcuts } from "../../hooks/useEditorShortcuts";
import PageSidebar from "../sidebar/PageSidebar";
import PageCanvas from "./PageCanvas";

export default function BookEditor() {
  const pages = usePagesStore((s) => s.pages);
  const currentPageId = usePagesStore((s) => s.currentPageId);
  const selectedBlockId = usePagesStore((s) => s.selectedBlockId);
  const saveState = usePagesStore((s) => s.saveState);
  const canUndo = usePagesStore((s) => s.past.length > 0);
  const canRedo = usePagesStore((s) => s.future.length > 0);
  const { init, selectPage, undo, redo, removeBlock, duplicateSelected, reorderBlock, clearPage } = usePagesStore.getState();
  useEffect(() => { init(); }, [init]);
  useEditorShortcuts();

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

  const has = !!selectedBlockId;

  return (
    <div style={{ display: "flex", height: "100%" }}>
      <PageSidebar />

      <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: 16, overflow: "auto" }}>
        {/* Toolbar */}
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          <button onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)">↶ Undo</button>
          <button onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)">↷ Redo</button>
          <span style={{ width: 12 }} />
          <button disabled={!has} onClick={duplicateSelected} title="Duplicate (Ctrl+D)">⧉ Duplicate</button>
          <button disabled={!has} onClick={() => has && reorderBlock(selectedBlockId!, "front")}>▲ Front</button>
          <button disabled={!has} onClick={() => has && reorderBlock(selectedBlockId!, "back")}>▼ Back</button>
          <button disabled={!has} onClick={() => has && removeBlock(selectedBlockId!)} title="Delete (Del)">🗑 Delete</button>
          <button
            onClick={() => {
              const page = pages[idx];
              if (page.blocks.length && confirm(`Clear everything on "${page.title}"? You can undo with Ctrl+Z.`)) {
                clearPage(page.id);
              }
            }}
            title="Remove all elements from this page"
          >
            🧹 Clear page
          </button>
          <span style={{ opacity: 0.6, fontSize: 13, width: 70 }}>
            {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved ✓" : ""}
          </span>
        </div>

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