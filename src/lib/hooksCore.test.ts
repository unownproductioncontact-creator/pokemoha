import { test } from "node:test";
import assert from "node:assert/strict";
import { analyzeHooks } from "./hooksCore.ts";

test("analyzeHooks — détecte un motif et son lift", () => {
  const items = [
    { title: "J'ouvre 200 boosters incroyables", ratio: 4 },
    { title: "10 cartes à voir", ratio: 3 },
    { title: "Ouverture tranquille", ratio: 1 },
    { title: "Vlog du dimanche", ratio: 0.8 },
  ];
  const a = analyzeHooks(items);
  assert.equal(a.total, 4);
  const num = a.patterns.find((p) => p.id === "number");
  assert.ok(num);
  assert.equal(num!.count, 2);
  assert.ok(num!.avgRatioWith > num!.avgRatioWithout); // les titres chiffrés performent mieux
  assert.ok(num!.lift > 1);
});

test("analyzeHooks — power words sans stopwords", () => {
  const items = [
    { title: "Ouverture display pokémon", ratio: 2 },
    { title: "Ouverture booster pokémon", ratio: 2 },
  ];
  const a = analyzeHooks(items);
  const words = a.powerWords.map((w) => w.word);
  assert.ok(words.includes("pokémon"));
  assert.ok(words.includes("ouverture"));
  assert.ok(!words.includes("de")); // stopword exclu
});

test("analyzeHooks — liste vide ne plante pas", () => {
  const a = analyzeHooks([]);
  assert.equal(a.total, 0);
  assert.equal(a.patterns.length > 0, true); // motifs présents avec count 0
});
