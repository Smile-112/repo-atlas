import test from "node:test";
import assert from "node:assert/strict";
import { configuredLocalPaths, inspectLocalRepository, safeRemoteUrl } from "../server/localGit.js";

test("local adapter accepts only explicit absolute paths", () => {
  assert.deepEqual(configuredLocalPaths("/repos/one, relative, /repos/one, /repos/two"), ["/repos/one", "/repos/two"]);
});

test("local adapter never exposes remote credentials", async () => {
  const execute = async (_command, args) => ({ stdout: args.includes("rev-parse") ? "abc123\n" : args.includes("symbolic-ref") ? "main\n" : args.includes("log") ? "2026-07-15T12:00:00Z\n" : "https://user:token@example.test/repo.git\n" });
  const repository = await inspectLocalRepository("/repositories/example", execute);
  assert.equal(repository.id, "local/example");
  assert.equal(repository.url, "https://example.test/repo.git");
});

test("local adapter converts scp-style SSH remotes into usable safe URLs", () => {
  assert.equal(safeRemoteUrl("git@github.com:owner/project.git"), "https://github.com/owner/project.git");
});
