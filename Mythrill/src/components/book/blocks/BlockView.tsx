import { useState, type CSSProperties } from "react";
import type { Block } from "../../../types/book";
import { usePagesStore } from "../../../store/usePagesStore";

const DEFAULT_TEXT_CONTENT = "Double-click to edit";

type Props = { block: Block; onSelect: () => void };

export default function BlockView({ block, onSelect }: Props) {
  const updateBlock = usePagesStore((s) => s.updateBlock);
  const [editing, setEditing] = useState(false);
  const textStyle: CSSProperties = {
    ...(block.fontFamily ? { fontFamily: block.fontFamily } : {}),
    ...(block.fontSize ? { fontSize: block.fontSize } : {}),
    ...(block.color ? { color: block.color } : {}),
    ...(block.bold ? { fontWeight: 700 } : {}),
    ...(block.italic ? { fontStyle: "italic" } : {}),
    ...(block.underline ? { textDecoration: "underline" } : {}),
    ...(block.textAlign ? { textAlign: block.textAlign } : {}),
  };

  const style: CSSProperties = {
    position: "absolute",
    left: 0,
    top: 0,
    width: block.width,
    height: block.height,
    transform: `translate(${block.x}px, ${block.y}px) rotate(${block.rotation}deg)`,
    userSelect: "none",
    cursor: "move",
    touchAction: "none",
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
            defaultValue={block.content === DEFAULT_TEXT_CONTENT ? "" : block.content}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                e.currentTarget.blur();
              }
            }}
            onBlur={(e) => {
              if (e.target.value !== block.content) updateBlock(block.id, { content: e.target.value });
              setEditing(false);
            }}
            style={{ ...textStyle, width: "100%", height: "100%", resize: "none", boxSizing: "border-box" }}
          />
        ) : (
          <div style={{ ...textStyle, whiteSpace: "pre-wrap", width: "100%", height: "100%", overflow: "hidden" }}>
            {block.content}
          </div>
        ))}

      {block.type === "image" && (
        <img
          src={block.content}
          draggable={false}
          style={{
            width: "100%", height: "100%", objectFit: "cover",
            border: "8px solid #fff", boxSizing: "border-box", boxShadow: "0 3px 8px rgba(0,0,0,.3)",
          }}
        />
      )}

      {block.type === "sticker" && (
        <img src={block.content} draggable={false} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      )}
    </div>
  );
}