import "./styles.css";
import "./poster.css";
import { SLOTS, toPercent, type Rect } from "./poster-layout";
import { content as c } from "./content";
import { loadOverlay, type OverlayData } from "./data";
import { esc, featureListHtml, renderDetail } from "./detail";
import type { MapHandle } from "./map";

// Tempatkan elemen di atas desain sesuai koordinat desain 1080×1920.
function place(id: string, rect: Rect) {
  const el = document.getElementById(id);
  if (el) Object.assign(el.style, toPercent(rect));
}

place("poster-qr", SLOTS.qr);
place("poster-instagram", SLOTS.instagram);
place("poster-map", SLOTS.map);

// ---------- peta di slot ----------
// Mini: pratinjau tanpa gestur satu jari dan tanpa kontrol 3D/zoom. Layar penuh: kontrol lengkap, panel detail.
// MapLibre dimuat lazy (mountMap dari ./map) saat slot mendekati viewport, dan hanya setelah gambar brosur selesai dimuat.
const slot = document.getElementById("poster-map")!;
const poster = slot.closest<HTMLElement>(".poster")!;
slot.classList.add("poster-map");
slot.innerHTML = `
  <div class="poster-map__canvas"><p class="map__status">${esc(c.tryIt.loading)}</p></div>
  <button type="button" class="poster-map__expand" aria-controls="poster-map">Perbesar peta</button>
  <button type="button" class="poster-map__close">Tutup peta</button>
  <div class="poster-map__dock">
    <aside class="poster-detail" aria-live="polite"></aside>
    <details class="feature-list poster-map__list">
      <summary>${esc(c.tryIt.listToggle)}</summary>
      <ul class="poster-map__items" role="list"></ul>
    </details>
    <ul class="legend poster-map__legend" role="list">${c.tryIt.legend
      .map((l) => `<li><span class="swatch swatch--${l.key}" aria-hidden="true"></span>${esc(l.label)}</li>`)
      .join("")}</ul>
    <div class="poster-map__foot">
      <p class="poster-map__badge" hidden></p>
      <a class="poster-map__credit" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap</a>
    </div>
  </div>`;

const canvas = slot.querySelector<HTMLElement>(".poster-map__canvas")!;
const badge = slot.querySelector<HTMLElement>(".poster-map__badge")!;
const foot = slot.querySelector<HTMLElement>(".poster-map__foot")!;
const expandBtn = slot.querySelector<HTMLButtonElement>(".poster-map__expand")!;
const closeBtn = slot.querySelector<HTMLButtonElement>(".poster-map__close")!;
const detail = slot.querySelector<HTMLElement>(".poster-detail")!;
const list = slot.querySelector<HTMLDetailsElement>(".poster-map__list")!;
const listItems = slot.querySelector<HTMLElement>(".poster-map__items")!;
renderDetail(detail, null);

// Titik tengah dan sudut kotak data (lon, lat) untuk tampilan awal peta.
function dataBounds(o: OverlayData): [[number, number], [number, number]] | null {
  let w = Infinity, s = Infinity, e = -Infinity, n = -Infinity;
  const visit = (node: unknown): void => {
    const arr = node as unknown[];
    if (typeof arr[0] === "number") {
      const [x, y] = arr as number[];
      w = Math.min(w, x); e = Math.max(e, x); s = Math.min(s, y); n = Math.max(n, y);
    } else arr.forEach(visit);
  };
  for (const f of o.geojson.features) if ("coordinates" in f.geometry) visit(f.geometry.coordinates);
  return Number.isFinite(w) ? [[w, s], [e, n]] : null;
}

let overlayData: OverlayData | null = null;
// Kotak data (lon, lat) untuk fit mini dan layar penuh; diisi saat data overlay siap.
let dataBox: [[number, number], [number, number]] | null = null;
const overlayP = loadOverlay();
overlayP.then((o) => {
  overlayData = o;
  dataBox = dataBounds(o);
  badge.textContent = c.tryIt.badges[o.source];
  badge.dataset.source = o.source;
  badge.hidden = false;
  listItems.innerHTML = featureListHtml(o);
});

