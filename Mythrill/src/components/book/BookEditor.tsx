import { useEffect } from "react";
import { usePagesStore } from "../../store/usePagesStore";
import { useEditorShortcuts } from "../../hooks/useEditorShortcuts";
import PageSidebar from "../sidebar/PageSidebar";
import PageCanvas from "./PageCanvas";
import type { TextAlignment } from "../../types/book";

export default function BookEditor() {
  const pages = usePagesStore((s) => s.pages);
  const currentPageId = usePagesStore((s) => s.currentPageId);
  const selectedBlockId = usePagesStore((s) => s.selectedBlockId);
  const updateBlock = usePagesStore((s) => s.updateBlock);
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
  const selectedBlock = pages[idx]?.blocks.find((block) => block.id === selectedBlockId);
  const selectedText = selectedBlock?.type === "text" ? selectedBlock : undefined;
  const fontFamilies = ["Arial", "Georgia", "Times New Roman", "Verdana", "Trebuchet MS", "Courier New"];
  const controlStyle: React.CSSProperties = {
    height: 32,
    border: "1px solid #d6d3d1",
    borderRadius: 5,
    background: "#fff",
    color: "#292524",
  };
  const formatButtonStyle = (active: boolean): React.CSSProperties => ({
    ...controlStyle,
    minWidth: 34,
    padding: "0 8px",
    fontWeight: active ? 700 : 400,
    background: active ? "#f5e6c8" : "#fff",
    borderColor: active ? "#8a5a2b" : "#d6d3d1",
  });

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

        {selectedText && (
          <div
            aria-label="Text formatting"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              flexWrap: "wrap",
              padding: "8px 10px",
              background: "#fff",
              border: "1px solid #e7e5e4",
              borderRadius: 8,
              boxShadow: "0 2px 8px rgba(0,0,0,.08)",
            }}
          >
            <select
              aria-label="Font family"
              value={selectedText.fontFamily ?? ""}
              onChange={(e) => updateBlock(selectedText.id, { fontFamily: e.target.value || undefined })}
              style={{ ...controlStyle, width: 150, padding: "0 8px" }}
            >
              <option value="">Default font</option>
              {fontFamilies.map((font) => (
                <option key={font} value={font}>{font}</option>
              ))}
            </select>
            <input
              aria-label="Font size"
              type="number"
              min={8}
              max={96}
              value={selectedText.fontSize ?? 16}
              onChange={(e) => {
                const size = Number(e.target.value);
                if (Number.isFinite(size) && size >= 8 && size <= 96) {
                  updateBlock(selectedText.id, { fontSize: size });
                }
              }}
              style={{ ...controlStyle, width: 64, padding: "0 6px" }}
            />
            <input
              aria-label="Text color"
              type="color"
              value={selectedText.color ?? "#000000"}
              onChange={(e) => updateBlock(selectedText.id, { color: e.target.value })}
              style={{ ...controlStyle, width: 38, padding: 3, cursor: "pointer" }}
            />
            <span style={{ width: 1, height: 24, background: "#e7e5e4" }} />
            <button
              aria-label="Bold"
              aria-pressed={selectedText.bold ?? false}
              onClick={() => updateBlock(selectedText.id, { bold: !selectedText.bold })}
              style={formatButtonStyle(selectedText.bold ?? false)}
            >B</button>
            <button
              aria-label="Italic"
              aria-pressed={selectedText.italic ?? false}
              onClick={() => updateBlock(selectedText.id, { italic: !selectedText.italic })}
              style={{ ...formatButtonStyle(selectedText.italic ?? false), fontStyle: "italic" }}
            >I</button>
            <button
              aria-label="Underline"
              aria-pressed={selectedText.underline ?? false}
              onClick={() => updateBlock(selectedText.id, { underline: !selectedText.underline })}
              style={{ ...formatButtonStyle(selectedText.underline ?? false), textDecoration: "underline" }}
            >U</button>
            <span style={{ width: 1, height: 24, background: "#e7e5e4" }} />
            <select
              aria-label="Text alignment"
              value={selectedText.textAlign ?? "left"}
              onChange={(e) => updateBlock(selectedText.id, { textAlign: e.target.value as TextAlignment })}
              style={{ ...controlStyle, padding: "0 8px" }}
            >
              <option value="left">Align left</option>
              <option value="center">Center</option>
              <option value="right">Align right</option>
            </select>
          </div>
        )}

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