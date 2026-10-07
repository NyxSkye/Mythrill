export type BlockType = "text" | "image" | "sticker";

export type Block = {
  id: string;
  type: BlockType;
  x: number;
  y: number;
  rotation: number;
  content: string;
};

export type Page = {
  id: string;
  title: string;
  blocks: Block[];
};

export type BookData = {
  version: 1;
  pages: Page[];
};