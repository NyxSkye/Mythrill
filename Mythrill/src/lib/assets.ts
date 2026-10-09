export type StickerItem = { id: string; name: string; src: string };
export type StickerPack = { id: string; label: string; items: StickerItem[] };

// Builds items from file names: public/stickers/<pack>/<name>.png
const pack = (id: string, label: string, names: string[]): StickerPack => ({
  id,
  label,
  items: names.map((n) => ({ id: `${id}-${n}`, name: n, src: `/stickers/${id}/${n}.png` })),
});

export const STICKER_PACKS: StickerPack[] = [
  pack("tapes", "Tapes", ["tape1", "tape2", "tape3"]),
  pack("clips", "Clips", ["clip1", "clip2"]),
  pack("stamps", "Stamps", ["stamp1", "stamp2"]),
];