import path from "node:path";
import { promisify } from "node:util";
import { execFile } from "node:child_process";

const executeFile = promisify(execFile);

export function configuredLocalPaths(value) {
  if (!value) return [];
  return [...new Set(value.split(",").map((item) => item.trim()).filter((item) => path.isAbsolute(item)))];
}

export function safeRemoteUrl(value) {
  if (!value) return null;
  const scpLike = value.match(/^[^@\s]+@([^:\s]+):(.+)$/);
  if (scpLike) return `https://${scpLike[1]}/${scpLike[2]}`;
  try {
    const url = new URL(value);
    url.username = "";
    url.password = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return value.includes("@") ? value.slice(value.indexOf("@") + 1) : value;
  }
}

async function git(repositoryPath, args, execute = executeFile) {
  const { stdout } = await execute("git", ["-C", repositoryPath, ...args], { timeout: 5_000, maxBuffer: 64 * 1024 });
  return stdout.trim();
}

export async function inspectLocalRepository(repositoryPath, execute = executeFile) {
  const [headSha, branch, updated, remote] = await Promise.all([
    git(repositoryPath, ["rev-parse", "HEAD"], execute),
    git(repositoryPath, ["symbolic-ref", "--short", "HEAD"], execute).catch(() => "HEAD"),
    git(repositoryPath, ["log", "-1", "--format=%cI"], execute),
    git(repositoryPath, ["config", "--get", "remote.origin.url"], execute).catch(() => "")
  ]);
  const name = path.basename(repositoryPath);
  return { id: `local/${name}`, fullName: `local/${name}`, url: safeRemoteUrl(remote), domain: "Unclassified", status: "Active", language: "Unknown", updated: updated.slice(0, 10), size: 0, score: 50, description: "Local Git repository.", tags: [], technologies: [], decision: "keep", target: null, history: "full", provider: "local", visibility: "local", archived: false, defaultBranch: branch, headSha, fork: false, license: null };
}

export async function fetchLocalRepositories(paths, execute = executeFile) {
  const results = await Promise.allSettled(paths.map((repositoryPath) => inspectLocalRepository(repositoryPath, execute)));
  return results.flatMap((result) => result.status === "fulfilled" ? [result.value] : []);
}
