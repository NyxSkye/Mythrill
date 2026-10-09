export function resizeImage(file: File, max = 1200) {
  return new Promise<{ dataUrl: string; width: number; height: number }>((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve({ dataUrl: c.toDataURL("image/jpeg", 0.85), width: c.width, height: c.height });
    };
    img.onerror = reject;
    img.src = url;
  });
}