import { test } from "node:test";
import assert from "node:assert/strict";
import type { ScoredVideo, OutlierFlag, ChannelSnapshot } from "./types.ts";
import { scoreCompetitor } from "./competitorScore.ts";

function sv(ratio: number, ageDays: number, flag: OutlierFlag): ScoredVideo {
  return {
    video: {
      id: `v${ratio}-${ageDays}`,
      channelId: "c",
      channelTitle: "C",
      title: "t",
      publishedAt: new Date(0).toISOString(),
      durationSec: 600,
      views: 0,
      format: "long",
    },
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

const ch = (subs: number): ChannelSnapshot => ({
  channelId: "c",
  title: "C",
  subscribers: subs,
});

test("scoreCompetitor — vide = 0/0", () => {
  const s = scoreCompetitor([], undefined);
  assert.equal(s.menace, 0);
  assert.equal(s.inspiration, 0);
});

test("scoreCompetitor — bornes 0..100", () => {
  const many = Array.from({ length: 15 }, () => sv(6, 5, "outlier"));
  const s = scoreCompetitor(many, ch(2_000_000));
  assert.ok(s.menace >= 0 && s.menace <= 100);
  assert.ok(s.inspiration >= 0 && s.inspiration <= 100);
});

test("scoreCompetitor — plus d'outliers forts ⇒ inspiration plus haute", () => {
  const weak = scoreCompetitor([sv(1.6, 10, "outlier")], ch(1000));
  const strong = scoreCompetitor(
    [sv(8, 10, "outlier"), sv(6, 12, "outlier"), sv(5, 14, "outlier")],
    ch(1000),
  );
  assert.ok(strong.inspiration > weak.inspiration);
});

test("scoreCompetitor — cadence + audience ⇒ menace plus haute", () => {
  const small = scoreCompetitor([sv(2, 5, "outlier")], ch(500));
  const big = scoreCompetitor(
    Array.from({ length: 10 }, (_, i) => sv(2, i + 1, "outlier")),
    ch(900_000),
  );
  assert.ok(big.menace > small.menace);
});
