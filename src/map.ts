// Lazy-loaded interactive Blok M map (docs/SDD.md F2–F5). Imported only when the
// "Coba sendiri" section scrolls into view, so MapLibre never blocks first paint.
import maplibregl, { type MapGeoJSONFeature, type StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Protocol } from "pmtiles";
import { type FeatureProps, type OverlayData } from "./data";

const BLOKM_CENTER: [number, number] = [106.7998, -6.2437];
const BLOKM_BOUNDS: [number, number, number, number] = [106.79, -6.27, 106.83, -6.23];

// From Dari semantic tokens (DariTheme.swift, day) except `yes`, which has no token yet.
const COLORS = {
  yes: "#1F7A4D", // TODO: replace once the design system defines a "passable" token
  no: "#C0182F",
  unknown: "#6B7280",
  obstacle: "#C2185B",
  crossing: "#20303F",
};

let protocolRegistered = false;

async function loadStyle(): Promise<StyleSpecification> {
  const origin = new URL(import.meta.env.BASE_URL, window.location.href).href.replace(/\/$/, "");
  const text = await (await fetch(`${origin}/map/style-day.json`)).text();
  return JSON.parse(
    text
      .replace("__DARI_GLYPHS_URL__", `${origin}/map/fonts/{fontstack}/{range}.pbf`)
      .replace("__DARI_PMTILES_URL__", `${origin}/map/blokm.pmtiles`),
  );
}

export interface MapHandle {
  map: maplibregl.Map;
  focus(id: string): void;
  clear(): void;
}

// Source id of the PMTiles basemap in public/map/style-day.json.
const BASEMAP_SOURCE = "protomaps";
// A single failing PMTiles range must not take down the map: wait this long for any basemap tile before giving up.
const BASEMAP_GRACE_MS = 8000;

/** Optional, off by default: index.html passes nothing and behaves as before. */
export interface MountOptions {
  /** MapLibre UI strings, e.g. the cooperative-gesture hints. */
  locale?: Record<string, string>;
  /** Initial camera: fit this box with padding instead of the default Blok M center. */
  fit?: { bounds: [[number, number], [number, number]]; padding: maplibregl.PaddingOptions };
}

