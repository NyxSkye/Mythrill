export type BlockType = "text" | "image" | "sticker";

export type Block = {
  id: string;
  type: BlockType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  content: string;
};

export type Page = {
  id: string;
  title: string;
  background: string; // key into PAPERS (plain, grid, lined...)
  blocks: Block[];
  createdAt: number;
  updatedAt: number;
};

export type BookData = {
  version: 2;
  pages: Page[];
};