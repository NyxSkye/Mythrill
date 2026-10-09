export type BlockType = "text" | "image" | "sticker";

export type Block = {
  id: string;
  type: BlockType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // degrees
  content: string;  // text, or an image URL / data URL
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