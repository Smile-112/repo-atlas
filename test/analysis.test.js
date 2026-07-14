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
