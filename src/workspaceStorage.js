export const WORKSPACE_VERSION = 3;
const STORAGE_KEY = `repo-atlas.workspace.v${WORKSPACE_VERSION}`;
const LEGACY_STORAGE_KEYS = ["repo-atlas.workspace.v2"];
const decisions = new Set(["keep", "merge", "archive"]);
const histories = new Set(["full", "squash"]);
const statuses = new Set(["Active", "Maintenance", "Complete", "Archived"]);

function validTags(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((tag) => typeof tag === "string" && tag.length > 0 && tag.length <= 48))];
}

function repairRepositories(value, fallback) {
  if (!Array.isArray(value)) return fallback;
  const repositories = value.map((repository) => ({
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
  return repositories.length ? repositories : fallback;
}

function repairTargets(value, fallback) {
  if (!Array.isArray(value)) return fallback;
  const ids = new Set();
  const targets = value.filter((target) => {
    if (!target || typeof target.id !== "string" || !target.id || ids.has(target.id)) return false;
    ids.add(target.id);
    return true;
  }).map((target) => ({
    id: target.id,
    name: target.kind === "archive" && target.name === "Archive" ? "Archive monorepo" : typeof target.name === "string" && target.name.trim() ? target.name.trim() : target.id,
    description: typeof target.description === "string" ? target.description : "",
    strategy: target.strategy === "Squashed imports" ? "Squashed imports" : "Full Git history",
    pathPrefix: typeof target.pathPrefix === "string" && /^[a-zA-Z0-9/_-]+$/.test(target.pathPrefix) ? target.pathPrefix.replace(/^\/+|\/+$/g, "") : "projects",
    defaultBranch: typeof target.defaultBranch === "string" && target.defaultBranch.trim() ? target.defaultBranch.trim() : "main",
    remoteUrl: typeof target.remoteUrl === "string" ? target.remoteUrl.trim() : "",
    kind: target.kind === "archive" ? "archive" : "monorepo"
  }));
  const repaired = targets.length ? targets : fallback;
  const required = fallback.filter((target) => target.kind === "archive" && !repaired.some((item) => item.kind === "archive"));
  return [...repaired, ...required];
}

function defaultWorkspace(initialRepositories, initialTargets, source = "demo") {
  return { repositories: initialRepositories, targets: initialTargets, scenarioName: "Consolidation 2026", savedViews: [], source };
}

export function parseWorkspace(value, initialRepositories = [], initialTargets = []) {
  if (!value || typeof value !== "object" || !Array.isArray(value.repositories)) return defaultWorkspace(initialRepositories, initialTargets, "incompatible");
  const targets = repairTargets(value.targets, initialTargets);
  const archiveTarget = targets.find((target) => target.kind === "archive")?.id ?? null;
  const repositories = repairRepositories(value.repositories, initialRepositories).map((repository) => repository.decision === "archive" && !repository.target ? { ...repository, target: archiveTarget, history: "full" } : repository);
  return {
    repositories,
    targets,
    scenarioName: typeof value.scenarioName === "string" && value.scenarioName.trim() ? value.scenarioName.trim().slice(0, 80) : "Consolidation 2026",
    savedViews: Array.isArray(value.savedViews) ? value.savedViews.filter((view) => view && typeof view.name === "string").slice(0, 20) : [],
    source: value.version === WORKSPACE_VERSION ? "local" : "migrated"
  };
}

export function loadWorkspace(initialRepositories, initialTargets = []) {
  try {
    const current = window.localStorage.getItem(STORAGE_KEY);
    if (current) return parseWorkspace(JSON.parse(current), initialRepositories, initialTargets);
    for (const key of LEGACY_STORAGE_KEYS) {
      const legacy = window.localStorage.getItem(key);
      if (legacy) return parseWorkspace(JSON.parse(legacy), initialRepositories, initialTargets);
    }
    return defaultWorkspace(initialRepositories, initialTargets);
  } catch {
    return defaultWorkspace(initialRepositories, initialTargets, "recovered");
  }
}

export function serializeWorkspace(workspace) {
  return JSON.stringify({ version: WORKSPACE_VERSION, updatedAt: new Date().toISOString(), ...workspace }, null, 2);
}

export function saveWorkspace(workspace) {
  window.localStorage.setItem(STORAGE_KEY, serializeWorkspace(workspace));
}

export function clearWorkspace() {
  window.localStorage.removeItem(STORAGE_KEY);
  for (const key of LEGACY_STORAGE_KEYS) window.localStorage.removeItem(key);
}
