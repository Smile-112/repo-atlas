export const DEFAULT_RULES = {
  mergeThreshold: 60,
  hardStopTags: ["client", "fork", "keep-separate"]
};

const targetProfiles = {
  "minecraft-addons": { tags: ["minecraft", "forge", "fabric", "steamcraft"], technologies: ["Java", "Kotlin"], domains: ["Minecraft"] },
  "personal-lab": { tags: ["bot", "automation", "utility", "experiment"], technologies: ["Python", "JavaScript", "TypeScript"], domains: ["Automation"] },
  "learning-archive": { tags: ["learning", "django", "practicum"], technologies: ["Python"], domains: ["Learning"] }
};

function overlap(left, right) {
  const values = new Set(right.map((item) => item.toLowerCase()));
  return left.filter((item) => values.has(item.toLowerCase()));
}

export function analyseRepository(repository, targets, rules = DEFAULT_RULES) {
  const tags = repository.tags ?? [];
  const hardStops = [
    ...(repository.fork ? ["Repository is a fork and may need upstream updates."] : []),
    ...tags.filter((tag) => rules.hardStopTags.includes(tag)).map((tag) => `The #${tag} tag prevents automatic merge recommendations.`)
  ];
  if (hardStops.length) return { action: "keep", confidence: 100, target: null, reasons: ["A hard stop-factor protects this repository from merge recommendations."], concerns: hardStops, hardStops };

  const candidates = targets.map((target) => {
    const profile = targetProfiles[target.id] ?? { tags: [], technologies: [], domains: [] };
    const matchingTags = overlap(tags, profile.tags);
    const matchingTechnologies = overlap(repository.technologies ?? [repository.language].filter(Boolean), profile.technologies);
    const matchingDomain = profile.domains.includes(repository.domain);
    const reasons = [];
    let score = 0;
    if (matchingTags.length) { score += Math.min(36, matchingTags.length * 18); reasons.push(`Shared tags: ${matchingTags.map((tag) => `#${tag}`).join(", ")}.`); }
    if (matchingTechnologies.length) { score += Math.min(24, matchingTechnologies.length * 12); reasons.push(`Compatible stack: ${matchingTechnologies.join(", ")}.`); }
    if (matchingDomain) { score += 22; reasons.push(`Matches the ${repository.domain} domain.`); }
    if (repository.size <= 25) { score += 8; reasons.push("Small repository is easier to retain as a subproject."); }
    if (["Archived", "Complete"].includes(repository.status)) { score += 6; reasons.push("Lifecycle allows consolidation with low operational risk."); }
    return { target, score: Math.min(score, 100), reasons };
  }).sort((left, right) => right.score - left.score);

  const best = candidates[0];
  if (best && best.score >= rules.mergeThreshold) {
    return { action: "merge", confidence: best.score, target: best.target.id, reasons: best.reasons, concerns: ["Verify path conflicts, CI, licenses, and release cadence before migration."], hardStops: [] };
  }
  if (["Archived", "Complete"].includes(repository.status)) {
    return { action: "archive", confidence: 72, target: null, reasons: ["The repository is completed or archived and has no strong monorepo match."], concerns: ["Preserve its URL and Git history; do not delete it."], hardStops: [] };
  }
  return { action: "keep", confidence: best?.score ?? 0, target: null, reasons: ["No target reaches the configured compatibility threshold."], concerns: ["A separate deployment, roadmap, or missing context may justify keeping it independent."], hardStops: [] };
}
