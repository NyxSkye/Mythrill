import { create } from "zustand";
import type { Block, BlockType, Page } from "../types/book";
import { loadBook, saveBook } from "../lib/storage";

const uid = () => crypto.randomUUID();

type PagesState = {
  pages: Page[];
  currentPageId: string | null;
  selectedBlockId: string | null;
  loaded: boolean;
  init: () => Promise<void>;
  addPage: (title?: string) => void;
  selectPage: (id: string) => void;
  selectBlock: (id: string | null) => void;
  addBlock: (type: BlockType, content: string, size?: { width: number; height: number }) => void;
  updateBlock: (id: string, patch: Partial<Block>) => void;
  removeBlock: (id: string) => void;
};

const newPage = (title: string): Page => ({ id: uid(), title, blocks: [] });

export const usePagesStore = create<PagesState>((set, get) => ({
  pages: [],
  currentPageId: null,
  selectedBlockId: null,
  loaded: false,

  init: async () => {
    if (get().loaded) return;
    const saved = await loadBook();
    const pages = saved?.pages.length ? saved.pages : [newPage("My first page")];
    set({ pages, currentPageId: pages[0].id, loaded: true });
  },

  addPage: (title = "Untitled") => {
    const p = newPage(title);
    set((s) => ({ pages: [...s.pages, p], currentPageId: p.id, selectedBlockId: null }));
  },

  selectPage: (id) => set({ currentPageId: id, selectedBlockId: null }),
  selectBlock: (id) => set({ selectedBlockId: id }),

  addBlock: (type, content, size) => {
    const block: Block = {
      id: uid(),
      type,
      x: 60 + Math.random() * 40,
      y: 60 + Math.random() * 40,
      width: size?.width ?? (type === "text" ? 220 : 200),
      height: size?.height ?? (type === "text" ? 80 : 200),
      rotation: type === "text" ? 0 : Math.round(Math.random() * 8 - 4), // slight scrapbook tilt
      content,
    };
    set((s) => ({
      pages: s.pages.map((p) =>
        p.id === s.currentPageId ? { ...p, blocks: [...p.blocks, block] } : p
      ),
      selectedBlockId: block.id,
    }));
  },

  updateBlock: (id, patch) =>
    set((s) => ({
      pages: s.pages.map((p) =>
        p.id === s.currentPageId
          ? { ...p, blocks: p.blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)) }
          : p
      ),
    })),

  removeBlock: (id) =>
    set((s) => ({
      pages: s.pages.map((p) =>
        p.id === s.currentPageId ? { ...p, blocks: p.blocks.filter((b) => b.id !== id) } : p
      ),
      selectedBlockId: null,
    })),
}));

// Autosave: debounced, runs after any change to pages
let timer: ReturnType<typeof setTimeout> | undefined;
usePagesStore.subscribe((state, prev) => {
  if (!state.loaded || state.pages === prev.pages) return;
  clearTimeout(timer);
  timer = setTimeout(() => saveBook({ version: 1, pages: state.pages }), 500);
});