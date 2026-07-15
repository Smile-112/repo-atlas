import test from "node:test";
import assert from "node:assert/strict";
import { buildMigrationManifest, manifestToMarkdown } from "../src/migrationPlan.js";

test("creates a non-destructive manifest with exact import metadata", () => {
  const manifest = buildMigrationManifest([{ id: "owner/bridge", decision: "merge", target: "minecraft-addons", history: "full", url: "https://github.com/owner/bridge", defaultBranch: "main", headSha: "abc123" }], [{ id: "minecraft-addons" }], "2026-07-15T00:00:00.000Z");
  assert.equal(manifest.safety.executesGitOperations, false);
  assert.deepEqual(manifest.moves[0], { sourceRepository: "owner/bridge", sourceUrl: "https://github.com/owner/bridge", sourceBranch: "main", sourceCommitSha: "abc123", targetMonorepo: "minecraft-addons", destinationPath: "mods/bridge", historyStrategy: "full", status: "ready-for-human-review", verification: { preMigration: "pending", postMigration: "pending", originalRepository: "preserve-until-verified" } });
  assert.match(manifestToMarkdown(manifest), /Source SHA: abc123/);
});

test("marks incomplete source metadata as a blocking review gap", () => {
  const manifest = buildMigrationManifest([{ id: "old-project", decision: "merge", target: "personal-lab", history: "squash" }], [{ id: "personal-lab" }]);
  assert.equal(manifest.moves[0].status, "needs-source-metadata");
});
