import { test } from "node:test";
import assert from "node:assert/strict";
import type { YtVideo } from "./types.ts";
import { scoreWorldVideo, detectMechanic, rankWorld } from "./worldCore.ts";

const NOW = Date.parse("2026-06-29T12:00:00Z");
const DAY = 86_400_000;

function mk(title: string, views: number, ageDays: number): YtVideo {
  return {
    id: `${title}-${views}`,
    channelId: "c",
    channelTitle: "C",
    title,
    publishedAt: new Date(NOW - ageDays * DAY).toISOString(),
    durationSec: 600,
    views,
    format: "long",
  };
}

test("scoreWorldVideo — petite chaîne + forte anomalie = score élevé", () => {
  const small = scoreWorldVideo(mk("Pull incroyable", 500000, 3), 10000, NOW);
  const big = scoreWorldVideo(mk("Vidéo normale", 50000, 3), 2_000_000, NOW);
  assert.ok(small.score > big.score);
  assert.ok(small.score >= 0 && small.score <= 100);
  assert.ok(Math.abs(small.anomaly - 50) < 1e-9); // 500k / 10k
});

test("scoreWorldVideo — vélocité = vues/jour", () => {
  const s = scoreWorldVideo(mk("x", 100000, 2), 50000, NOW);
  assert.equal(Math.round(s.velocity), 50000);
});

test("scoreWorldVideo — abonnés inconnus ne plante pas", () => {
  const s = scoreWorldVideo(mk("x", 100000, 1), undefined, NOW);
  assert.equal(s.anomaly, 0);
  assert.ok(s.score >= 0 && s.score <= 100);
});

test("detectMechanic", () => {
  assert.equal(detectMechanic("J'ouvre un carton scellé 1re édition")?.id, "high-stakes");
  assert.equal(detectMechanic("Ce produit vaut-il le coup ?")?.id, "verdict-test");
  assert.equal(detectMechanic("J'ouvre 200 boosters")?.id, "numbered-challenge");
  assert.equal(detectMechanic("Vlog tranquille"), undefined);
});

test("rankWorld — trie par score décroissant + plafonne", () => {
  const items = [
    scoreWorldVideo(mk("a", 10000, 20), 1_000_000, NOW),
    scoreWorldVideo(mk("b", 800000, 1), 5000, NOW),
    scoreWorldVideo(mk("c", 60000, 10), 100000, NOW),
  ];
  const ranked = rankWorld(items, 2);
  assert.equal(ranked.length, 2);
  assert.ok(ranked[0].score >= ranked[1].score);
});
