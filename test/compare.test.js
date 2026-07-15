import test from "node:test";
import assert from "node:assert/strict";
import { compareScenario } from "../src/compare.js";

test("reports invalid planned moves as conflicts", () => {
  const comparison = compareScenario([{ id: "one", tags: [], domain: "Web", technologies: [], size: 10, status: "Active", decision: "merge", target: "missing" }], [{ id: "personal-lab" }]);
  assert.equal(comparison.conflicts.length, 1);
  assert.equal(comparison.moves.length, 1);
});

test("reports duplicate monorepo destination paths as conflicts", () => {
  const repositories = ["one/app", "two/app"].map((id) => ({ id, decision: "merge", target: "lab", tags: [], technologies: [], language: "Unknown", domain: "Other", status: "Active", size: 1 }));
  const result = compareScenario(repositories, [{ id: "lab" }], { mergeThreshold: 60, hardStopTags: [] });
  assert.equal(result.conflicts.length, 2);
  assert.match(result.conflicts[0].message, /destination path/);
});
