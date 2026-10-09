import { useEffect, useRef} from "react";
import MoveableLib from "moveable";
import type { OnDrag, OnResize, OnRotate } from "moveable";
import { usePagesStore } from "../../store/usePagesStore";
import { resizeImage } from "../../lib/image";
import BlockView from "./blocks/BlockView";

const PAGE_W = "25vw";
const PAGE_H = "35vw";
const STICKERS = ["/stickers/tape.png", "/stickers/clip.png", "/stickers/stamp.png"]; // use your own files

export default function PageEditor() {
  const { pages, currentPageId, selectedBlockId, init, addPage, selectPage, selectBlock, addBlock, updateBlock, removeBlock } =
    usePagesStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const moveableRef = useRef<MoveableLib | null>(null);

  useEffect(() => {
    init();
  }, [init]);

  const page = pages.find((p) => p.id === currentPageId);
  const selected = page?.blocks.find((b) => b.id === selectedBlockId);

  // Create the Moveable controller when the selection changes
  const selectedType = selected?.type;
  useEffect(() => {
    const container = pageRef.current;
    const el = selectedBlockId ? document.getElementById(`block-${selectedBlockId}`) : null;
    if (!container || !el || !selectedBlockId) return;

    const id = selectedBlockId;
    const m = new MoveableLib(container, {
      target: el,
      draggable: true,
      resizable: true,
      rotatable: true,
      keepRatio: selectedType !== "text",
      throttleDrag: 0,
      throttleResize: 0,
      throttleRotate: 0,
    });

    m.on("drag", (e: OnDrag) => updateBlock(id, { x: e.left, y: e.top }));
    m.on("resize", (e: OnResize) =>
      updateBlock(id, { width: e.width, height: e.height, x: e.drag.left, y: e.drag.top })
    );
    m.on("rotate", (e: OnRotate) => updateBlock(id, { rotation: e.absoluteRotation }));

    moveableRef.current = m;
    return () => {
      m.destroy();
      moveableRef.current = null;
    };
  }, [selectedBlockId, selectedType, updateBlock]);

  // Keep the handles aligned when the block's data changes
  useEffect(() => {
    moveableRef.current?.updateRect();
  }, [selected]);

  // Delete key removes the selected block (unless typing)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "TEXTAREA") return;
      if ((e.key === "Delete" || e.key === "Backspace") && selectedBlockId) removeBlock(selectedBlockId);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedBlockId, removeBlock]);

  const onPickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { dataUrl, width, height } = await resizeImage(file);
    addBlock("image", dataUrl, { width: 240, height: Math.round((240 * height) / width) });
    e.target.value = "";
  };

  if (!page) return <div>Loading…</div>;

  return (
    <div style={{ display: "flex", padding: "50px", justifyContent: "center" }}>
      <div style={{ width: 100, display: "flex", flexDirection: "column", gap: 8, margin: "0 20px" }}>
        <strong>Pages</strong>
        {pages.map((p) => (
          <button key={p.id} onClick={() => selectPage(p.id)} style={{ fontWeight: p.id === currentPageId ? "bold" : "normal" }}>
            {p.title}
          </button>
        ))}
        <button onClick={() => addPage(`Page ${pages.length + 1}`)}>+ New page</button>

        <hr />
        <strong>Add</strong>
        <button onClick={() => addBlock("text", "Double-click to edit")}>Text</button>
        <button onClick={() => fileRef.current?.click()}>Photo</button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickImage} />
        {STICKERS.map((src) => (
          <button key={src} onClick={() => addBlock("sticker", src, { width: 120, height: 120 })}>
            <img src={src} width={32} height={32} /> sticker
          </button>
        ))}
      </div>

      {/* Right: the page */}
            {/* Right: the page */}
      <div
        ref={pageRef}
        onMouseDown={() => selectBlock(null)}
        style={{
          backgroundSize: "cover",
          borderRadius: 4,
          position: "relative",
          width: PAGE_W,
          height: PAGE_H,
          background: "#ffffff",
          boxShadow: "0 6px 20px rgba(0,0,0,.25)",
        }}
      >
        {page.blocks.map((b) => (
          <BlockView key={b.id} block={b} onSelect={() => selectBlock(b.id)} />
        ))}
      </div>
    </div>
  );
}