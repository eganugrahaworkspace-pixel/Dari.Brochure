// Overlay data model + loader with the pilot data gate (docs/SDD.md §7–8).

export type Kind = "sidewalk" | "crossing" | "obstacle" | "kerb";
export type State = "verified" | "unverified" | "inferred" | "unknown";
export type Passable = "yes" | "no" | "unknown";

export interface FeatureProps {
  id: string;
  kind: Kind;
  name?: string;
  width_m?: number;
  width_uncertainty_m?: number;
  obstacle_type?: string;
  state: State;
  passable_wheelchair: Passable;
}

export type DataSource = "pilot" | "demo";

export interface OverlayData {
  source: DataSource;
  geojson: GeoJSON.FeatureCollection<GeoJSON.Geometry, FeatureProps>;
}

const ALLOWED = new Set<keyof FeatureProps>([
  "id", "kind", "name", "width_m", "width_uncertainty_m", "obstacle_type", "state", "passable_wheelchair",
]);

/** Keep only allow-listed properties and fill required ones with honest "unknown" defaults. */
function sanitize(fc: GeoJSON.FeatureCollection): OverlayData["geojson"] {
  return {
    type: "FeatureCollection",
    features: fc.features.map((f, i) => {
      const raw = (f.properties ?? {}) as Record<string, unknown>;
      const props: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(raw)) if (ALLOWED.has(k as keyof FeatureProps)) props[k] = v;
      props.id ??= String(f.id ?? i);
      props.state ??= "unknown";
      props.passable_wheelchair ??= "unknown";
      return { ...f, properties: props as unknown as FeatureProps };
    }),
  };
}

async function fetchJson(url: string): Promise<GeoJSON.FeatureCollection | null> {
  try {
    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) return null;
    // Some hosts answer missing files with index.html (200); json() then throws -> "absent".
    const body = await res.json();
    return body?.type === "FeatureCollection" ? body : null;
  } catch {
    return null;
  }
}

/** Pilot data is used only when an approved public export exists; otherwise the labelled demo. */
export async function loadOverlay(base = import.meta.env.BASE_URL): Promise<OverlayData> {
  const pilot = await fetchJson(`${base}data/pilot-public.geojson`);
  if (pilot) return { source: "pilot", geojson: sanitize(pilot) };
  const demo = await fetchJson(`${base}data/demo.geojson`);
  return { source: "demo", geojson: sanitize(demo ?? { type: "FeatureCollection", features: [] }) };
}

// ---- Presentation helpers (Indonesian) ----

const KIND_LABEL: Record<Kind, string> = {
  sidewalk: "Trotoar",
  crossing: "Penyeberangan",
  obstacle: "Hambatan",
  kerb: "Tepi trotoar (kerb)",
};

const STATE_LABEL: Record<State, string> = {
  verified: "Terverifikasi",
  unverified: "Belum diverifikasi",
  inferred: "Perkiraan (inferensi)",
  unknown: "Tidak diketahui",
};

const PASSABLE_LABEL: Record<Passable, string> = {
  yes: "Bisa dilalui (estimasi)",
  no: "Terhalang",
  unknown: "Belum diketahui",
};

const OBSTACLE_LABEL: Record<string, string> = {
  bollard: "Bollard / patok",
  pole: "Tiang",
  tree: "Pohon",
  vendor_cart: "Gerobak / lapak",
  parked_vehicle: "Kendaraan parkir",
  construction_barrier: "Pembatas konstruksi",
  drainage_opening: "Lubang drainase",
  hole: "Lubang",
  other: "Hambatan lain",
};

const UNKNOWN = "Tidak diketahui";

export function describe(p: FeatureProps): { title: string; rows: [string, string][] } {
  const width =
    typeof p.width_m === "number"
      ? `${p.width_m.toFixed(1)} m${typeof p.width_uncertainty_m === "number" ? ` ± ${p.width_uncertainty_m.toFixed(1)} m` : ""} (estimasi)`
      : UNKNOWN;
  const rows: [string, string][] = [["Jenis", KIND_LABEL[p.kind] ?? UNKNOWN]];
  if (p.kind === "obstacle") rows.push(["Jenis hambatan", OBSTACLE_LABEL[p.obstacle_type ?? ""] ?? OBSTACLE_LABEL.other]);
  else rows.push(["Lebar", width]);
  rows.push(["Kursi roda", PASSABLE_LABEL[p.passable_wheelchair] ?? UNKNOWN]);
  rows.push(["Status data", STATE_LABEL[p.state] ?? UNKNOWN]);
  return { title: p.name ?? KIND_LABEL[p.kind] ?? "Fitur", rows };
}
