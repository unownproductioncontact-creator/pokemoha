import { test } from "node:test";
import assert from "node:assert/strict";
import type { YtVideo, ScoredVideo, OutlierFlag, FormatMedians } from "./types.ts";
import {
  median,
  maturityFraction,
  computeMedians,
  excludeKids,
  isKidsVideo,
  scoreVideo,
  analyzeChannel,
  selectTopOutliers,
  OUTLIER_RATIO,
} from "./outlierCore.ts";

const NOW = Date.parse("2026-06-29T12:00:00Z");
const DAY = 86_400_000;

function mk(
  id: string,
  format: "short" | "long",
  views: number,
  ageDays: number,
  extra: Partial<YtVideo> = {},
): YtVideo {
  return {
    id,
    channelId: "c",
    channelTitle: "C",
    title: extra.title ?? `video ${id}`,
    publishedAt: new Date(NOW - ageDays * DAY).toISOString(),
    durationSec: format === "short" ? 30 : 600,
    views,
    format,
    ...extra,
  };
}

const MED: FormatMedians = { short: 100, long: 350 };

test("median — pair / impair / vide", () => {
  assert.equal(median([]), 0);
  assert.equal(median([5]), 5);
  assert.equal(median([3, 1, 2]), 2);
  assert.equal(median([1, 2, 3, 4]), 2.5);
});

test("maturityFraction — bornes & monotonie", () => {
  assert.ok(Math.abs(maturityFraction(0, "long") - 0.1) < 1e-9); // floor long
  assert.ok(Math.abs(maturityFraction(0, "short") - 0.18) < 1e-9); // floor short
  assert.equal(maturityFraction(120, "long"), 1);
  assert.equal(maturityFraction(Number.POSITIVE_INFINITY, "short"), 1);
  // croissant
  assert.ok(maturityFraction(7, "long") > maturityFraction(2, "long"));
  // les Shorts maturent plus vite que les longues au même âge précoce
  assert.ok(maturityFraction(3, "short") > maturityFraction(3, "long"));
});

test("computeMedians — baseline mûre, ignore les récentes non stabilisées", () => {
  const vids: YtVideo[] = [
    mk("l1", "long", 100, 30),
    mk("l2", "long", 200, 30),
    mk("l3", "long", 300, 30),
    mk("l4", "long", 400, 30),
    mk("l5", "long", 500, 30),
    mk("l6", "long", 600, 30),
    // récentes (age 1) très vues : ne doivent PAS gonfler la médiane
    mk("lr1", "long", 99999, 1),
    mk("lr2", "long", 99999, 1),
    // 3 shorts mûrs seulement (< MIN_BASELINE) → repli sur tous
    mk("s1", "short", 50, 30),
    mk("s2", "short", 100, 30),
    mk("s3", "short", 150, 30),
  ];
  const m = computeMedians(vids, NOW);
  assert.equal(m.long, 350); // médiane de [100..600]
  assert.equal(m.short, 100); // repli : médiane de [50,100,150]
});

test("excludeKids — madeForKids + heuristique titre", () => {
  const vids: YtVideo[] = [
    mk("a", "long", 1, 5, { madeForKids: true }),
    mk("b", "long", 1, 5, { title: "Comptine pour bébé" }),
    mk("c", "long", 1, 5, { title: "Ouverture display Pokémon EV09" }),
  ];
  assert.equal(isKidsVideo(vids[0]), true);
  assert.equal(isKidsVideo(vids[1]), true);
  assert.equal(isKidsVideo(vids[2]), false);
  const kept = excludeKids(vids);
  assert.equal(kept.length, 1);
  assert.equal(kept[0].id, "c");
});

test("scoreVideo — outlier & performance exceptionnelle", () => {
  const s = scoreVideo(mk("o", "long", 1050, 40), MED, NOW, 8); // 3×
  assert.equal(s.flag, "outlier");
  assert.ok(Math.abs(s.ratio - 3) < 1e-9);
  assert.equal(s.confidence, "high");
  assert.ok(s.reasons.some((r) => r.includes("exceptionnelle")));
});

