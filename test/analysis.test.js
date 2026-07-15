import test from "node:test";
import assert from "node:assert/strict";
import { analyseRepository } from "../src/analysis.js";

const targets = [{ id: "minecraft-addons" }, { id: "personal-lab" }, { id: "learning-archive" }];

test("recommends the Minecraft monorepo with explainable evidence", () => {
  const result = analyseRepository({ tags: ["minecraft", "forge"], technologies: ["Java"], domain: "Minecraft", size: 12, status: "Active" }, targets);
  assert.equal(result.action, "merge");
  assert.equal(result.target, "minecraft-addons");
  assert.ok(result.reasons.length > 1);
});

test("hard stop-factor prevents a merge recommendation", () => {
  const result = analyseRepository({ tags: ["client", "minecraft"], technologies: ["Java"], domain: "Minecraft", size: 12, status: "Active" }, targets);
  assert.equal(result.action, "keep");
  assert.equal(result.hardStops.length, 1);
});

test("recommends the shared archive as an archive action, not a normal merge", () => {
  const result = analyseRepository(
    { tags: ["legacy"], technologies: ["Go"], domain: "Portfolio", size: 8, status: "Archived" },
    [...targets, { id: "archive", kind: "archive" }]
  );
  assert.equal(result.action, "archive");
  assert.equal(result.target, "archive");
  assert.ok(result.confidence >= 60);
});

test("reports confidence in keeping a repository separately instead of exposing its weak merge score", () => {
  const result = analyseRepository({ tags: [], technologies: ["JavaScript"], domain: "Unclassified", size: 100, status: "Active" }, targets);
  assert.equal(result.action, "keep");
  assert.equal(result.confidence, 90);
  assert.equal(result.criteria.length, 5);
  assert.match(result.criteria.at(-1), /scored 12\/100; threshold is 60/);
});
