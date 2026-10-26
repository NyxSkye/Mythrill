export type BlockType = "text" | "image" | "sticker";
export type TextAlignment = "left" | "center" | "right";

export type Block = {
  id: string;
  type: BlockType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  content: string;
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  textAlign?: TextAlignment;
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