import { test } from "node:test";
import assert from "node:assert/strict";
import {
  splitCsvLine,
  parseReachCsv,
  pickReportsForWindow,
  combineCtr,
  type ReportMeta,
} from "./reportingCore.ts";

test("splitCsvLine : respecte les guillemets et virgules internes", () => {
  assert.deepEqual(splitCsvLine("a,b,c"), ["a", "b", "c"]);
  assert.deepEqual(splitCsvLine('a,"b,c",d'), ["a", "b,c", "d"]);
  assert.deepEqual(splitCsvLine('a,"b""x",c'), ["a", 'b"x', "c"]);
});

test("parseReachCsv : trouve les colonnes par nom, quel que soit l'ordre", () => {
  const csv = [
    "date,video_thumbnail_impressions_ctr,channel_id,video_thumbnail_impressions",
    "20260701,0.10,UCabc,1000",
    "20260701,0.05,UCabc,2000",
  ].join("\n");
  const r = parseReachCsv(csv);
  assert.equal(r.impressions, 3000);
  // clics = 1000*0.10 + 2000*0.05 = 100 + 100 = 200
  assert.equal(r.clicks, 200);
});

test("parseReachCsv : CSV vide ou sans colonnes utiles → zéro", () => {
  assert.deepEqual(parseReachCsv(""), { impressions: 0, clicks: 0 });
  assert.deepEqual(parseReachCsv("date,views\n20260701,5"), {
    impressions: 0,
    clicks: 0,
  });
});

test("parseReachCsv : ignore lignes malformées / impressions nulles", () => {
  const csv = [
    "video_thumbnail_impressions,video_thumbnail_impressions_ctr",
    "500,0.08",
    "0,0.5", // impressions nulles → ignorée
    "abc,0.1", // non numérique → ignorée
    "300", // colonne manquante → ignorée
  ].join("\n");
  const r = parseReachCsv(csv);
  assert.equal(r.impressions, 500);
  assert.equal(Math.round(r.clicks), 40);
});

test("combineCtr : CTR pondéré par les impressions (fraction 0..1)", () => {
  const r = combineCtr([
    { impressions: 1000, clicks: 100 }, // 10 %
    { impressions: 3000, clicks: 150 }, // 5 %
  ]);
  assert.equal(r.impressions, 4000);
  assert.equal(r.clicks, 250);
  assert.ok(Math.abs(r.ctr! - 0.0625) < 1e-9); // 250/4000
});

test("combineCtr : normalise si la source était en pourcentage", () => {
  // clics = imp * 5 (ctr=5.0 signifiait 5 %) → ratio 5 > 1 → /100
  const r = combineCtr([{ impressions: 1000, clicks: 5000 }]);
  assert.ok(Math.abs(r.ctr! - 0.05) < 1e-9);
});

test("combineCtr : aucune impression → ctr null (indisponible, jamais inventé)", () => {
  assert.equal(combineCtr([]).ctr, null);
  assert.equal(combineCtr([{ impressions: 0, clicks: 0 }]).ctr, null);
});

test("pickReportsForWindow : un rapport par jour (le plus récent), fenêtré", () => {
  const reports: ReportMeta[] = [
    { startTime: "2026-07-01", createTime: "2026-07-02T01:00:00Z", downloadUrl: "d1a" },
    { startTime: "2026-07-01", createTime: "2026-07-03T01:00:00Z", downloadUrl: "d1b" }, // réédition + récente
    { startTime: "2026-07-02", createTime: "2026-07-03T01:00:00Z", downloadUrl: "d2" },
    { startTime: "2026-07-03", createTime: "2026-07-04T01:00:00Z", downloadUrl: "d3" },
  ];
  const picked = pickReportsForWindow(reports, 2);
  assert.equal(picked.length, 2);
  assert.equal(picked[0].startTime, "2026-07-03"); // trié desc
  assert.equal(picked[1].startTime, "2026-07-02");
  // Le jour 07-01 dédupliqué garderait d1b (createTime le plus récent)
  const all = pickReportsForWindow(reports, 10);
  assert.equal(all.find((r) => r.startTime === "2026-07-01")!.downloadUrl, "d1b");
});

test("pickReportsForWindow : ignore les rapports sans URL / date", () => {
  const reports: ReportMeta[] = [
    { startTime: "", createTime: "x", downloadUrl: "d" },
    { startTime: "2026-07-01", createTime: "x", downloadUrl: "" },
    { startTime: "2026-07-02", createTime: "x", downloadUrl: "ok" },
  ];
  const picked = pickReportsForWindow(reports, 10);
  assert.equal(picked.length, 1);
  assert.equal(picked[0].downloadUrl, "ok");
});
