import "./styles.css";
import { content as c, type Card } from "./content";
import { loadOverlay, type OverlayData } from "./data";
import { esc, featureListHtml, renderDetail } from "./detail";

const cards = (items: Card[], numbered = false) =>
  `<ol class="cards${numbered ? " cards--steps" : ""}" role="list">${items
    .map(
      (it, i) =>
        `<li class="card">${numbered ? `<span class="card__num" aria-hidden="true">${i + 1}</span>` : ""}<h3>${esc(it.title)}</h3><p>${esc(it.body)}</p></li>`,
    )
    .join("")}</ol>`;

function ctaButtons(): string {
  const btns: string[] = [];
  if (c.cta.whatsapp) {
    const url = `https://wa.me/${c.cta.whatsapp.number}?text=${encodeURIComponent(c.cta.whatsapp.message)}`;
    btns.push(`<a class="btn btn--primary" href="${esc(url)}" target="_blank" rel="noopener" data-track="cta_whatsapp">Chat via WhatsApp</a>`);
  }
  if (c.cta.formUrl)
    btns.push(`<a class="btn" href="${esc(c.cta.formUrl)}" target="_blank" rel="noopener" data-track="cta_form">Isi formulir singkat</a>`);
  if (c.cta.email) btns.push(`<a class="btn" href="mailto:${esc(c.cta.email)}" data-track="cta_email">Kirim email</a>`);
  return btns.length ? `<div class="cta__actions">${btns.join("")}</div>` : `<p class="cta__fallback">${esc(c.cta.fallback)}</p>`;
}

// ---------- page ----------
function render(root: HTMLElement) {
  const stat = c.hook.stat
    ? `<p class="hook__stat"><strong>${esc(c.hook.stat.value)}</strong> ${esc(c.hook.stat.label)}<small>Sumber: ${esc(c.hook.stat.source)}</small></p>`
    : "";

  root.innerHTML = `
  <header class="hook" id="top">
    <div class="hook__media" role="img" aria-label="${esc(c.hook.imageNote)}"><span>${esc(c.hook.imageNote)}</span></div>
    <div class="wrap hook__body">
      <p class="eyebrow">${esc(c.hook.eyebrow)}</p>
      <h1>${esc(c.hook.title)}</h1>
      <p class="hook__question">${esc(c.hook.question)}</p>
      ${stat}
      <a class="btn btn--primary" href="#coba" data-track="hook_cta">${esc(c.hook.cta)} ↓</a>
    </div>
  </header>

  <main>
    <section class="section" aria-labelledby="masalah-h">
      <div class="wrap">
        <h2 id="masalah-h">${esc(c.problem.title)}</h2>
        <p class="lead">${esc(c.problem.lead)}</p>
        ${cards(c.problem.cards)}
      </div>
    </section>

    <section class="section section--map" id="coba" aria-labelledby="coba-h">
      <div class="wrap">
        <h2 id="coba-h">${esc(c.tryIt.title)}</h2>
        <p class="lead">${esc(c.tryIt.lead)}</p>
        <p class="badge" id="data-badge" hidden></p>
      </div>
      <div class="map-shell">
        <div id="map" class="map" aria-label="Peta interaktif trotoar Blok M"><p class="map__status">${esc(c.tryIt.loading)}</p></div>
        <aside class="detail" id="detail" aria-live="polite"><p class="detail__empty">${esc(c.tryIt.emptyDetail)}</p></aside>
      </div>
      <div class="wrap">
        <ul class="legend" role="list">${c.tryIt.legend
          .map((l) => `<li><span class="swatch swatch--${l.key}" aria-hidden="true"></span>${esc(l.label)}</li>`)
          .join("")}</ul>
        <details class="feature-list">
          <summary>${esc(c.tryIt.listToggle)}</summary>
          <ul id="feature-list" role="list"></ul>
        </details>
      </div>
    </section>

    <section class="section section--alt" aria-labelledby="cara-h">
      <div class="wrap">
        <h2 id="cara-h">${esc(c.howItWorks.title)}</h2>
        ${cards(c.howItWorks.steps, true)}
      </div>
    </section>

    <section class="section" aria-labelledby="manfaat-h">
      <div class="wrap">
        <h2 id="manfaat-h">${esc(c.benefits.title)}</h2>
        <p class="lead">${esc(c.benefits.lead)}</p>
        ${cards(c.benefits.cards)}
      </div>
    </section>

    <section class="section section--alt" aria-labelledby="transparansi-h">
      <div class="wrap">
        <h2 id="transparansi-h">${esc(c.transparency.title)}</h2>
        <ul class="checks" role="list">${c.transparency.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
      </div>
    </section>

    <section class="section cta" id="kontak" aria-labelledby="cta-h">
      <div class="wrap">
        <h2 id="cta-h">${esc(c.cta.title)}</h2>
        <p class="lead">${esc(c.cta.lead)}</p>
        ${ctaButtons()}
      </div>
    </section>
  </main>

  <footer class="footer">
    <div class="wrap">
      <p>${esc(c.footer.note)}</p>
      <p>${esc(c.footer.attribution)}</p>
      ${c.footer.engineers.href ? `<p><a href="${esc(c.footer.engineers.href)}">${esc(c.footer.engineers.label)} →</a></p>` : ""}
    </div>
  </footer>

  <a class="sticky-cta" id="sticky-cta" href="#kontak" data-track="sticky_cta" hidden>${esc(c.cta.stickyLabel)} →</a>`;
}

