import { analyseRepository } from "./analysis.js";
import { migrationDestinationPath } from "./migrationPlan.js";

export function compareScenario(repositories, targets, rules) {
  const targetIds = new Set(targets.map((target) => target.id));
  const moves = repositories.filter((repository) => repository.decision === "merge");
  const archives = repositories.filter((repository) => repository.decision === "archive");
  const unchanged = repositories.filter((repository) => repository.decision === "keep");
  const conflicts = [];
  const review = [];
  const plannedImports = [...moves, ...archives];

  for (const repository of moves) {
    if (!repository.target || !targetIds.has(repository.target)) conflicts.push({ repository, message: "Merge decision has no valid target monorepo." });
  }
  for (const repository of archives) {
    const target = targets.find((item) => item.id === repository.target);
    if (!target || target.kind !== "archive") conflicts.push({ repository, message: "Archive decision has no valid archive monorepo." });
  }
  const destinations = new Map();
  for (const repository of plannedImports) {
    const target = targets.find((item) => item.id === repository.target);
    if (!target) continue;
    const key = `${target.id}:${migrationDestinationPath(repository, target)}`;
    destinations.set(key, [...(destinations.get(key) ?? []), repository]);
  }
  for (const [key, repositoriesAtDestination] of destinations) {
    if (repositoriesAtDestination.length < 2) continue;
    const destination = key.slice(key.indexOf(":") + 1);
    for (const repository of repositoriesAtDestination) conflicts.push({ repository, message: `More than one repository would use destination path ${destination}.` });
  }
  for (const repository of repositories) {
    const analysis = analyseRepository(repository, targets, rules);
    if ((analysis.action !== repository.decision || (["merge", "archive"].includes(analysis.action) && analysis.target !== repository.target)) && !analysis.hardStops.length) review.push({ repository, analysis });
  }
  return { moves, archives, unchanged, conflicts, review };
}
