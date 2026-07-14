export const WORKSPACE_VERSION = 1;
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

    const saved = new Map(parsed.repositories.map((repository) => [repository.id, repository]));
    const repositories = initialRepositories.map((repository) => {
      const workspace = saved.get(repository.id);
      if (!workspace) return repository;
      return {
        ...repository,
        tags: validTags(workspace.tags),
        decision: decisions.has(workspace.decision) ? workspace.decision : repository.decision,
        target: typeof workspace.target === "string" ? workspace.target : null,
        history: histories.has(workspace.history) ? workspace.history : repository.history
      };
    });
    return { repositories, source: "local" };
  } catch {
    return { repositories: initialRepositories, source: "recovered" };
  }
}

export function saveWorkspace(repositories) {
  const workspace = {
    version: WORKSPACE_VERSION,
    updatedAt: new Date().toISOString(),
    repositories: repositories.map(({ id, tags, decision, target, history }) => ({ id, tags, decision, target, history }))
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
}

export function clearWorkspace() {
  window.localStorage.removeItem(STORAGE_KEY);
}