export async function mountMap(
  container: HTMLElement,
  overlay: OverlayData,
  onSelect: (props: FeatureProps | null) => void,
  onBasemapError?: () => void,
  options: MountOptions = {},
): Promise<MapHandle> {
  if (!protocolRegistered) {
    maplibregl.addProtocol("pmtiles", new Protocol().tile);
    protocolRegistered = true;
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const map = new maplibregl.Map({
    container,
    style: await loadStyle(),
    center: BLOKM_CENTER,
    zoom: 16.3,
    minZoom: 13,
    maxZoom: 19,
    maxPitch: 70,
    maxBounds: [
      [BLOKM_BOUNDS[0] - 0.01, BLOKM_BOUNDS[1] - 0.01],
      [BLOKM_BOUNDS[2] + 0.01, BLOKM_BOUNDS[3] + 0.01],
    ],
    attributionControl: false, // added top-left below: the phone bottom sheet covers the bottom edge
    cooperativeGestures: true, // one-finger scroll keeps scrolling the page on phones
    fadeDuration: reduceMotion ? 0 : 300,
    locale: options.locale,
    ...(options.fit && { bounds: options.fit.bounds, fitBoundsOptions: { padding: options.fit.padding } }),
  });

  // MapLibre fires `load` even when the basemap fails, so report basemap failure from here.
  // Only errors before the first basemap tile count: a later transient miss keeps the working map.
  // An early error starts a grace timer rather than failing at once, since other tiles may still load.
  if (onBasemapError) {
    let basemapRendered = false;
    let basemapReported = false;
    let graceTimer: ReturnType<typeof setTimeout> | undefined;
    const cancelGrace = () => {
      if (graceTimer !== undefined) clearTimeout(graceTimer);
      graceTimer = undefined;
    };
    map.on("sourcedata", (e) => {
      const ev = e as unknown as { sourceId?: string; tile?: unknown };
      if (ev.sourceId === BASEMAP_SOURCE && ev.tile) {
        basemapRendered = true;
        cancelGrace();
      }
    });
    map.on("error", (e) => {
      const ev = e as unknown as { sourceId?: string };
      if (ev.sourceId !== BASEMAP_SOURCE || basemapRendered || basemapReported || graceTimer !== undefined) return;
      graceTimer = setTimeout(() => {
        graceTimer = undefined;
        if (basemapRendered || basemapReported) return;
        basemapReported = true;
        onBasemapError();
      }, BASEMAP_GRACE_MS);
    });
    map.on("remove", cancelGrace);
  }

  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
  map.addControl(new maplibregl.AttributionControl({ compact: true }), "top-left");

  await new Promise<void>((resolve) => map.once("load", () => resolve()));
  // Compact attribution starts expanded and covers a third of a phone-sized map; keep it collapsed (ⓘ still opens it).
  container.querySelector(".maplibregl-ctrl-attrib")?.classList.remove("maplibregl-compact-show");

  map.addSource("dari", { type: "geojson", data: overlay.geojson, promoteId: "id" });

  const passColor: maplibregl.ExpressionSpecification = [
    "match", ["get", "passable_wheelchair"], "yes", COLORS.yes, "no", COLORS.no, COLORS.unknown,
  ];
  const selected: maplibregl.ExpressionSpecification = ["boolean", ["feature-state", "selected"], false];

  map.addLayer({
    id: "dari-sidewalk-casing",
    type: "line",
    source: "dari",
    filter: ["in", ["get", "kind"], ["literal", ["sidewalk", "kerb"]]],
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": "#FFFFFF", "line-width": ["case", selected, 13, 9] },
  });
  map.addLayer({
    id: "dari-sidewalk",
    type: "line",
    source: "dari",
    filter: ["in", ["get", "kind"], ["literal", ["sidewalk", "kerb"]]],
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": passColor, "line-width": ["case", selected, 8, 5] },
  });
  map.addLayer({
    id: "dari-crossing",
    type: "line",
    source: "dari",
    filter: ["==", ["get", "kind"], "crossing"],
    paint: { "line-color": COLORS.crossing, "line-width": ["case", selected, 7, 4], "line-dasharray": [1, 0.8] },
  });
  map.addLayer({
    id: "dari-obstacle",
    type: "circle",
    source: "dari",
    filter: ["==", ["get", "kind"], "obstacle"],
    paint: {
      "circle-color": COLORS.obstacle,
      "circle-radius": ["case", selected, 10, 7],
      "circle-stroke-color": "#FFFFFF",
      "circle-stroke-width": 2.5,
    },
  });

  const interactive = ["dari-sidewalk", "dari-crossing", "dari-obstacle"];
  let selectedId: string | number | undefined;

  const select = (feature: MapGeoJSONFeature | undefined) => {
    if (selectedId !== undefined) map.setFeatureState({ source: "dari", id: selectedId }, { selected: false });
    selectedId = feature?.id;
    if (selectedId !== undefined) map.setFeatureState({ source: "dari", id: selectedId }, { selected: true });
    onSelect(feature ? (feature.properties as FeatureProps) : null);
  };

  map.on("click", (e) => {
    // Generous hit box for fingers (≥ 44 px target, WCAG 2.5.8)
    const pad = 22;
    const hits = map.queryRenderedFeatures(
      [[e.point.x - pad, e.point.y - pad], [e.point.x + pad, e.point.y + pad]],
      { layers: interactive },
    );
    select(hits[0]);
  });
  for (const id of interactive) {
    map.on("mouseenter", id, () => (map.getCanvas().style.cursor = "pointer"));
    map.on("mouseleave", id, () => (map.getCanvas().style.cursor = ""));
  }

  // ---- 2D / 3D flyover over the whole Blok M area (OSM building heights) ----
  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "map-3d-toggle";
  const note = document.createElement("p");
  note.className = "map-3d-note";
  note.textContent = "Tinggi gedung perkiraan (OpenStreetMap)";
  note.hidden = true;
  container.append(toggle, note);

  let is3d = false;
  let spin = 0;
  const stopSpin = () => {
    if (spin) cancelAnimationFrame(spin);
    spin = 0;
  };
  // A gentle rotation around Blok M; any user gesture cancels it.
  const flyover = () => {
    stopSpin();
    if (reduceMotion) return;
    const step = () => {
      map.setBearing((map.getBearing() + 0.08) % 360);
      spin = requestAnimationFrame(step);
    };
    spin = requestAnimationFrame(step);
  };
  for (const ev of ["dragstart", "zoomstart", "mousedown", "touchstart"] as const) {
    map.on(ev, stopSpin);
  }

  // moveCamera=false: keep the camera set by options.fit instead of easing to the default Blok M view.
  const set3d = (on: boolean, moveCamera = true) => {
    is3d = on;
    toggle.textContent = on ? "Kembali ke 2D" : "Lihat Blok M 3D";
    toggle.setAttribute("aria-pressed", String(on));
    note.hidden = !on;
    if (on) {
      select(undefined); // a bird's-eye view isn't for tapping individual segments
      map.easeTo({
        center: BLOKM_CENTER,
        zoom: 15.2,
        pitch: 60,
        bearing: -20,
        duration: reduceMotion ? 0 : 1400,
      });
      map.once("moveend", flyover);
    } else {
      stopSpin();
      if (moveCamera) map.easeTo({ center: BLOKM_CENTER, zoom: 16.3, pitch: 0, bearing: 0, duration: reduceMotion ? 0 : 1000 });
    }
  };
  toggle.addEventListener("click", () => set3d(!is3d));
  set3d(false, !options.fit);

  return {
    map,
    clear: () => select(undefined),
    focus(id: string) {
      const f = overlay.geojson.features.find((x) => x.properties.id === id);
      if (!f) return;
      if (is3d) set3d(false); // drop to flat view so the segment reads clearly
      const coords = (f.geometry.type === "Point" ? [f.geometry.coordinates] : f.geometry.type === "LineString" ? f.geometry.coordinates : []) as [number, number][];
      if (!coords.length) return;
      const bounds = coords.reduce((b, c) => b.extend(c), new maplibregl.LngLatBounds(coords[0], coords[0]));
      map.fitBounds(bounds, { padding: 80, maxZoom: 18, duration: reduceMotion ? 0 : 600 });
      const [rendered] = map.querySourceFeatures("dari", { filter: ["==", ["get", "id"], id] });
      select(rendered ? ({ ...rendered, id } as MapGeoJSONFeature) : undefined);
      if (!rendered) onSelect(f.properties);
    },
  };
}
