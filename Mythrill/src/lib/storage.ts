import localforage from "localforage";
import type { BookData, Page } from "../types/book";

const KEY = "memory-book";

type StoredBook = { version: number; pages: Partial<Page>[] };

// Fill in anything missing, so old saves keep working
function normalizePage(p: Partial<Page>): Page {
  const now = Date.now();
  return {
    id: p.id ?? crypto.randomUUID(),
    title: p.title ?? "Untitled",
    background: p.background ?? "plain",
    blocks: p.blocks ?? [],
    createdAt: p.createdAt ?? now,
    updatedAt: p.updatedAt ?? now,
  };
}

export async function loadBook(): Promise<BookData | null> {
  const raw = await localforage.getItem<StoredBook>(KEY);
  if (!raw || !Array.isArray(raw.pages)) return null;
  return { version: 2, pages: raw.pages.map(normalizePage) };
}

export async function saveBook(data: BookData) {
  await localforage.setItem(KEY, data);
}