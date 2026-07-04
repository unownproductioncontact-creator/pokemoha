import { test } from "node:test";
import assert from "node:assert/strict";
import { rankIdeas, analyzeIdea, pickDaily } from "./ideaRanking.ts";
import type { IdeaSignal, Idea, IdeaSource } from "./ideaRanking.ts";

const sig = (
  title: string,
  strength: number,
  source: IdeaSource,
  mechanic?: { id: string; label: string },
): IdeaSignal => ({ title, strength, source, mechanic });

test("rankIdeas — dédoublonne et borne les scores", () => {
  const signals = [
    sig("J'ouvre un carton scellé 1re édition", 10, "world", {
      id: "high-stakes",
      label: "Mise extrême",
    }),
    sig("J'ouvre un carton scellé 1re édition", 8, "niche"), // doublon
    sig("Top 10 cartes du set", 5, "competitor"),
  ];
  const ideas = rankIdeas(signals);
  assert.equal(ideas.length, 2);
  assert.ok(ideas.every((i) => i.opportunity >= 0 && i.opportunity <= 100));
  assert.ok(ideas.every((i) => i.quality >= 0 && i.quality <= 100));
});

test("rankIdeas — anti-déjà-vu (mes titres existants)", () => {
  const signals = [sig("Top 10 cartes du set", 5, "competitor")];
  const ideas = rankIdeas(signals, { myTitles: ["Top 10 des cartes du set"] });
  assert.equal(ideas.length, 0);
});

test("analyzeIdea — note + 5 angles", () => {
  const good = analyzeIdea(
    "J'ouvre un carton scellé à 2000€ pour trouver le Dracaufeu",
  );
  assert.ok(good.score >= 60);
  assert.equal(good.angles.length, 5);
  const weak = analyzeIdea("vlog");
  assert.ok(weak.score < good.score);
});

test("pickDaily — déterministe par seed", () => {
  const ideas: Idea[] = Array.from({ length: 10 }, (_, i) => ({
    id: `i${i}`,
    title: `t${i}`,
    angle: "",
    why: "",
    source: "niche",
    sourceLabel: "Niche",
    opportunity: 50,
    quality: 50,
    keywords: [],
  }));
  const a = pickDaily(ideas, 20260629, 5);
  const b = pickDaily(ideas, 20260629, 5);
  const c = pickDaily(ideas, 20260630, 5);
  assert.equal(a.length, 5);
  assert.deepEqual(
    a.map((x) => x.id),
    b.map((x) => x.id),
  );
  assert.notDeepEqual(
    a.map((x) => x.id),
    c.map((x) => x.id),
  );
});
