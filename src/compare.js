import { analyseRepository } from "./analysis.js";

export function compareScenario(repositories, targets, rules) {
  const targetIds = new Set(targets.map((target) => target.id));
  const moves = repositories.filter((repository) => repository.decision === "merge");
  const archives = repositories.filter((repository) => repository.decision === "archive");
  const unchanged = repositories.filter((repository) => repository.decision === "keep");
  const conflicts = [];
  const review = [];

  for (const repository of moves) {
    if (!repository.target || !targetIds.has(repository.target)) conflicts.push({ repository, message: "Merge decision has no valid target monorepo." });
  }
  for (const repository of repositories) {
    const analysis = analyseRepository(repository, targets, rules);
    if (analysis.action !== repository.decision && !analysis.hardStops.length) review.push({ repository, analysis });
  }
  return { moves, archives, unchanged, conflicts, review };
}
