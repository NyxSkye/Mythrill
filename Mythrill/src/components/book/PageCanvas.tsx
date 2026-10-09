import { useEffect, useRef } from "react";
import MoveableLib from "moveable";
import type { OnDrag, OnResize, OnRotate } from "moveable";
import type { Page } from "../../types/book";
import { usePagesStore } from "../../store/usePagesStore";
import { PAPERS } from "../../lib/papers";
import BlockView from "./blocks/BlockView";

export const PAGE_W = 400;
export const PAGE_H = 400;

type Props = { page: Page | undefined; side: "left" | "right"; active: boolean };

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
  }, [selectedId, selectedType, updateBlock]);

  useEffect(() => {
    moveableRef.current?.updateRect();
  }, [selected]);

  const paper = PAPERS[page?.background ?? "plain"] ?? PAPERS.plain;
  // Darken the edge near the spine so the two pages feel like one book
  const spineShade =
    side === "left"
      ? "linear-gradient(to left, rgba(60,35,10,.28), transparent 14%)"
      : "linear-gradient(to right, rgba(60,35,10,.28), transparent 14%)";

  return (
    <div
      ref={outerRef}
      onMouseDown={() => {
        if (!page) return;
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