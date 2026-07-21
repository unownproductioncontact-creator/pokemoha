import { test } from "node:test";
import assert from "node:assert/strict";
import type { ScoredVideo, OutlierFlag } from "./types.ts";
import { buildAlerts } from "./alertsCore.ts";

const NOW = Date.parse("2026-06-29T12:00:00Z");
const DAY = 86_400_000;

function sv(
  id: string,
  flag: OutlierFlag,
  ratio: number,
  ageDays: number,
): ScoredVideo {
  return {
    video: {
      id,
      channelId: "c",
      channelTitle: "C",
      title: id,
      publishedAt: new Date(NOW - ageDays * DAY).toISOString(),
      durationSec: 600,
      views: 0,
      format: "long",
    },
    ratio,
    projectedRatio: ratio * 2,
    maturityFraction: 0.5,
    ageDays,
    isEmerging: flag === "emerging",
    flag,
    confidence: "high",
    reasons: [],
  };
}

test("buildAlerts — emerging = alerte haute", () => {
  const a = buildAlerts({ scored: [sv("e", "emerging", 0.9, 2)], nowMs: NOW });
  assert.equal(a.length, 1);
  assert.equal(a[0].severity, "high");
  assert.equal(a[0].kind, "emerging");
});

test("buildAlerts — concurrent récent = alerte concurrent", () => {
  const a = buildAlerts({
    scored: [],
    competitorOutliers: [{ sv: sv("c", "outlier", 4, 3), competitorLabel: "Kiibiki" }],
    nowMs: NOW,
  });
  assert.equal(a.length, 1);
  assert.equal(a[0].kind, "competitor");
  assert.ok(a[0].title.includes("Kiibiki"));
});

test("buildAlerts — tri par sévérité puis récence", () => {
  const a = buildAlerts({
    scored: [sv("u", "under", 0.3, 5), sv("e", "emerging", 0.8, 1)],
    nowMs: NOW,
  });
  assert.equal(a[0].kind, "emerging"); // high avant low
});

test("buildAlerts — vieux outlier non récent ignoré", () => {
  const a = buildAlerts({ scored: [sv("o", "outlier", 5, 90)], nowMs: NOW });
  assert.equal(a.length, 0);
});

test("buildAlerts — dédup des ids (même vidéo chez 2 concurrents)", () => {
  const a = buildAlerts({
    scored: [],
    competitorOutliers: [
      { sv: sv("dup", "outlier", 4, 2), competitorLabel: "A" },
      { sv: sv("dup", "outlier", 5, 3), competitorLabel: "B" },
    ],
    nowMs: NOW,
  });
  assert.equal(a.length, 1); // un seul id `co-dup`
  assert.equal(new Set(a.map((x) => x.id)).size, a.length);
});

test("buildAlerts — porte subject + videoId pour les CTA (F015)", () => {
  const a = buildAlerts({ scored: [sv("vid1", "emerging", 0.9, 2)], nowMs: NOW });
  assert.equal(a[0].videoId, "vid1");
  assert.equal(a[0].subject, "vid1"); // title == id dans le helper de test
});
