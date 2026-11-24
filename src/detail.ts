// Helpers shared by the index.html map section and the brosur poster map.
import { content as c } from "./content";
import { describe, type FeatureProps, type OverlayData } from "./data";

export const esc = (s: string) =>
  s.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!);

// Text alternative to the map: one button per feature (the caller wires the click).
export function featureListHtml(overlay: OverlayData): string {
  return overlay.geojson.features
    .map((f) => {
      const d = describe(f.properties);
      return `<li><button type="button" data-id="${esc(f.properties.id)}"><strong>${esc(d.title)}</strong> — ${d.rows
        .slice(1)
        .map(([k, v]) => `${esc(k)}: ${esc(v)}`)
        .join(" · ")}</button></li>`;
    })
    .join("");
}

// On phones the detail is a bottom sheet over the map; data-state drives its size (styles.css).
export function renderDetail(el: HTMLElement, p: FeatureProps | null) {
  el.dataset.state = p ? "open" : "empty";
  if (!p) {
    el.innerHTML = `<p class="detail__empty">${esc(c.tryIt.emptyDetail)}</p>`;
    return;
  }
  const d = describe(p);
  el.innerHTML = `<div class="detail__head"><h3>${esc(d.title)}</h3><button type="button" class="detail__close" aria-label="Tutup detail">✕</button></div><dl>${d.rows
    .map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`)
    .join("")}</dl>`;
}
