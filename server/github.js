const API_URL = "https://api.github.com";

export function normalizeRepository(repository) {
  const pushedAt = repository.pushed_at ? new Date(repository.pushed_at) : null;
  const ageInDays = pushedAt ? Math.floor((Date.now() - pushedAt.getTime()) / 86_400_000) : Number.POSITIVE_INFINITY;
  const status = repository.archived ? "Archived" : ageInDays < 365 ? "Active" : "Maintenance";
  const score = Math.min(100, 35 + (repository.description ? 10 : 0) + (repository.license ? 10 : 0) + (repository.has_issues ? 5 : 0) + (ageInDays < 365 ? 25 : 0) + (repository.archived ? 0 : 10));

  return {
    id: repository.full_name,
    fullName: repository.full_name,
    url: repository.html_url,
    domain: "Unclassified",
    status,
    language: repository.language ?? "Unknown",
    updated: repository.pushed_at?.slice(0, 10) ?? repository.updated_at?.slice(0, 10) ?? "Unknown",
    size: repository.size ?? 0,
    score,
    description: repository.description ?? "No description provided.",
    tags: Array.isArray(repository.topics) ? repository.topics : [],
    decision: "keep",
    target: null,
    history: "full",
    provider: "github",
    visibility: repository.private ? "private" : "public",
    archived: Boolean(repository.archived),
    defaultBranch: repository.default_branch ?? "main",
    fork: Boolean(repository.fork),
    license: repository.license?.spdx_id ?? null
  };
}

export async function fetchOwnedRepositories({ token, owner, fetchImpl = fetch }) {
  const repositories = [];
  let page = 1;

  while (page <= 10) {
    const response = await fetchImpl(`${API_URL}/user/repos?affiliation=owner&per_page=100&sort=updated&direction=desc&page=${page}`, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "repo-atlas"
      }
    });

    if (!response.ok) {
      const error = new Error(`GitHub API request failed with ${response.status}`);
      error.status = response.status;
      throw error;
    }

    const pageItems = await response.json();
    const owned = pageItems.filter((repository) => !owner || repository.owner?.login?.toLowerCase() === owner.toLowerCase());
    repositories.push(...owned.map(normalizeRepository));
    if (pageItems.length < 100) break;
    page += 1;
  }

  return repositories;
}
