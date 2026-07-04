import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseISO8601Duration,
  classifyFormat,
  extractChannelRef,
  SHORT_MAX_SEC,
} from "./ytParse.ts";

test("parseISO8601Duration — formats variés", () => {
  assert.equal(parseISO8601Duration("PT59S"), 59);
  assert.equal(parseISO8601Duration("PT1M"), 60);
  assert.equal(parseISO8601Duration("PT1M30S"), 90);
  assert.equal(parseISO8601Duration("PT1H2M3S"), 3723);
  assert.equal(parseISO8601Duration("P1DT2H"), 93600);
  assert.equal(parseISO8601Duration("PT0S"), 0);
  assert.equal(parseISO8601Duration("garbage"), 0);
  assert.equal(parseISO8601Duration(""), 0);
});

test("classifyFormat — seuil Short", () => {
  assert.equal(classifyFormat(45), "short");
  assert.equal(classifyFormat(60), "short");
  assert.equal(classifyFormat(61), "long");
  assert.equal(classifyFormat(0), "long"); // durée inconnue → long
  assert.equal(SHORT_MAX_SEC, 60);
});

test("extractChannelRef — handle / id / url / texte", () => {
  assert.deepEqual(extractChannelRef("@Newtiteuf"), {
    kind: "handle",
    value: "@Newtiteuf",
  });
  assert.deepEqual(extractChannelRef("UC1234567890123456789012"), {
    kind: "id",
    value: "UC1234567890123456789012",
  });
  assert.deepEqual(extractChannelRef("https://www.youtube.com/@Kiibiki"), {
    kind: "handle",
    value: "@Kiibiki",
  });
  assert.deepEqual(
    extractChannelRef("https://youtube.com/channel/UC1234567890123456789012"),
    { kind: "id", value: "UC1234567890123456789012" },
  );
  assert.deepEqual(extractChannelRef("Pokémon cartes ouverture"), {
    kind: "query",
    value: "Pokémon cartes ouverture",
  });
  assert.equal(extractChannelRef("   ").value, "");
});
