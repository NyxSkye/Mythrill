import { create } from "zustand";
import type { Block, BlockType, Page } from "../types/book";
import { loadBook, saveBook } from "../lib/storage";

const uid = () => crypto.randomUUID();
const now = () => Date.now();
const HISTORY_LIMIT = 100;

const makePage = (title: string): Page => ({
  id: uid(), title, background: "plain", blocks: [], createdAt: now(), updatedAt: now(),
});
const touch = (p: Page, patch: Partial<Page>): Page => ({ ...p, ...patch, updatedAt: now() });

type SaveState = "idle" | "saving" | "saved";

type PagesState = {
  pages: Page[];
  currentPageId: string | null;
  selectedBlockId: string | null;
  loaded: boolean;
  saveState: SaveState;
  past: Page[][];
  future: Page[][];
  clipboard: Block | null;

  init: () => Promise<void>;
  addPage: (title?: string) => void;
  deletePage: (id: string) => void;
  movePage: (id: string, toIndex: number) => void;
  renamePage: (id: string, title: string) => void;
  setBackground: (id: string, background: string) => void;
  selectPage: (id: string) => void;
  selectBlock: (id: string | null) => void;

  addBlock: (type: BlockType, content: string, size?: { width: number; height: number }) => void;
  updateBlock: (id: string, patch: Partial<Block>) => void;
  removeBlock: (id: string) => void;
  clearPage: (id: string) => void;

  copySelected: () => void;
  cutSelected: () => void;
  pasteBlock: () => void;
  duplicateSelected: () => void;
  reorderBlock: (id: string, to: "front" | "back") => void;

  undo: () => void;
  redo: () => void;
};

