import localforage from "localforage";
import type { BookData } from "../types/book";

const KEY = "memory-book";

export async function loadBook(): Promise<BookData | null> {
  const data = await localforage.getItem<BookData>(KEY);
  if (!data || data.version !== 1) return null; // future: migrate old versions here
  return data;
}

export async function saveBook(data: BookData) {
  await localforage.setItem(KEY, data);
}