let handle: MapHandle | null = null;
let expanded = false;
let savedBodyOverflow = "";
// Tampilan mini yang dipulihkan saat layar penuh ditutup.
let miniView: { center: [number, number]; zoom: number } | null = null;
// True bila layar penuh dibuka sebelum peta selesai dimuat: fit awal mount terukur pada ukuran layar penuh.
let openedDuringLoad = false;
// True bila open() mendorong satu entri riwayat yang belum dibuang.
let historyEntry = false;
const siblings = () => Array.from(poster.children).filter((el): el is HTMLElement => el !== slot);
const FULL_PADDING = { top: 64, right: 16, bottom: 150, left: 16 };
const miniPadding = () => ({ top: 8, left: 8, bottom: foot.offsetHeight + 10, right: expandBtn.offsetWidth + 10 });

// Gestur satu jari hanya aktif di layar penuh; mini tetap menggulir halaman.
function applyMapState() {
  if (!handle) return;
  if (expanded) handle.map.cooperativeGestures.disable();
  else handle.map.cooperativeGestures.enable();
  handle.map.resize();
}

function fitFullscreen() {
  if (handle && dataBox) handle.map.fitBounds(dataBox, { padding: FULL_PADDING, animate: false });
}

// Simpan tampilan mini. Harus dipanggil saat slot sudah berukuran mini (bukan layar penuh).
function captureMiniView() {
  if (!handle) return;
  handle.map.resize();
  if (dataBox) handle.map.fitBounds(dataBox, { padding: miniPadding(), animate: false });
  const c0 = handle.map.getCenter();
  miniView = { center: [c0.lng, c0.lat], zoom: handle.map.getZoom() };
}

function clearSelection() {
  if (handle) handle.clear();
  else renderDetail(detail, null);
}

// Pilihan dari daftar: fokus ke fitur di peta dan tampilkan detailnya; daftar ditutup agar tidak menutupi detail.
function pick(id: string) {
  list.open = false;
  if (handle) {
    handle.focus(id);
    return;
  }
  const f = overlayData?.geojson.features.find((x) => x.properties.id === id);
  renderDetail(detail, f?.properties ?? null);
}
listItems.addEventListener("click", (e) => {
  const id = (e.target as HTMLElement).closest("button")?.dataset.id;
  if (id) pick(id);
});

function open() {
  if (expanded) return;
  expanded = true;
  if (!handle) openedDuringLoad = true;
  // Satu entri riwayat per layar penuh: tombol Kembali menutup layar, bukan meninggalkan halaman.
  history.pushState({ brosurMap: true }, "");
  historyEntry = true;
  savedBodyOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  slot.style.cssText = ""; // posisi dari place() diganti CSS layar penuh
  slot.classList.add("is-expanded");
  slot.setAttribute("role", "dialog");
  slot.setAttribute("aria-modal", "true");
  slot.setAttribute("aria-label", c.tryIt.title);
  // Fokus terkunci di dalam peta selama layar penuh terbuka.
  for (const el of siblings()) el.inert = true;
  applyMapState();
  fitFullscreen();
  closeBtn.focus();
}

