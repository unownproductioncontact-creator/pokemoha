import { test } from "node:test";
import assert from "node:assert/strict";
import { generateTitles, keywordsOf } from "./titleGen.ts";

test("keywordsOf — retire les stopwords", () => {
  const k = keywordsOf("J'ouvre un display de pokémon");
  assert.ok(k.includes("ouvre"));
  assert.ok(k.includes("display"));
  assert.ok(k.includes("pokémon"));
  assert.ok(!k.includes("un"));
  assert.ok(!k.includes("de"));
});

test("generateTitles — titres uniques, n respecté", () => {
  const t = generateTitles("ouverture display pokémon", { n: 10 });
  assert.equal(t.length, 10);
  assert.equal(new Set(t).size, 10);
  assert.ok(t.every((x) => x.length > 0));
});

test("generateTitles — idée vide ne plante pas", () => {
  const t = generateTitles("");
  assert.ok(t.length > 0);
});
