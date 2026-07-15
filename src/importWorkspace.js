const workspaceFields = ["decision", "target", "history", "note"];

export function mergeImportedRepositories(currentRepositories, importedRepositories) {
  const currentById = new Map(currentRepositories.map((repository) => [repository.id, repository]));
  return importedRepositories.map((repository) => {
    const current = currentById.get(repository.id);
    if (!current) return repository;
    const merged = {
      ...repository,
      tags: [...new Set([...(repository.tags ?? []), ...(current.tags ?? [])])]
    };
    for (const field of workspaceFields) {
      if (current[field] !== undefined) merged[field] = current[field];
    }
    return merged;
  });
}
