import test from "node:test";
import assert from "node:assert/strict";
import { compareScenario } from "../src/compare.js";

test("reports invalid planned moves as conflicts", () => {
  const comparison = compareScenario([{ id: "one", tags: [], domain: "Web", technologies: [], size: 10, status: "Active", decision: "merge", target: "missing" }], [{ id: "personal-lab" }]);
  assert.equal(comparison.conflicts.length, 1);
  assert.equal(comparison.moves.length, 1);
});
