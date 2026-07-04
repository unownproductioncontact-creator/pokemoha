import { test } from "node:test";
import assert from "node:assert/strict";
import type { ScoredVideo, OutlierFlag, FormatMedians } from "./types.ts";
import { analyzeAudit } from "./auditCore.ts";

const NOW = Date.parse("2026-06-29T12:00:00Z"); // un lundi
const DAY = 86_400_000;

function sv(
  id: string,
  format: "short" | "long",
  ratio: number,
  durationSec: number,
  ageDays: number,
  flag: OutlierFlag,
  publishedAt?: string,
): ScoredVideo {
  return {
    video: {
      id,
      channelId: "c",
      channelTitle: "C",
      title: id,
      publishedAt: publishedAt ?? new Date(NOW - ageDays * DAY).toISOString(),
      durationSec,
      views: 0,
      format,
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

const MED: FormatMedians = { short: 100, long: 350 };

test("analyzeAudit — meilleure tranche de durée", () => {
  const scored = [
    sv("a", "long", 3, 700, 10, "outlier"),
    sv("b", "long", 4, 720, 20, "outlier"),
    sv("c", "long", 1, 200, 15, "normal"),
    sv("d", "long", 0.9, 240, 25, "normal"),
  ];
  const r = analyzeAudit({ scored, medians: MED, nowMs: NOW });
  assert.ok(r.bestDuration);
  assert.equal(r.bestDuration!.label, "10–20 min");
  assert.equal(r.plan.length, 4);
  assert.ok(r.recommendations.length > 0);
});

test("analyzeAudit — CTR indisponible sans OAuth", () => {
  const r = analyzeAudit({ scored: [], medians: MED, nowMs: NOW });
  const ctr = r.scores.find((s) => s.key === "ctr");
  assert.equal(ctr!.status, "unavailable");
  assert.ok(r.recommendations.some((x) => /CTR/i.test(x.title)));
});

test("analyzeAudit — recommande de lancer des Shorts si aucun", () => {
  const scored = [sv("a", "long", 2, 600, 10, "outlier")];
  const r = analyzeAudit({ scored, medians: MED, nowMs: NOW });
  assert.equal(r.shorts.count, 0);
  assert.ok(r.recommendations.some((x) => /Shorts/i.test(x.title)));
});

test("analyzeAudit — meilleur jour de publication", () => {
  // deux vidéos un mercredi (haute perf), deux un lundi (basse)
  const scored = [
    sv("w1", "long", 5, 600, 0, "outlier", "2026-06-24T10:00:00Z"), // mercredi
    sv("w2", "long", 4, 600, 0, "outlier", "2026-06-17T10:00:00Z"), // mercredi
    sv("m1", "long", 1, 600, 0, "normal", "2026-06-22T10:00:00Z"), // lundi
    sv("m2", "long", 1, 600, 0, "normal", "2026-06-15T10:00:00Z"), // lundi
  ];
  const r = analyzeAudit({ scored, medians: MED, nowMs: NOW });
  assert.equal(r.bestDay?.day, "mercredi");
});
