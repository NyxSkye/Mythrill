import { useEffect } from "react";
import { usePagesStore } from "../store/usePagesStore";
import { resizeImage } from "../lib/image";

const MARKER = "memory-book-block"; // written to the system clipboard when you copy a block

const isTyping = (t: EventTarget | null) => {
  const el = t as HTMLElement | null;
  return !!el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));
};

export function useEditorShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return; // let the browser handle typing and its own undo
      const s = usePagesStore.getState();
      const mod = e.ctrlKey || e.metaKey;
      const k = e.key.toLowerCase();
      const sel = s.selectedBlockId;

      if (mod && k === "z") { e.preventDefault(); e.shiftKey ? s.redo() : s.undo(); }
      else if (mod && k === "y") { e.preventDefault(); s.redo(); }
      else if (mod && k === "c" && sel) {
        e.preventDefault();
        s.copySelected();
        navigator.clipboard?.writeText(MARKER).catch(() => {});
      }
      else if (mod && k === "x" && sel) {
        e.preventDefault();
        s.cutSelected();
        navigator.clipboard?.writeText(MARKER).catch(() => {});
      }
      else if (mod && k === "d" && sel) { e.preventDefault(); s.duplicateSelected(); }
      else if ((k === "delete" || k === "backspace") && sel) { e.preventDefault(); s.removeBlock(sel); }
      else if (k === "escape") s.selectBlock(null);
    };

    const onPaste = async (e: ClipboardEvent) => {
      if (isTyping(e.target)) return;
      const s = usePagesStore.getState();

      // 1. an image from anywhere (screenshot, browser, file manager)
      const file = Array.from(e.clipboardData?.files ?? []).find((f) => f.type.startsWith("image/"));
      if (file) {
        e.preventDefault();
        const { dataUrl, width, height } = await resizeImage(file);
        s.addBlock("image", dataUrl, { width: 220, height: Math.round((220 * height) / width) });
        return;
      }

      const text = e.clipboardData?.getData("text/plain") ?? "";
      // 2. a block copied inside the editor
      if (text === MARKER || (!text && s.clipboard)) {
        e.preventDefault();
        s.pasteBlock();
      }
      // 3. plain text from elsewhere becomes a text block
      else if (text.trim()) {
        e.preventDefault();
        s.addBlock("text", text);
      }
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("paste", onPaste);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("paste", onPaste);
    };
  }, []);
}