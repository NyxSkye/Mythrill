import { useState, type CSSProperties } from "react";
import type { Block } from "../../../types/book";
import { usePagesStore } from "../../../store/usePagesStore";

type Props = { block: Block; onSelect: () => void };

export default function BlockView({ block, onSelect }: Props) {
  const updateBlock = usePagesStore((s) => s.updateBlock);
  const [editing, setEditing] = useState(false);

  const style: CSSProperties = {
    position: "absolute",
    left: block.x,
    top: block.y,
    width: block.width,
    height: block.height,
    transform: `rotate(${block.rotation}deg)`,
    userSelect: "none",
    cursor: "move",
  };

  return (
    <div
      id={`block-${block.id}`}
      style={style}
      onMouseDown={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onDoubleClick={() => block.type === "text" && setEditing(true)}
    >
      {block.type === "text" &&
        (editing ? (
          <textarea
            autoFocus
            defaultValue={block.content}
            onBlur={(e) => {
              updateBlock(block.id, { content: e.target.value });
              setEditing(false);
            }}
            style={{ width: "100%", height: "100%", font: "inherit", resize: "none", boxSizing: "border-box" }}
          />
        ) : (
          <div style={{ whiteSpace: "pre-wrap", width: "100%", height: "100%", overflow: "hidden" }}>
            {block.content}
          </div>
        ))}

      {block.type === "image" && (
        <img
          src={block.content}
          draggable={false}
          style={{ width: "100%", height: "100%", objectFit: "cover", border: "8px solid #fff", boxSizing: "border-box", boxShadow: "0 3px 8px rgba(0,0,0,.3)" }}
        />
      )}

      {block.type === "sticker" && (
        <img src={block.content} draggable={false} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      )}
    </div>
  );
}