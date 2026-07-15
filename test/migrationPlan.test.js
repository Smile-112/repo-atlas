import test from "node:test";
import assert from "node:assert/strict";
import { buildMigrationManifest, manifestToMarkdown } from "../src/migrationPlan.js";

test("creates a non-destructive manifest with exact import metadata", () => {
  const manifest = buildMigrationManifest([{ id: "owner/bridge", decision: "merge", target: "minecraft-addons", history: "full", url: "https://github.com/owner/bridge", defaultBranch: "main", headSha: "abc123" }], [{ id: "minecraft-addons" }], "2026-07-15T00:00:00.000Z");
  assert.equal(manifest.safety.executesGitOperations, false);
  assert.equal(manifest.moves[0].sourceCommitSha, "abc123");
  assert.equal(manifest.moves[0].rollback.safetyBranch, "repo-atlas/before-bridge-abc123");
  assert.match(manifest.moves[0].commands.at(-2), /git subtree add/);
  assert.match(manifestToMarkdown(manifest), /Source SHA: abc123/);
  assert.match(manifestToMarkdown(manifest), /git revert -m 1/);
});

test("marks incomplete source metadata as a blocking review gap", () => {
  const manifest = buildMigrationManifest([{ id: "old-project", decision: "merge", target: "personal-lab", history: "squash" }], [{ id: "personal-lab" }]);
  assert.equal(manifest.moves[0].status, "needs-source-metadata");
});

test("uses the configured target default branch", () => {
  const manifest = buildMigrationManifest([{ id: "owner/app", decision: "merge", target: "lab", history: "full", url: "https://example.test/app", defaultBranch: "main", headSha: "abc123" }], [{ id: "lab", defaultBranch: "develop" }]);
  assert.match(manifest.moves[0].commands[2], /develop/);
});

test("blocks duplicate destination paths before commands are generated", () => {
  const source = (id) => ({ id, decision: "merge", target: "lab", history: "full", url: `https://example.test/${id}`, defaultBranch: "main", headSha: "abc123" });
  const manifest = buildMigrationManifest([source("first/app"), source("second/app")], [{ id: "lab" }]);
  assert.equal(manifest.moves[0].status, "destination-conflict");
  assert.equal(manifest.moves[1].status, "destination-conflict");
  assert.deepEqual(manifest.moves[0].commands, []);
  assert.equal(manifest.unresolved.length, 2);
});
