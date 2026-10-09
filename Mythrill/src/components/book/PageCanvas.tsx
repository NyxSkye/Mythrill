import { useEffect, useRef } from "react";
import MoveableLib from "moveable";
import type { OnDrag, OnDragStart, OnResize, OnResizeStart, OnRotate, OnRotateStart } from "moveable";
import type { Page } from "../../types/book";
import { usePagesStore } from "../../store/usePagesStore";
import { PAPERS } from "../../lib/papers";
import BlockView from "./blocks/BlockView";

export const PAGE_W = 420;
export const PAGE_H = 570;

type Props = { page: Page | undefined; side: "left" | "right"; active: boolean };

type Frame = { x: number; y: number; w: number; h: number; r: number };

// Read the block's saved values straight from the store (always the latest)
function readFrame(id: string): Frame {
  for (const p of usePagesStore.getState().pages) {
    const b = p.blocks.find((x) => x.id === id);
    if (b) return { x: b.x, y: b.y, w: b.width, h: b.height, r: b.rotation };
  }
  return { x: 0, y: 0, w: 100, h: 100, r: 0 };
}

export default function PageCanvas({ page, side, active }: Props) {
  const outerRef = useRef<HTMLDivElement>(null);
  const moveableRef = useRef<MoveableLib | null>(null);

  const selectedBlockId = usePagesStore((s) => s.selectedBlockId);
  const selectPage = usePagesStore((s) => s.selectPage);
  const selectBlock = usePagesStore((s) => s.selectBlock);
  const updateBlock = usePagesStore((s) => s.updateBlock);

  const selected = active ? page?.blocks.find((b) => b.id === selectedBlockId) : undefined;
  const selectedId = selected?.id;
  const selectedType = selected?.type;

  useEffect(() => {
    const container = outerRef.current;
    const el = selectedId ? document.getElementById(`block-${selectedId}`) : null;
    if (!container || !el || !selectedId) return;

    const id = selectedId;
    let f: Frame = readFrame(id);

    const apply = (t: HTMLElement | SVGElement) => {
      t.style.width = `${f.w}px`;
      t.style.height = `${f.h}px`;
      t.style.transform = `translate(${f.x}px, ${f.y}px) rotate(${f.r}deg)`;
    };
    // One store update per gesture = one undo step
    const commit = () =>
      updateBlock(id, { x: f.x, y: f.y, width: f.w, height: f.h, rotation: f.r });

    const m = new MoveableLib(container, {
      target: el,
      draggable: true,
      resizable: true,
      rotatable: true,
      keepRatio: selectedType !== "text",
      origin: false,
      throttleDrag: 0,
      throttleResize: 0,
      throttleRotate: 0,
    });

    m.on("dragStart", (e: OnDragStart) => { f = readFrame(id); e.set([f.x, f.y]); });
    m.on("drag", (e: OnDrag) => {
      f.x = e.beforeTranslate[0];
      f.y = e.beforeTranslate[1];
      apply(e.target);
    });
    m.on("dragEnd", (e) => { if (e.isDrag) commit(); });

    m.on("resizeStart", (e: OnResizeStart) => {
      f = readFrame(id);
      e.setOrigin(["%", "%"]);
      if (e.dragStart) e.dragStart.set([f.x, f.y]);
    });
    m.on("resize", (e: OnResize) => {
      f.w = e.width;
      f.h = e.height;
      f.x = e.drag.beforeTranslate[0];
      f.y = e.drag.beforeTranslate[1];
      apply(e.target);
    });
    m.on("resizeEnd", (e) => { if (e.isDrag) commit(); });

    m.on("rotateStart", (e: OnRotateStart) => { f = readFrame(id); e.set(f.r); });
    m.on("rotate", (e: OnRotate) => {
      f.r = e.beforeRotate;
      apply(e.target);
    });
    m.on("rotateEnd", (e) => { if (e.isDrag) commit(); });

    moveableRef.current = m;
    return () => {
      m.destroy();
      moveableRef.current = null;
    };
  }, [selectedId, selectedType, updateBlock]);

  // Re-align the handles after undo, redo, or any data change
  useEffect(() => {
    moveableRef.current?.updateRect();
  }, [selected]);

  const paper = PAPERS[page?.background ?? "plain"] ?? PAPERS.plain;
  const spineShade =
    side === "left"
      ? "linear-gradient(to left, rgba(60,35,10,.28), transparent 14%)"
      : "linear-gradient(to right, rgba(60,35,10,.28), transparent 14%)";

  return (
    <div
      ref={outerRef}
      onMouseDown={(e) => {
        if (!page) return;
        // pressing a Moveable handle must not count as "clicked empty paper"
        if ((e.target as HTMLElement).closest(".moveable-control-box")) return;
        if (!active) selectPage(page.id);
        else selectBlock(null);
      }}
      style={{
        position: "relative",
        width: PAGE_W,
        height: PAGE_H,
        opacity: page ? 1 : 0.35,
        outline: active ? "2px solid rgba(138,90,43,.55)" : "none",
        boxShadow: "0 8px 24px rgba(0,0,0,.28)",
      }}
    >
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", ...paper.css }}>
        {page?.blocks.map((b) => (
          <BlockView
            key={b.id}
            block={b}
            onSelect={() => {
              if (!active) selectPage(page.id);
              selectBlock(b.id);
            }}
          />
        ))}
        <div style={{ position: "absolute", inset: 0, background: spineShade, pointerEvents: "none" }} />
      </div>
    </div>
  );
}