import test from "node:test";
import assert from "node:assert/strict";
import { fetchGitLabProjects, gitlabBaseUrl, normalizeGitLabProject } from "../server/gitlab.js";

test("normalizes a GitLab project", () => {
  const project = normalizeGitLabProject({ path_with_namespace: "group/project", web_url: "https://gitlab.com/group/project", description: "Project", topics: ["demo"], default_branch: "main", last_activity_at: new Date().toISOString(), visibility: "private" }, { JavaScript: 100 });
  assert.equal(project.provider, "gitlab"); assert.equal(project.language, "JavaScript"); assert.equal(project.visibility, "private");
});

test("imports GitLab projects without returning the token", async () => {
  const fetchImpl = async (url) => url.includes("/languages")
    ? { ok: true, json: async () => ({ Python: 100 }) }
    : url.includes("/repository/branches/")
      ? { ok: true, json: async () => ({ commit: { id: "deadbeef" } }) }
      : { ok: true, json: async () => [{ id: 1, path_with_namespace: "group/project", web_url: "https://gitlab.com/group/project", default_branch: "main", last_activity_at: new Date().toISOString() }] };
  const projects = await fetchGitLabProjects({ token: "hidden", fetchImpl });
  assert.equal(projects.length, 1); assert.equal("token" in projects[0], false);
  assert.equal(projects[0].headSha, "deadbeef");
  assert.equal(gitlabBaseUrl("not a url"), "https://gitlab.com");
  assert.equal(gitlabBaseUrl("file:///etc/passwd"), "https://gitlab.com");
});
