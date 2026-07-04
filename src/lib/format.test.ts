import { test } from "node:test";
import assert from "node:assert/strict";
import {
  formatCompact,
  formatInt,
  formatRatio,
  formatPercent,
} from "./format.ts";

test("formatCompact", () => {
  assert.equal(formatCompact(999), "999");
  assert.equal(formatCompact(1234), "1,2 k");
  assert.equal(formatCompact(1_500_000), "1,5 M");
  assert.equal(formatCompact(2_000_000_000), "2 Md");
  assert.equal(formatCompact(NaN), "—");
});

test("formatInt — espace fine de milliers", () => {
  assert.equal(formatInt(12345), "12 345");
  assert.equal(formatInt(999), "999");
});

test("formatRatio", () => {
  assert.equal(formatRatio(3), "3×");
  assert.equal(formatRatio(1.25), "1,3×");
  assert.equal(formatRatio(0), "—");
});

test("formatPercent", () => {
  assert.equal(formatPercent(0.5), "50 %");
  assert.equal(formatPercent(0.1234, 1), "12,3 %");
});