// Phone-only floating CTA: hidden while the hook, the map (bottom sheet) or the CTA itself is on screen.
function initStickyCta() {
  const bar = document.getElementById("sticky-cta")!;
  const watched = ["top", "coba", "kontak"].map((id) => document.getElementById(id)!);
  const visible = new Set<Element>();
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) e.isIntersecting ? visible.add(e.target) : visible.delete(e.target);
      bar.hidden = visible.size > 0;
    },
    { threshold: 0.05 },
  );
  watched.forEach((el) => io.observe(el));
}

// ---------- map section ----------
function renderList(overlay: OverlayData, onPick: (id: string) => void) {
  const ul = document.getElementById("feature-list")!;
  ul.innerHTML = featureListHtml(overlay);
  ul.addEventListener("click", (e) => {
    const id = (e.target as HTMLElement).closest("button")?.dataset.id;
    if (id) onPick(id);
  });
}

async function initMapSection() {
  const mapEl = document.getElementById("map")!;
  const detailEl = document.getElementById("detail")!;
  const badge = document.getElementById("data-badge")!;

  const overlay = await loadOverlay();
  badge.textContent = c.tryIt.badges[overlay.source];
  badge.dataset.source = overlay.source;
  badge.hidden = false;

  let focus: (id: string) => void = (id) => {
    const f = overlay.geojson.features.find((x) => x.properties.id === id);
    renderDetail(detailEl, f?.properties ?? null);
  };
  let clear = () => renderDetail(detailEl, null);
  detailEl.addEventListener("click", (e) => {
    if ((e.target as HTMLElement).closest(".detail__close")) clear();
  });
  renderList(overlay, (id) => {
    focus(id);
    mapEl.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  // Lazy-load MapLibre only when the section approaches the viewport (SDD N1).
  const io = new IntersectionObserver(
    async (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      try {
        const { mountMap } = await import("./map");
        mapEl.innerHTML = "";
        const handle = await mountMap(mapEl, overlay, (p) => renderDetail(detailEl, p));
        focus = handle.focus;
        clear = handle.clear;
      } catch (err) {
        console.error(err);
        mapEl.innerHTML = `<p class="map__status">${esc(c.tryIt.mapError)}</p>`;
      }
    },
    { rootMargin: "300px" },
  );
  io.observe(mapEl);
}

document.title = c.meta.title;
render(document.getElementById("app")!);
initStickyCta();
void initMapSection();
