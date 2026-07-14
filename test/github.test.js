import test from "node:test";
import assert from "node:assert/strict";
import { configuredOwners, fetchOwnedRepositories, normalizeRepository } from "../server/github.js";

test("parses a safe, unique list of configured owners", () => {
  assert.deepEqual(configuredOwners("Smile-112, team, Smile-112, invalid owner"), ["Smile-112", "team"]);
});

test("normalizes GitHub repositories without exposing token data", () => {
  const normalized = normalizeRepository({
    full_name: "octo/example", html_url: "https://github.com/octo/example", private: true,
    archived: false, language: "JavaScript", description: "Example", topics: ["demo"],
    pushed_at: new Date().toISOString(), size: 12, has_issues: true, default_branch: "main",
    fork: false, license: { spdx_id: "MIT" }
  });
  assert.equal(normalized.id, "octo/example");
  assert.equal(normalized.visibility, "private");
  assert.equal(normalized.status, "Active");
  assert.deepEqual(normalized.tags, ["demo"]);
  assert.equal("token" in normalized, false);
});

test("filters imported repositories to the requested owner", async () => {
  const fetchImpl = async () => ({ ok: true, json: async () => [
    { full_name: "Smile-112/one", html_url: "https://github.com/Smile-112/one", owner: { login: "Smile-112" }, topics: [] },
    { full_name: "other/two", html_url: "https://github.com/other/two", owner: { login: "other" }, topics: [] }
  ] });
  const repositories = await fetchOwnedRepositories({ token: "never-sent", owner: "smile-112", fetchImpl });
  assert.equal(repositories.length, 1);
  assert.equal(repositories[0].id, "Smile-112/one");
});
