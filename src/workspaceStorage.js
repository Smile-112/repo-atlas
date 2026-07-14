export const WORKSPACE_VERSION = 2;
const STORAGE_KEY = `repo-atlas.workspace.v${WORKSPACE_VERSION}`;
const decisions = new Set(["keep", "merge", "archive"]);
const histories = new Set(["full", "squash"]);

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