test("scoreVideo — sous-performance & normal", () => {
  const under = scoreVideo(mk("u", "long", 100, 40), MED, NOW, 8); // 0.29×
  assert.equal(under.flag, "under");
  const normal = scoreVideo(mk("n", "long", 300, 40), MED, NOW, 8); // 0.86×
  assert.equal(normal.flag, "normal");
});

test("scoreVideo — démarrage fort (emerging) garde le ratio HONNÊTE", () => {
  // 300 vues, 2 jours, médiane 350 → ratio réel ~0,86 (<1,5) mais projeté élevé.
  const s = scoreVideo(mk("e", "long", 300, 2), MED, NOW, 8);
  assert.equal(s.flag, "emerging");
  assert.equal(s.isEmerging, true);
  assert.ok(s.ratio < OUTLIER_RATIO); // ratio affiché reste sous le seuil
  assert.ok(s.projectedRatio >= 1.5); // mais projeté ≥ 1,5×
  assert.ok(s.projectedRatio > s.ratio); // projection > réel
  assert.ok(Math.abs(s.ratio - 300 / 350) < 1e-9); // honnêteté du ratio affiché
});

test("scoreVideo — confiance faible si échantillon trop petit", () => {
  const s = scoreVideo(mk("x", "long", 1050, 40), MED, NOW, 3); // sample < 5
  assert.equal(s.confidence, "low");
  assert.ok(s.reasons.some((r) => r.includes("comparables")));
});

test("analyzeChannel — exclut Kids et score tout", () => {
  const vids: YtVideo[] = [
    mk("k", "long", 9999, 30, { madeForKids: true }),
    mk("a", "long", 100, 30),
    mk("b", "long", 200, 30),
  ];
  const { scored } = analyzeChannel(vids, NOW);
  assert.equal(scored.length, 2); // Kids exclue
  assert.ok(!scored.some((s) => s.video.id === "k"));
});

function sv(
  id: string,
  ratio: number,
  ageDays: number,
  flag: OutlierFlag,
): ScoredVideo {
  return {
    video: mk(id, "long", 0, ageDays),
    ratio,
    projectedRatio: ratio,
    maturityFraction: 1,
    ageDays,
    isEmerging: flag === "emerging",
    flag,
    confidence: "high",
    reasons: [],
  };
}

test("selectTopOutliers — filtre les dates AVANT le plafonnement", () => {
  const scored = [
    sv("A", 10, 40, "outlier"),
    sv("B", 6, 35, "outlier"),
    sv("C", 5, 30, "outlier"),
    sv("D", 1.14, 1, "emerging"),
    sv("E", 1.0, 2, "emerging"),
  ];
  // Fenêtre 7 j : A/B/C (≥30 j) éliminés AVANT le cap
  const recent = selectTopOutliers(scored, { windowDays: 7, limit: 10 });
  assert.deepEqual(recent.map((s) => s.video.id), ["D", "E"]);
  assert.ok(!recent.some((s) => s.video.id === "A"));
});

test("selectTopOutliers — quota de récence garde un démarrage fort", () => {
  const scored = [
    sv("A", 10, 40, "outlier"),
    sv("B", 6, 35, "outlier"),
    sv("C", 5, 30, "outlier"),
    sv("D", 1.14, 1, "emerging"),
    sv("E", 1.0, 2, "emerging"),
  ];
  // Sans quota : top 3 par ratio = A,B,C
  const noQuota = selectTopOutliers(scored, { limit: 3 });
  assert.deepEqual(noQuota.map((s) => s.video.id), ["A", "B", "C"]);
  // Avec quota 1 : on réserve 1 place au plus récent (D, 1 j)
  const withQuota = selectTopOutliers(scored, { limit: 3, recencyQuota: 1 });
  assert.equal(withQuota.length, 3);
  assert.ok(withQuota.some((s) => s.video.id === "D"));
  assert.ok(withQuota.some((s) => s.video.id === "A"));
  assert.ok(withQuota.some((s) => s.video.id === "B"));
});
