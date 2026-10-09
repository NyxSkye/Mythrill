import type { Block, Page } from "../types/book";
import { PAPERS } from "./papers"; // not used for drawing, kept so paper keys stay in one place
import { PAGE_W, PAGE_H } from "../components/book/PageCanvas";

const imgCache = new Map<string, Promise<HTMLImageElement | null>>();

function loadImage(src: string) {
  let p = imgCache.get(src);
  if (!p) {
    p = new Promise<HTMLImageElement | null>((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
    imgCache.set(src, p);
  }
  return p;
}

function drawFit(
  ctx: CanvasRenderingContext2D, img: HTMLImageElement,
  x: number, y: number, w: number, h: number, mode: "cover" | "contain"
) {
  const r = mode === "cover" ? Math.max(w / img.width, h / img.height) : Math.min(w / img.width, h / img.height);
  const dw = img.width * r, dh = img.height * r;
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  ctx.restore();
}

function drawPaper(ctx: CanvasRenderingContext2D, bg: string, tex: HTMLImageElement | null) {
  ctx.fillStyle = "#f3e3c3";
  ctx.fillRect(0, 0, PAGE_W, PAGE_H);
  ctx.strokeStyle = "rgba(120,90,50,.2)";
  ctx.lineWidth = 1;
  if (bg === "plain" && tex) drawFit(ctx, tex, 0, 0, PAGE_W, PAGE_H, "cover");
  if (bg === "grid") {
    for (let x = 0; x <= PAGE_W; x += 24) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, PAGE_H); ctx.stroke(); }
    for (let y = 0; y <= PAGE_H; y += 24) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(PAGE_W, y); ctx.stroke(); }
  }
  if (bg === "lined") {
    for (let y = 28; y <= PAGE_H; y += 28) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(PAGE_W, y); ctx.stroke(); }
  }
}

function drawText(ctx: CanvasRenderingContext2D, b: Block) {
  const family = getComputedStyle(document.body).fontFamily;
  ctx.font = `16px ${family}`;
  ctx.fillStyle = "#3b2a1a";
  ctx.textBaseline = "top";
  let y = 0;
  for (const para of b.content.split("\n")) {
    let line = "";
    for (const word of para.split(" ")) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > b.width && line) {
        ctx.fillText(line, 0, y); y += 19; line = word;
      } else line = test;
    }
    ctx.fillText(line, 0, y); y += 19;
    if (y > b.height) break;
  }
}

async function drawBlock(ctx: CanvasRenderingContext2D, b: Block) {
  ctx.save();
  ctx.translate(b.x + b.width / 2, b.y + b.height / 2);
  ctx.rotate((b.rotation * Math.PI) / 180);
  ctx.translate(-b.width / 2, -b.height / 2);

  if (b.type === "text") {
    ctx.beginPath(); ctx.rect(0, 0, b.width, b.height); ctx.clip();
    drawText(ctx, b);
  } else {
    const img = await loadImage(b.content);
    if (img && b.type === "image") {
      ctx.shadowColor = "rgba(0,0,0,.3)"; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, b.width, b.height);
      ctx.shadowColor = "transparent";
      drawFit(ctx, img, 8, 8, b.width - 16, b.height - 16, "cover");
    } else if (img) {
      drawFit(ctx, img, 0, 0, b.width, b.height, "contain");
    }
  }
  ctx.restore();
}

export async function renderPageToCanvas(page: Page | undefined, scale = 1.5) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(PAGE_W * scale);
  canvas.height = Math.round(PAGE_H * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.scale(scale, scale);

  const tex = await loadImage("/textures/page.jpg");
  drawPaper(ctx, page?.background ?? "plain", tex);
  for (const b of page?.blocks ?? []) await drawBlock(ctx, b);
  return canvas;
}

void PAPERS;