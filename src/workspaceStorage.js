export const WORKSPACE_VERSION = 2;
const STORAGE_KEY = `repo-atlas.workspace.v${WORKSPACE_VERSION}`;
const decisions = new Set(["keep", "merge", "archive"]);
const histories = new Set(["full", "squash"]);
const statuses = new Set(["Active", "Maintenance", "Complete", "Archived"]);

function validTags(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((tag) => typeof tag === "string" && tag.length > 0 && tag.length <= 48))];
}

export function loadWorkspace(initialRepositories) {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { repositories: initialRepositories, source: "demo" };

    const parsed = JSON.parse(raw);
    if (parsed.version !== WORKSPACE_VERSION || !Array.isArray(parsed.repositories)) {
      return { repositories: initialRepositories, source: "incompatible" };
    }

    const repositories = parsed.repositories.map((repository) => ({
      ...repository,
      tags: validTags(repository.tags),
      technologies: validTags(repository.technologies),
      status: statuses.has(repository.status) ? repository.status : "Maintenance",
      domain: typeof repository.domain === "string" ? repository.domain : "Unclassified",
      language: typeof repository.language === "string" ? repository.language : "Unknown",
      updated: typeof repository.updated === "string" ? repository.updated : "Unknown",
      score: Number.isFinite(repository.score) ? Math.max(0, Math.min(100, repository.score)) : 0,
      size: Number.isFinite(repository.size) ? Math.max(0, repository.size) : 0,
      decision: decisions.has(repository.decision) ? repository.decision : "keep",
      target: typeof repository.target === "string" ? repository.target : null,
      history: histories.has(repository.history) ? repository.history : "full"
    })).filter((repository) => typeof repository.id === "string" && typeof repository.description === "string");
    if (!repositories.length) return { repositories: initialRepositories, source: "incompatible" };
    return { repositories, source: "local" };
  } catch {
    return { repositories: initialRepositories, source: "recovered" };
  }
}

export function saveWorkspace(repositories) {
  const workspace = {
    version: WORKSPACE_VERSION,
    updatedAt: new Date().toISOString(),
    repositories
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
}

export function clearWorkspace() {
  window.localStorage.removeItem(STORAGE_KEY);
}
