export const DEFAULT_RULES = {
  mergeThreshold: 60,
  hardStopTags: ["client", "fork", "keep-separate"]
};

const targetProfiles = {
  "minecraft-addons": { tags: ["minecraft", "forge", "fabric", "steamcraft"], technologies: ["Java", "Kotlin"], domains: ["Minecraft"] },
  "personal-lab": { tags: ["bot", "automation", "utility", "experiment"], technologies: ["Python", "JavaScript", "TypeScript"], domains: ["Automation"] },
  "learning-archive": { tags: ["learning", "django", "practicum"], technologies: ["Python"], domains: ["Learning"] },
  archive: { tags: ["archive", "legacy", "old", "completed"], technologies: [], domains: [] }
};

function overlap(left, right) {
  const values = new Set(right.map((item) => item.toLowerCase()));
  return left.filter((item) => values.has(item.toLowerCase()));
}

export function analyseRepository(repository, targets, rules = DEFAULT_RULES) {
  const tags = repository.tags ?? [];
  const stack = repository.technologies ?? [repository.language].filter(Boolean);
  const criteria = [
    tags.length ? `Repository tags checked: ${tags.map((tag) => `#${tag}`).join(", ")}.` : "No repository tags were available.",
    stack.length ? `Technology stack checked: ${stack.join(", ")}.` : "No technology stack was available.",
    `Domain checked: ${repository.domain || "Unclassified"}.`,
    `Lifecycle checked: ${repository.status || "Unknown"}.`
  ];
  const hardStops = [
    ...(repository.fork ? ["Repository is a fork and may need upstream updates."] : []),
    ...tags.filter((tag) => rules.hardStopTags.includes(tag)).map((tag) => `The #${tag} tag prevents automatic merge recommendations.`)
  ];
  if (hardStops.length) return { action: "keep", confidence: 100, target: null, reasons: ["A hard stop-factor protects this repository from merge recommendations."], concerns: hardStops, hardStops, criteria };

  const candidates = targets.map((target) => {
    const profile = targetProfiles[target.id] ?? { tags: [], technologies: [], domains: [] };
    const matchingTags = overlap(tags, profile.tags);
    const matchingTechnologies = overlap(stack, profile.technologies);
    const matchingDomain = profile.domains.includes(repository.domain);
    const reasons = [];
    let score = 0;
    if (matchingTags.length) { score += Math.min(36, matchingTags.length * 18); reasons.push(`Shared tags: ${matchingTags.map((tag) => `#${tag}`).join(", ")}.`); }
    if (matchingTechnologies.length) { score += Math.min(24, matchingTechnologies.length * 12); reasons.push(`Compatible stack: ${matchingTechnologies.join(", ")}.`); }
    if (matchingDomain) { score += 22; reasons.push(`Matches the ${repository.domain} domain.`); }
    if (repository.size <= 25) { score += 8; reasons.push("Small repository is easier to retain as a subproject."); }
    if (["Archived", "Complete"].includes(repository.status)) { score += 6; reasons.push("Lifecycle allows consolidation with low operational risk."); }
    if (target.kind === "archive") {
      score = 0;
      reasons.length = 0;
      if (repository.status === "Archived") { score += 58; reasons.push("Repository lifecycle is already archived."); }
      if (repository.status === "Complete") { score += 46; reasons.push("The project is complete and can move into the shared archive."); }
      if (matchingTags.length) { score += Math.min(24, matchingTags.length * 12); reasons.push(`Archive signals: ${matchingTags.map((tag) => `#${tag}`).join(", ")}.`); }
      if (repository.size <= 25) { score += 8; reasons.push("Its compact size makes an archive import easier to review."); }
    }
    return { target, score: Math.min(score, 100), reasons };
  }).sort((left, right) => right.score - left.score);

  const best = candidates[0];
  const scoredCriteria = best ? [...criteria, `Strongest target match: ${best.target.name ?? best.target.id} scored ${best.score}/100; threshold is ${rules.mergeThreshold}.`] : criteria;
  if (best && best.score >= rules.mergeThreshold) {
    const archive = best.target.kind === "archive";
    return { action: archive ? "archive" : "merge", confidence: best.score, target: best.target.id, reasons: best.reasons, concerns: [archive ? "Import into the archive monorepo and preserve the original until verification." : "Verify path conflicts, CI, licenses, and release cadence before migration."], hardStops: [], criteria: scoredCriteria };
  }
  if (["Archived", "Complete"].includes(repository.status)) {
    const archiveTarget = targets.find((target) => target.kind === "archive");
    return { action: "archive", confidence: 72, target: archiveTarget?.id ?? null, reasons: ["The repository is completed or archived and has no stronger thematic monorepo match."], concerns: ["Import into the archive monorepo and preserve the original until verification."], hardStops: [], criteria: scoredCriteria };
  }
  const bestScore = best?.score ?? 0;
  const confidence = Math.round(50 + (Math.max(0, rules.mergeThreshold - bestScore) / Math.max(1, rules.mergeThreshold)) * 50);
  return { action: "keep", confidence, target: null, reasons: ["No target reaches the configured compatibility threshold.", best ? `The strongest candidate scored ${best.score}/100, below the ${rules.mergeThreshold} threshold.` : "No target profiles were available for comparison."], concerns: ["A separate deployment, roadmap, or missing context may justify keeping it independent."], hardStops: [], criteria: scoredCriteria };
}
