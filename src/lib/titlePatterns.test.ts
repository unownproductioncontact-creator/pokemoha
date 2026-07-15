import { test } from "node:test";
import assert from "node:assert/strict";
import {
  inducePattern,
  applyPattern,
  buildDataDrivenTitles,
} from "./titlePatterns.ts";
import type { TitlePattern } from "./types.ts";

test("inducePattern : remplace la suite de mots-sujet par {X}, garde l'ossature", () => {
  const t = inducePattern("J'ai ouvert un display Écarlate & Violet 151");
  assert.ok(t && t.includes("{X}"));
  assert.match(t!, /^J'ai ouvert un display \{X\}/);
});

test("inducePattern : verbe d'accroche reste dans l'ossature", () => {
  const t = inducePattern("POURQUOI Dracaufeu explose en ce moment");
  assert.equal(t, "POURQUOI {X} explose en ce moment");
});

test("inducePattern : & est un liant, la suite de sujet ne se coupe pas", () => {
  const t = inducePattern("J'ai testé Écarlate & Violet");
  // « Écarlate & Violet » = un seul sujet → {X}
  assert.equal(t, "J'ai testé {X}");
});

test("inducePattern : titre 100 % sujet → null (aucune ossature à apprendre)", () => {
  assert.equal(inducePattern("Écarlate Violet Tempête Argentée"), null);
});

test("inducePattern : ossature trop faible (<2 mots) → null", () => {
  assert.equal(inducePattern("Dracaufeu Pikachu"), null);
});

test("inducePattern : ponctuation forte coupe la suite de sujet", () => {
  // « Dracaufeu » puis « : » (coupe) puis « le retour » (ossature courte)
  const t = inducePattern("Dracaufeu, mon plus gros pull de l'année");
  assert.ok(t && t.includes("{X}"));
  assert.ok(t!.startsWith("{X}"));
});

test("applyPattern : réinjecte le sujet + capitale initiale", () => {
  assert.equal(
    applyPattern("{X} : mon avis honnête", "dracaufeu ex"),
    "Dracaufeu ex : mon avis honnête",
  );
});

test("applyPattern : collapse un mot dupliqué à la jointure", () => {
  const out = applyPattern("J'ouvre un display {X}", "display Écarlate");
  assert.equal(out, "J'ouvre un display Écarlate");
});

test("applyPattern : sujet vide → null", () => {
  assert.equal(applyPattern("J'ai testé {X} !", "   "), null);
});

test("applyPattern : dédup un mot d'ossature répété non adjacent (sujet verbeux)", () => {
  const out = applyPattern(
    "J'ai ouvert un display {X} en entier",
    "ouverture display Prismatic Evolutions",
  );
  assert.equal(out, "J'ai ouvert un display ouverture Prismatic Evolutions en entier");
  assert.equal((out!.match(/display/gi) ?? []).length, 1);
});

const PATTERNS: TitlePattern[] = [
  {
    template: "J'ai ouvert un display {X} !",
    source: "mine",
    sourceLabel: "Ta chaîne",
    strength: 3.2,
    isShort: false,
    original: "J'ai ouvert un display 151 !",
  },
  {
    template: "POURQUOI {X} explose en ce moment",
    source: "competitor",
    sourceLabel: "Pokémoniteur",
    strength: 2.1,
    isShort: false,
    original: "POURQUOI Dracaufeu explose en ce moment",
  },
];

test("buildDataDrivenTitles : applique le sujet, trie par preuve décroissante", () => {
  const out = buildDataDrivenTitles("Prismatic Evolutions", PATTERNS);
  assert.equal(out.length, 2);
  assert.equal(out[0].strength, 3.2); // « mine » en tête
  assert.equal(out[0].sourceLabel, "Ta chaîne");
  assert.ok(out[0].title.includes("Prismatic Evolutions"));
  assert.ok(out[1].title.startsWith("POURQUOI Prismatic Evolutions"));
});

test("buildDataDrivenTitles : dédoublonne les titres identiques", () => {
  const dup: TitlePattern[] = [PATTERNS[0], { ...PATTERNS[0], strength: 1 }];
  assert.equal(buildDataDrivenTitles("151", dup).length, 1);
});

test("buildDataDrivenTitles : respecte la limite n", () => {
  const out = buildDataDrivenTitles("Dracaufeu", PATTERNS, { n: 1 });
  assert.equal(out.length, 1);
});
