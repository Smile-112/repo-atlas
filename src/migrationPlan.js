function slug(value) {
  return value.split("/").at(-1).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function targetPath(repository, target) {
  const folder = target.id === "minecraft-addons" ? "mods" : "projects";
  return `${folder}/${slug(repository.id)}`;
}

function remoteName(repository) {
  return `repo-atlas-${slug(repository.id)}`;
}

function shellQuote(value) {
  return `'${String(value).replaceAll("'", "'\\\"'\\\"'")}'`;
}

function commandsFor(move, target) {
  if (move.status !== "ready-for-human-review") return [];
  const sourceRemote = remoteName({ id: move.sourceRepository });
  const targetRemote = target.remoteUrl ?? "<target-monorepo-url>";
  const backupBranch = `repo-atlas/before-${slug(move.sourceRepository)}-${move.sourceCommitSha.slice(0, 8)}`;
  const squash = move.historyStrategy === "squash" ? " --squash" : "";
  return [
    `git clone ${shellQuote(targetRemote)} ${shellQuote(move.targetMonorepo)}`,
    `cd ${shellQuote(move.targetMonorepo)}`,
    "git switch main && git pull --ff-only",
    `git branch ${shellQuote(backupBranch)}`,
    `git remote add ${shellQuote(sourceRemote)} ${shellQuote(move.sourceUrl)}`,
    `git fetch ${shellQuote(sourceRemote)} ${shellQuote(move.sourceCommitSha)}`,
    `git subtree add --prefix=${shellQuote(move.destinationPath)} ${shellQuote(sourceRemote)} ${shellQuote(move.sourceCommitSha)}${squash}`,
    `git remote remove ${shellQuote(sourceRemote)}`
  ];
}

export function buildMigrationManifest(repositories, targets, generatedAt = new Date().toISOString()) {
  const targetById = new Map(targets.map((target) => [target.id, target]));
  const moves = [];
  const unresolved = [];

  for (const repository of repositories.filter((item) => item.decision === "merge")) {
    const target = targetById.get(repository.target);
    if (!target) {
      unresolved.push({ repository: repository.id, reason: "A valid target monorepo is required." });
      continue;
    }
    const destinationPath = targetPath(repository, target);
    const ready = Boolean(repository.url && repository.defaultBranch && repository.headSha);
    const move = {
      sourceRepository: repository.id,
      sourceUrl: repository.url ?? null,
      sourceBranch: repository.defaultBranch ?? null,
      sourceCommitSha: repository.headSha ?? null,
      targetMonorepo: target.id,
      destinationPath,
      historyStrategy: repository.history === "squash" ? "squash" : "full",
      status: ready ? "ready-for-human-review" : "needs-source-metadata",
      verification: { preMigration: "pending", postMigration: "pending", originalRepository: "preserve-until-verified" }
    };
    moves.push({ ...move, commands: commandsFor(move, target), rollback: ready ? { safetyBranch: `repo-atlas/before-${slug(repository.id)}-${repository.headSha.slice(0, 8)}`, instruction: "After reviewing the import commit, revert it with `git revert -m 1 <import-merge-commit>`. Do not delete the original repository or the safety branch until verification is complete." } : null });
  }

  return {
    schemaVersion: 1,
    generatedAt,
    safety: { executesGitOperations: false, destructiveOperations: false, humanReviewRequired: true },
    moves,
    archives: repositories.filter((item) => item.decision === "archive").map((item) => ({ repository: item.id, sourceUrl: item.url ?? null, action: "archive-after-verification", originalHistory: "preserve" })),
    unresolved,
    verificationChecklist: ["Confirm source branch and commit SHA.", "Build and test each source repository.", "Review destination-path and license conflicts.", "Create the recorded safety branch before each import.", "Import manually, then verify the target build and history.", "Archive originals only after verification; never delete them from this plan."]
  };
}

export function manifestToMarkdown(manifest) {
  const lines = ["# Repo Atlas migration plan", "", `Generated: ${manifest.generatedAt}`, "", "## Safety", "", "This document is a review plan. It does not execute Git operations or delete repositories.", "", "## Planned imports", ""];
  if (!manifest.moves.length) lines.push("No accepted repository moves.");
  for (const move of manifest.moves) {
    lines.push(`### ${move.sourceRepository} → ${move.targetMonorepo}`, "", `- Destination: \`${move.destinationPath}\``, `- History: **${move.historyStrategy}**`, `- Source branch: ${move.sourceBranch ?? "missing"}`, `- Source SHA: ${move.sourceCommitSha ?? "missing — re-import before execution"}`, `- Status: ${move.status}`);
    if (move.commands.length) lines.push("", "```bash", ...move.commands, "```");
    if (move.rollback) lines.push("", `Rollback: ${move.rollback.instruction}`);
    lines.push("");
  }
  lines.push("## Archive decisions", "");
  lines.push(...(manifest.archives.length ? manifest.archives.map((item) => `- ${item.repository}: preserve history; archive only after verification.`) : ["No archive decisions."]));
  if (manifest.unresolved.length) lines.push("", "## Blocking gaps", "", ...manifest.unresolved.map((item) => `- ${item.repository}: ${item.reason}`));
  lines.push("", "## Verification checklist", "", ...manifest.verificationChecklist.map((item) => `- [ ] ${item}`));
  return lines.join("\n");
}
