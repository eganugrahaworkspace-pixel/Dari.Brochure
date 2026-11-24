import test from "node:test";
import assert from "node:assert/strict";
import { SLOTS, DESIGN, toPercent } from "../src/poster-layout.ts";

test("persen dihitung dari ukuran desain", () => {
  assert.deepEqual(toPercent({ x: 108, y: 192, w: 540, h: 960 }), { left: "10%", top: "10%", width: "50%", height: "50%" });
});
test("slot peta berada di dalam area kosong", () => {
  assert.ok(SLOTS.map.y >= 1101 && SLOTS.map.y + SLOTS.map.h <= 1469);
  assert.ok(SLOTS.map.x >= 0 && SLOTS.map.x + SLOTS.map.w <= DESIGN.w);
});
test("tautan QR dan Instagram berada di dalam desain", () => {
  for (const r of [SLOTS.qr, SLOTS.instagram]) {
    assert.ok(r.x >= 0 && r.x + r.w <= DESIGN.w, "x di luar desain");
    assert.ok(r.y >= 0 && r.y + r.h <= DESIGN.h, "y di luar desain");
  }
});
