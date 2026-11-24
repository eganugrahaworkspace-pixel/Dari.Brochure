// Posisi elemen di atas desain brosur 1080×1920 (satuan piksel desain).
// Tanpa import dan tanpa fitur TypeScript non-erasable agar bisa dijalankan node --test langsung.

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const DESIGN = { w: 1080, h: 1920 } as const;

// map: area kosong di bawah bagian "About" (desain y 1101–1469), untuk peta di Task 2.
// qr / instagram: tautan di atas gambar desain.
export const SLOTS: Record<"map" | "qr" | "instagram", Rect> = {
  map: { x: 40, y: 1105, w: 1000, h: 360 },
  qr: { x: 725, y: 1650, w: 157, h: 156 },
  instagram: { x: 345, y: 1645, w: 185, h: 50 },
};

const pct = (value: number, total: number): string => `${+((value / total) * 100).toFixed(4)}%`;

export function toPercent(r: Rect): { left: string; top: string; width: string; height: string } {
  return {
    left: pct(r.x, DESIGN.w),
    top: pct(r.y, DESIGN.h),
    width: pct(r.w, DESIGN.w),
    height: pct(r.h, DESIGN.h),
  };
}
