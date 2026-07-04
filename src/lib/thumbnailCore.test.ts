import { test } from "node:test";
import assert from "node:assert/strict";
import { analyzeThumbnail } from "./thumbnailCore.ts";

function solid(w: number, h: number, r: number, g: number, b: number) {
  const data = new Uint8Array(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    data[i * 4] = r;
    data[i * 4 + 1] = g;
    data[i * 4 + 2] = b;
    data[i * 4 + 3] = 255;
  }
  return { width: w, height: h, data };
}

test("analyzeThumbnail — image noire = sombre, peu contrastée, peu colorée", () => {
  const a = analyzeThumbnail(solid(60, 40, 0, 0, 0));
  assert.ok(a.metrics.brightness < 5);
  assert.ok(a.metrics.contrast < 5);
  assert.equal(a.faceLikely, false);
  assert.ok(a.recommendations.some((r) => /sombre/i.test(r)));
  assert.ok(a.recommendations.some((r) => /visage/i.test(r)));
});

test("analyzeThumbnail — teinte chair = visage probable", () => {
  const a = analyzeThumbnail(solid(60, 40, 200, 150, 120));
  assert.equal(a.faceLikely, true);
  assert.equal(a.metrics.skinRatio > 0.5, true);
});

test("analyzeThumbnail — damier = fort contraste & bords (texte/détails)", () => {
  const w = 64,
    h = 64;
  const data = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const on = (x + y) % 2 === 0 ? 255 : 0;
      const i = (y * w + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = on;
      data[i + 3] = 255;
    }
  }
  const a = analyzeThumbnail({ width: w, height: h, data });
  assert.ok(a.metrics.contrast > 80);
  assert.ok(a.metrics.edgeDensity > 0.3);
  assert.equal(a.textHeavy, true);
});
