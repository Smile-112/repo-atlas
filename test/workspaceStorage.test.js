import test from "node:test";
import assert from "node:assert/strict";
import { loadWorkspace, parseWorkspace, serializeWorkspace, WORKSPACE_VERSION } from "../src/workspaceStorage.js";

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

test("migrates version two workspaces without losing repositories", () => {
  const legacy = { version: 2, repositories: [{ id: "owner/project", description: "Project", tags: [], technologies: [] }] };
  const workspace = parseWorkspace(legacy, [], [{ id: "default", name: "default" }]);
  assert.equal(workspace.source, "migrated");
  assert.equal(workspace.repositories[0].id, "owner/project");
  assert.equal(workspace.targets[0].id, "default");
});

test("workspace export preserves editable targets and saved views", () => {
  const value = JSON.parse(serializeWorkspace({ repositories: [], targets: [{ id: "apps", name: "Apps", pathPrefix: "packages" }], scenarioName: "Q3", savedViews: [{ name: "Python" }] }));
  assert.equal(value.version, WORKSPACE_VERSION);
  assert.equal(value.targets[0].pathPrefix, "packages");
  assert.equal(value.savedViews[0].name, "Python");
});

test("adds the required archive target to an existing workspace and connects archive decisions", () => {
  const fallbackTargets = [{ id: "apps", name: "Apps" }, { id: "archive", name: "Archive", kind: "archive" }];
  const workspace = parseWorkspace({ version: WORKSPACE_VERSION, repositories: [{ id: "old/app", description: "Old", decision: "archive" }], targets: [{ id: "apps", name: "Apps" }] }, [], fallbackTargets);
  assert.equal(workspace.targets.find((target) => target.kind === "archive").id, "archive");
  assert.equal(workspace.repositories[0].target, "archive");
  assert.equal(workspace.repositories[0].history, "full");
});
