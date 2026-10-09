import type { CSSProperties } from "react";

export const PAPERS: Record<string, { label: string; css: CSSProperties }> = {
  plain: {
    label: "Plain",
    css: { backgroundColor: "#f3e3c3", backgroundImage: "url(/textures/page.png)", backgroundSize: "cover" },
  },
  grid: {
    label: "Grid",
    css: {
      backgroundColor: "#f3e3c3",
      backgroundImage:
        "linear-gradient(rgba(120,90,50,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(120,90,50,.18) 1px, transparent 1px)",
      backgroundSize: "24px 24px",
    },
  },
  lined: {
    label: "Lined",
    css: {
      backgroundColor: "#f3e3c3",
      backgroundImage: "linear-gradient(rgba(120,90,50,.25) 1px, transparent 1px)",
      backgroundSize: "100% 28px",
    },
  },
};