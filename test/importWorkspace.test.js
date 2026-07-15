import test from "node:test";
import assert from "node:assert/strict";
import { mergeImportedRepositories } from "../src/importWorkspace.js";

test("provider refresh preserves user-owned workspace decisions", () => {
  const current = [{ id: "owner/project", tags: ["important"], decision: "merge", target: "personal-lab", history: "squash", description: "Old" }];
  const imported = [{ id: "owner/project", tags: ["python"], decision: "keep", target: null, history: "full", description: "Fresh" }];
  assert.deepEqual(mergeImportedRepositories(current, imported)[0], {
    ...imported[0], tags: ["python", "important"], decision: "merge", target: "personal-lab", history: "squash"
  });
});
