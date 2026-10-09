import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { usePagesStore } from "../../store/usePagesStore";
import { resizeImage } from "../../lib/image";
import { PAPERS } from "../../lib/papers";
import { STICKER_PACKS } from "../../lib/assets";

type Tab = "pages" | "add";

const tabBtn = (active: boolean): React.CSSProperties => ({
  flex: 1,
  padding: 8,
  fontWeight: active ? "bold" : "normal",
  background: active ? "#f5e6c8" : "transparent",
  border: "none",
  borderBottom: active ? "3px solid #8a5a2b" : "3px solid transparent",
  cursor: "pointer",
});

export default function PageSidebar() {
  const {
    pages, currentPageId, selectPage, addPage, deletePage, movePage, renamePage,
    addBlock, setBackground,
  } = usePagesStore();

  const [open, setOpen] = useState(true);
  const [tab, setTab] = useState<Tab>("pages");
  const [renaming, setRenaming] = useState<string | null>(null);
  const [packId, setPackId] = useState(STICKER_PACKS[0].id);
  const [query, setQuery] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const current = pages.find((p) => p.id === currentPageId);
  const pack = STICKER_PACKS.find((p) => p.id === packId) ?? STICKER_PACKS[0];

  // With a search term, search ALL packs; otherwise show the selected pack
  const stickers = query.trim()
    ? STICKER_PACKS.flatMap((p) => p.items).filter((i) => i.name.toLowerCase().includes(query.toLowerCase()))
    : pack.items;

  const onPickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { dataUrl, width, height } = await resizeImage(file);
    addBlock("image", dataUrl, { width: 220, height: Math.round((220 * height) / width) });
    e.target.value = "";
  };

  return (
    <motion.aside
      animate={{ width: open ? 280 : 48 }}
      style={{
        background: "#e8d4aa", borderRight: "2px solid #8a5a2b", overflow: "hidden",
        flexShrink: 0, display: "flex", flexDirection: "column", height: "100%",
      }}
    >
      <button onClick={() => setOpen(!open)} style={{ padding: 10 }}>
        {open ? "◀ Collapse" : "▶"}
      </button>

      {open && (
        <>
          <div style={{ display: "flex" }}>
            <button style={tabBtn(tab === "pages")} onClick={() => setTab("pages")}>Pages</button>
            <button style={tabBtn(tab === "add")} onClick={() => setTab("add")}>Add</button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: 8 }}>
            {/* ---------------- PAGES TAB ---------------- */}
            {tab === "pages" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {pages.map((p, i) => (
                  <div
                    key={p.id}
                    onClick={() => selectPage(p.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 4, padding: "6px 8px", cursor: "pointer",
                      background: p.id === currentPageId ? "#f5e6c8" : "transparent",
                      border: "1px solid #8a5a2b55", borderRadius: 4,
                    }}
                  >
                    <span style={{ opacity: 0.6, width: 22 }}>{i + 1}</span>
                    {renaming === p.id ? (
                      <input
                        autoFocus
                        defaultValue={p.title}
                        onClick={(e) => e.stopPropagation()}
                        onBlur={(e) => { renamePage(p.id, e.target.value || p.title); setRenaming(null); }}
                        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                        style={{ flex: 1, minWidth: 0 }}
                      />
                    ) : (
                      <span
                        style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                        onDoubleClick={() => setRenaming(p.id)}
                      >
                        {p.title}
                      </span>
                    )}
                    <button title="Move up" onClick={(e) => { e.stopPropagation(); movePage(p.id, i - 1); }}>↑</button>
                    <button title="Move down" onClick={(e) => { e.stopPropagation(); movePage(p.id, i + 1); }}>↓</button>
                    <button title="Delete" onClick={(e) => { e.stopPropagation(); if (confirm(`Delete "${p.title}"?`)) deletePage(p.id); }}>✕</button>
                  </div>
                ))}
                <button onClick={() => addPage()} style={{ marginTop: 8, padding: 8 }}>+ New page</button>
                <small style={{ opacity: 0.6 }}>Double-click a title to rename</small>
              </div>
            )}

            {/* ---------------- ADD TAB ---------------- */}
            {tab === "add" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <section>
                  <strong>Basics</strong>
                  <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                    <button style={{ flex: 1, padding: 10 }} onClick={() => addBlock("text", "Double-click to edit")}>
                      T  Text
                    </button>
                    <button style={{ flex: 1, padding: 10 }} onClick={() => fileRef.current?.click()}>
                      🖼 Photo
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickImage} />
                  </div>
                </section>

                <section>
                  <strong>Paper</strong>
                  <select
                    style={{ width: "100%", marginTop: 6, padding: 6 }}
                    value={current?.background ?? "plain"}
                    onChange={(e) => current && setBackground(current.id, e.target.value)}
                  >
                    {Object.entries(PAPERS).map(([key, p]) => (
                      <option key={key} value={key}>{p.label}</option>
                    ))}
                  </select>
                </section>

                <section>
                  <strong>Stickers</strong>
                  <input
                    placeholder="Search stickers…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    style={{ width: "100%", boxSizing: "border-box", marginTop: 6, padding: 6 }}
                  />
                  {!query && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, margin: "8px 0" }}>
                      {STICKER_PACKS.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setPackId(p.id)}
                          style={{
                            padding: "4px 10px", borderRadius: 12, cursor: "pointer",
                            border: "1px solid #8a5a2b",
                            background: p.id === packId ? "#8a5a2b" : "transparent",
                            color: p.id === packId ? "#fff" : "inherit",
                          }}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  )}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginTop: 6 }}>
                    {stickers.map((s) => (
                      <button
                        key={s.id}
                        title={s.name}
                        onClick={() => addBlock("sticker", s.src, { width: 120, height: 120 })}
                        style={{ aspectRatio: "1", padding: 4, background: "#f5e6c8", border: "1px solid #8a5a2b55", borderRadius: 6, cursor: "pointer" }}
                      >
                        <img src={s.src} loading="lazy" draggable={false} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                      </button>
                    ))}
                    {stickers.length === 0 && <small>No stickers found</small>}
                  </div>
                </section>
              </div>
            )}
          </div>
        </>
      )}
    </motion.aside>
  );
}