export const usePagesStore = create<PagesState>((set, get) => {
  // Apply a change AND remember the old pages so it can be undone
  const commit = (pages: Page[], extra: Partial<PagesState> = {}) =>
    set((s) => ({
      pages,
      past: [...s.past, s.pages].slice(-HISTORY_LIMIT),
      future: [],
      ...extra,
    }));

  // After undo/redo, make sure the selection still points at something real
  const restore = (s: PagesState, pages: Page[]) => ({
    pages,
    currentPageId: pages.some((p) => p.id === s.currentPageId) ? s.currentPageId : pages[0]?.id ?? null,
    selectedBlockId: pages.some((p) => p.blocks.some((b) => b.id === s.selectedBlockId))
      ? s.selectedBlockId
      : null,
  });

  const findBlock = (id: string | null) => {
    if (!id) return undefined;
    for (const p of get().pages) {
      const b = p.blocks.find((x) => x.id === id);
      if (b) return { block: b, pageId: p.id };
    }
  };

  const insertBlock = (block: Block, pageId: string | null) => {
    const s = get();
    commit(
      s.pages.map((p) => (p.id === pageId ? touch(p, { blocks: [...p.blocks, block] }) : p)),
      { selectedBlockId: block.id }
    );
  };

  return {
    pages: [],
    currentPageId: null,
    selectedBlockId: null,
    loaded: false,
    saveState: "idle",
    past: [],
    future: [],
    clipboard: null,

    init: async () => {
      if (get().loaded) return;
      const saved = await loadBook();
      const pages = saved?.pages.length ? saved.pages : [makePage("Page 1")];
      set({ pages, currentPageId: pages[0].id, loaded: true });
    },

    addPage: (title) => {
      const s = get();
      const p = makePage(title ?? `Page ${s.pages.length + 1}`);
      const i = s.pages.findIndex((x) => x.id === s.currentPageId);
      const pages = [...s.pages];
      pages.splice(i < 0 ? pages.length : i + 1, 0, p);
      commit(pages, { currentPageId: p.id, selectedBlockId: null });
    },

    deletePage: (id) => {
      const s = get();
      if (s.pages.length <= 1) return;
      const i = s.pages.findIndex((p) => p.id === id);
      const pages = s.pages.filter((p) => p.id !== id);
      const currentPageId = s.currentPageId === id ? pages[Math.min(i, pages.length - 1)].id : s.currentPageId;
      commit(pages, { currentPageId, selectedBlockId: null });
    },

    movePage: (id, toIndex) => {
      const s = get();
      const from = s.pages.findIndex((p) => p.id === id);
      if (from < 0 || toIndex < 0 || toIndex >= s.pages.length) return;
      const pages = [...s.pages];
      const [moved] = pages.splice(from, 1);
      pages.splice(toIndex, 0, moved);
      commit(pages);
    },

    renamePage: (id, title) =>
      commit(get().pages.map((p) => (p.id === id ? touch(p, { title }) : p))),

    setBackground: (id, background) =>
      commit(get().pages.map((p) => (p.id === id ? touch(p, { background }) : p))),

    selectPage: (id) => set({ currentPageId: id, selectedBlockId: null }),
    selectBlock: (id) => set({ selectedBlockId: id }),

    addBlock: (type, content, size) => {
      const block: Block = {
        id: uid(),
        type,
        x: 50 + Math.random() * 40,
        y: 50 + Math.random() * 40,
        width: size?.width ?? (type === "text" ? 200 : 180),
        height: size?.height ?? (type === "text" ? 70 : 180),
        rotation: type === "text" ? 0 : Math.round(Math.random() * 8 - 4),
        content,
      };
      insertBlock(block, get().currentPageId);
    },

    updateBlock: (id, patch) =>
      commit(
        get().pages.map((p) =>
          p.blocks.some((b) => b.id === id)
            ? touch(p, { blocks: p.blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)) })
            : p
        )
      ),

    removeBlock: (id) =>
      commit(
        get().pages.map((p) =>
          p.blocks.some((b) => b.id === id) ? touch(p, { blocks: p.blocks.filter((b) => b.id !== id) }) : p
        ),
        { selectedBlockId: null }
      ),
      
    clearPage: (id) => {
      const s = get();
      const page = s.pages.find((p) => p.id === id);
      if (!page || page.blocks.length === 0) return; // nothing to clear, no useless undo step
      commit(
        s.pages.map((p) => (p.id === id ? touch(p, { blocks: [] }) : p)),
        { selectedBlockId: null }
      );
    },

    copySelected: () => {
      const found = findBlock(get().selectedBlockId);
      if (found) set({ clipboard: { ...found.block } });
    },

    cutSelected: () => {
      const id = get().selectedBlockId;
      if (!id) return;
      get().copySelected();
      get().removeBlock(id);
    },

    pasteBlock: () => {
      const clip = get().clipboard;
      if (!clip) return;
      // each paste lands a little lower-right of the last one
      const block: Block = { ...clip, id: uid(), x: clip.x + 24, y: clip.y + 24 };
      insertBlock(block, get().currentPageId);
      set({ clipboard: block });
    },

    duplicateSelected: () => {
      const found = findBlock(get().selectedBlockId);
      if (!found) return;
      const b = found.block;
      insertBlock({ ...b, id: uid(), x: b.x + 24, y: b.y + 24 }, found.pageId);
    },

    reorderBlock: (id, to) => {
      const found = findBlock(id);
      if (!found) return;
      commit(
        get().pages.map((p) => {
          if (p.id !== found.pageId) return p;
          const rest = p.blocks.filter((b) => b.id !== id);
          return touch(p, { blocks: to === "front" ? [...rest, found.block] : [found.block, ...rest] });
        })
      );
    },

    undo: () =>
      set((s) => {
        if (!s.past.length) return s;
        const prev = s.past[s.past.length - 1];
        return { ...restore(s, prev), past: s.past.slice(0, -1), future: [s.pages, ...s.future] };
      }),

    redo: () =>
      set((s) => {
        if (!s.future.length) return s;
        const next = s.future[0];
        return { ...restore(s, next), past: [...s.past, s.pages], future: s.future.slice(1) };
      }),
  };
});

// Autosave: debounced, with a visible status
let timer: ReturnType<typeof setTimeout> | undefined;
usePagesStore.subscribe((state, prev) => {
  if (!state.loaded || state.pages === prev.pages) return;
  usePagesStore.setState({ saveState: "saving" });
  clearTimeout(timer);
  timer = setTimeout(async () => {
    await saveBook({ version: 2, pages: state.pages });
    usePagesStore.setState({ saveState: "saved" });
  }, 500);
});