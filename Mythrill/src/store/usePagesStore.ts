import { create } from "zustand";
import type { Block, BlockType, Page } from "../types/book";
import { loadBook, saveBook } from "../lib/storage";

const uid = () => crypto.randomUUID();
const now = () => Date.now();

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
};

export const usePagesStore = create<PagesState>((set, get) => ({
  pages: [],
  currentPageId: null,
  selectedBlockId: null,
  loaded: false,
  saveState: "idle",

  init: async () => {
    if (get().loaded) return;
    const saved = await loadBook();
    const pages = saved?.pages.length ? saved.pages : [makePage("Page 1")];
    set({ pages, currentPageId: pages[0].id, loaded: true });
  },

  addPage: (title) =>
    set((s) => {
      const p = makePage(title ?? `Page ${s.pages.length + 1}`);
      const i = s.pages.findIndex((x) => x.id === s.currentPageId);
      const pages = [...s.pages];
      pages.splice(i < 0 ? pages.length : i + 1, 0, p);
      return { pages, currentPageId: p.id, selectedBlockId: null };
    }),

  deletePage: (id) =>
    set((s) => {
      if (s.pages.length <= 1) return s; // always keep one page
      const i = s.pages.findIndex((p) => p.id === id);
      const pages = s.pages.filter((p) => p.id !== id);
      const currentPageId =
        s.currentPageId === id ? pages[Math.min(i, pages.length - 1)].id : s.currentPageId;
      return { pages, currentPageId, selectedBlockId: null };
    }),

  movePage: (id, toIndex) =>
    set((s) => {
      const from = s.pages.findIndex((p) => p.id === id);
      if (from < 0 || toIndex < 0 || toIndex >= s.pages.length) return s;
      const pages = [...s.pages];
      const [moved] = pages.splice(from, 1);
      pages.splice(toIndex, 0, moved);
      return { pages };
    }),

  renamePage: (id, title) =>
    set((s) => ({ pages: s.pages.map((p) => (p.id === id ? touch(p, { title }) : p)) })),

  setBackground: (id, background) =>
    set((s) => ({ pages: s.pages.map((p) => (p.id === id ? touch(p, { background }) : p)) })),

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
    set((s) => ({
      pages: s.pages.map((p) =>
        p.id === s.currentPageId ? touch(p, { blocks: [...p.blocks, block] }) : p
      ),
      selectedBlockId: block.id,
    }));
  },

  updateBlock: (id, patch) =>
    set((s) => ({
      pages: s.pages.map((p) =>
        p.blocks.some((b) => b.id === id)
          ? touch(p, { blocks: p.blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)) })
          : p
      ),
    })),

  removeBlock: (id) =>
    set((s) => ({
      pages: s.pages.map((p) =>
        p.blocks.some((b) => b.id === id)
          ? touch(p, { blocks: p.blocks.filter((b) => b.id !== id) })
          : p
      ),
      selectedBlockId: null,
    })),
}));

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