// fromPopstate: penutupan karena tombol Kembali; entri riwayat sudah dibuang browser.
function close(fromPopstate = false) {
  if (!expanded) return;
  expanded = false;
  // Mode mini tidak punya tombol 3D; kembalikan ke 2D sebelum keluar.
  const toggle = canvas.querySelector<HTMLButtonElement>(".map-3d-toggle");
  if (toggle?.getAttribute("aria-pressed") === "true") toggle.click();
  clearSelection();
  list.open = false;
  slot.classList.remove("is-expanded");
  slot.removeAttribute("role");
  slot.removeAttribute("aria-modal");
  slot.removeAttribute("aria-label");
  place("poster-map", SLOTS.map);
  document.body.style.overflow = savedBodyOverflow;
  for (const el of siblings()) el.inert = false;
  applyMapState();
  if (handle) {
    if (miniView) handle.map.jumpTo({ center: miniView.center, zoom: miniView.zoom, bearing: 0, pitch: 0 });
    else {
      handle.map.jumpTo({ bearing: 0, pitch: 0 });
      captureMiniView();
    }
  }
  if (historyEntry) {
    historyEntry = false;
    if (!fromPopstate) history.back();
  }
  if (!expandBtn.hidden) expandBtn.focus();
}

expandBtn.addEventListener("click", open);
closeBtn.addEventListener("click", () => close());
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") close();
});
window.addEventListener("popstate", () => {
  if (expanded) close(true);
});
detail.addEventListener("click", (e) => {
  if ((e.target as HTMLElement).closest(".detail__close")) clearSelection();
});
new ResizeObserver(() => handle?.map.resize()).observe(slot);

// Gagal memuat peta: tutup layar penuh bila sedang terbuka, sembunyikan tombol perbesar, tampilkan pesan.
let basemapFailed = false;
function showMapError() {
  basemapFailed = true;
  expandBtn.hidden = true;
  badge.hidden = true; // badge sumber data menimpa pesan di slot mini
  foot.hidden = true; // tanpa peta, kredit OpenStreetMap tidak relevan
  close();
  handle?.map.remove();
  handle = null;
  canvas.innerHTML = `<p class="map__status">${esc(c.tryIt.posterMapError)}</p>`;
}

const io = new IntersectionObserver(
  async (entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    io.disconnect();
    try {
      const overlay = await overlayP;
      const { mountMap } = await import("./map");
      canvas.innerHTML = "";
      const mounted = await mountMap(canvas, overlay, (p) => renderDetail(detail, p), showMapError, {
        locale: c.tryIt.gestures,
        // Mini: pratinjau yang memuat seluruh data, dengan ruang untuk tombol dan kredit.
        fit: dataBox ? { bounds: dataBox, padding: miniPadding() } : undefined,
      });
      if (basemapFailed) {
        // Basemap gagal saat mount: pesan sudah tampil, jadi peta yang baru jadi dibuang.
        mounted.map.remove();
        return;
      }
      handle = mounted;
      if (!openedDuringLoad) {
        const c0 = handle.map.getCenter();
        miniView = { center: [c0.lng, c0.lat], zoom: handle.map.getZoom() };
      } else if (!expanded) {
        // Fit mount diukur pada layar penuh; ukur ulang pada ukuran mini.
        captureMiniView();
      } // masih terbuka: miniView tetap null dan disimpan saat close()
      applyMapState(); // jika sudah diperbesar sebelum peta siap
      if (expanded) fitFullscreen();
      // Ketuk peta mini membuka layar penuh; pilihan segmen sudah diproses mountMap sebelum ini.
      handle.map.on("click", (e) => {
        const target = e.originalEvent.target;
        if (expanded || (target instanceof Element && target.closest(".maplibregl-ctrl"))) return;
        open();
      });
    } catch (err) {
      console.error(err);
      showMapError();
    }
  },
  { rootMargin: "300px" },
);

// Peta baru dimuat setelah gambar brosur selesai (atau gagal), agar gambar utama tidak bersaing dengan MapLibre.
const hero = document.querySelector<HTMLImageElement>(".poster__img");
const heroDone: Promise<void> =
  !hero || hero.complete
    ? Promise.resolve()
    : new Promise((resolve) => {
        hero.addEventListener("load", () => resolve(), { once: true });
        hero.addEventListener("error", () => resolve(), { once: true });
      });
void heroDone.then(() => io.observe(slot));
