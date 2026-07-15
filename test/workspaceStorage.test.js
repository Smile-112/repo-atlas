import test from "node:test";
import assert from "node:assert/strict";
import { loadWorkspace, WORKSPACE_VERSION } from "../src/workspaceStorage.js";

test("repairs incomplete persisted repository data before rendering", () => {
  global.window = { localStorage: { getItem: () => JSON.stringify({ version: WORKSPACE_VERSION, repositories: [{ id: "owner/project", description: "Project", tags: null, technologies: null, score: 200, size: -3 }] }) } };
  const workspace = loadWorkspace([]);
  assert.deepEqual(workspace.repositories[0].tags, []);
  assert.deepEqual(workspace.repositories[0].technologies, []);
  assert.equal(workspace.repositories[0].status, "Maintenance");
  assert.equal(workspace.repositories[0].score, 100);
  assert.equal(workspace.repositories[0].size, 0);
  delete global.window;
});
