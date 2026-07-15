const API_URL = "https://api.github.com";

export function configuredOwners(value) {
  if (!value) return [];
  return [...new Set(value.split(",").map((owner) => owner.trim()).filter((owner) => /^[A-Za-z0-9-]{1,39}$/.test(owner)))];
}

const topicTechnologies = new Set(["docker", "django", "fastapi", "flask", "react", "vue", "angular", "nodejs", "node", "typescript", "javascript", "vite", "nextjs", "postgresql", "mysql", "redis", "mongodb", "spring", "gradle", "maven", "forge", "fabric", "kotlin", "rust", "golang", "go", "aiogram", "telegram-bot"]);

export function classifyTechnologies(repository, languages = {}) {
  const detected = new Set(Object.keys(languages));
  for (const topic of repository.topics ?? []) {
    const normalized = topic.toLowerCase();
    if (topicTechnologies.has(normalized)) detected.add(normalized);
  }
  if (repository.language) detected.add(repository.language);
  return [...detected].sort((left, right) => left.localeCompare(right));
}

export function normalizeRepository(repository, languages = {}, headSha = null) {
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
    technologies: classifyTechnologies(repository, languages),
    decision: "keep",
    target: null,
    history: "full",
    provider: "github",
    visibility: repository.private ? "private" : "public",
    archived: Boolean(repository.archived),
    defaultBranch: repository.default_branch ?? "main",
    headSha,
    fork: Boolean(repository.fork),
    license: repository.license?.spdx_id ?? null
  };
}

async function fetchRepositoryLanguages({ token, languagesUrl, fetchImpl }) {
  if (!languagesUrl) return {};
  const response = await fetchImpl(languagesUrl, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "repo-atlas"
    }
  });
  return response.ok ? response.json() : {};
}

async function fetchDefaultBranchSha({ token, repository, fetchImpl }) {
  if (!repository.full_name || !repository.default_branch) return null;
  const response = await fetchImpl(`${API_URL}/repos/${repository.full_name}/git/ref/heads/${encodeURIComponent(repository.default_branch)}`, {
    headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${token}`, "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "repo-atlas" }
  });
  if (!response.ok) return null;
  const reference = await response.json();
  return reference.object?.sha ?? null;
}

async function mapWithConcurrency(items, limit, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(items[index]);
    }
  }));
  return results;
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
    const normalized = await mapWithConcurrency(owned, 5, async (repository) => {
      try {
        const [languages, headSha] = await Promise.all([
          fetchRepositoryLanguages({ token, languagesUrl: repository.languages_url, fetchImpl }),
          fetchDefaultBranchSha({ token, repository, fetchImpl })
        ]);
        return normalizeRepository(repository, languages, headSha);
      } catch {
        return normalizeRepository(repository);
      }
    });
    repositories.push(...normalized);
    if (pageItems.length < 100) break;
    page += 1;
  }

  return repositories;
}
