# Dari. — Brosur Web "Blok M, Dipetakan Ulang"

Brosur satu halaman untuk exhibition, dibuka dari QR di booth.

## Menjalankan

```bash
cd apps/web-brochure
npm install
npm run dev        # http://localhost:5173 (juga terbuka di LAN untuk dites dari HP)
npm run build      # typecheck + build ke dist/
npm run preview    # sajikan dist/ (bisa jadi cadangan offline di booth)
```

`predev` dan `prebuild` menjalankan `scripts/sync-map-assets.mjs` secara otomatis. Script ini menyalin basemap PMTiles Blok M, gaya Dari Day, dan glyph Noto dari `apps/ios/dari/dari/Resources/DariMap/` ke `public/map/`. Folder `public/map/` tidak di-commit.

## Mengubah isi

Semua teks ada di `src/content.ts`. Sebelum event:

- `cta.whatsapp` / `cta.formUrl` / `cta.email`: kontak resmi tim. Selama masih `null`, tombol disembunyikan.
- `hook.stat`: isi **hanya** dengan angka yang bisa ditelusuri ke data pilot yang disetujui.
- Aturan copy: tidak ada klaim kemitraan, tidak ada logo instansi, dan selalu sebut "estimasi".

## Data peta (gate)

| File | Isi | Di Git? |
|---|---|---|
| `public/data/demo.geojson` | Data **sintetis** untuk ilustrasi | Ya |
| `public/data/pilot-public.geojson` | Ekspor pilot Blok M yang **sudah disetujui** tim | Tidak (gitignored) |

Jika `pilot-public.geojson` ada, situs memakainya dengan badge "Pilot riset — belum diverifikasi". Jika tidak, situs memakai demo dengan badge "Data ilustrasi". Properti di luar allowlist (`src/data.ts`) dibuang saat render.

## Struktur

```
index.html              kerangka + meta
src/content.ts          semua copy
src/main.ts             render 7 section, list fallback, lazy-load peta
src/map.ts              MapLibre + PMTiles + layer overlay Dari
src/data.ts             model data, gate pilot, label Bahasa Indonesia
scripts/sync-map-assets.mjs
vercel.json             header keamanan (CSP) + cache
```

## Atribusi & lisensi aset

- Basemap: © OpenStreetMap contributors (ODbL) · Protomaps
- Font: Noto Sans (SIL OFL 1.1). `NotoSans-OFL.txt` ikut disalin.
- Sprite Dari **tidak** dipakai karena belum punya lisensi rilis publik (PROVENANCE L-01).
