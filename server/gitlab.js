const DEFAULT_GITLAB_URL = "https://gitlab.com";

export function gitlabBaseUrl(value) {
  try { return new URL(value || DEFAULT_GITLAB_URL).origin; } catch { return DEFAULT_GITLAB_URL; }
}

function headers(token) {
  return { Accept: "application/json", "PRIVATE-TOKEN": token, "User-Agent": "repo-atlas" };
}

export function normalizeGitLabProject(project, languages = {}) {
  const updatedAt = project.last_activity_at ?? project.updated_at;
  const ageInDays = updatedAt ? Math.floor((Date.now() - new Date(updatedAt).getTime()) / 86_400_000) : Infinity;
  return {
    id: project.path_with_namespace, fullName: project.path_with_namespace, url: project.web_url, domain: "Unclassified",
    status: project.archived ? "Archived" : ageInDays < 365 ? "Active" : "Maintenance", language: Object.keys(languages)[0] ?? "Unknown",
    updated: updatedAt?.slice(0, 10) ?? "Unknown", size: 0, score: Math.min(100, 45 + (project.description ? 10 : 0) + (project.archived ? 0 : 15) + (ageInDays < 365 ? 25 : 0)),
    description: project.description ?? "No description provided.", tags: project.topics ?? [], technologies: Object.keys(languages).sort(),
    decision: "keep", target: null, history: "full", provider: "gitlab", visibility: project.visibility ?? "private", archived: Boolean(project.archived),
    defaultBranch: project.default_branch ?? "main", headSha: null, fork: Boolean(project.forked_from_project), license: null
  };
}

async function mapWithConcurrency(items, limit, mapper) {
  const results = new Array(items.length); let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => { while (next < items.length) { const index = next++; results[index] = await mapper(items[index]); } }));
  return results;
}

export async function fetchGitLabProjects({ token, baseUrl, fetchImpl = fetch }) {
  const projects = []; const origin = gitlabBaseUrl(baseUrl);
  for (let page = 1; page <= 10; page += 1) {
    const response = await fetchImpl(`${origin}/api/v4/projects?membership=true&simple=true&order_by=last_activity_at&sort=desc&per_page=100&page=${page}`, { headers: headers(token) });
    if (!response.ok) { const error = new Error(`GitLab API request failed with ${response.status}`); error.status = response.status; throw error; }
    const pageItems = await response.json();
    const normalized = await mapWithConcurrency(pageItems, 5, async (project) => {
      const languageResponse = await fetchImpl(`${origin}/api/v4/projects/${project.id}/languages`, { headers: headers(token) });
      return normalizeGitLabProject(project, languageResponse.ok ? await languageResponse.json() : {});
    });
    projects.push(...normalized);
    if (pageItems.length < 100) break;
  }
  return projects;
}
