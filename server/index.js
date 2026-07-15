import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { configuredOwners, fetchOwnedRepositories } from "./github.js";
import { configuredLocalPaths, fetchLocalRepositories } from "./localGit.js";
import { fetchGitLabProjects, gitlabBaseUrl } from "./gitlab.js";
import { logger } from "./logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT ?? 8080);

app.disable("x-powered-by");
app.use(express.json({ limit: "32kb" }));
app.use((request, response, next) => {
  const startedAt = process.hrtime.bigint();
  response.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    logger.info("http_request_completed", {
      method: request.method,
      path: request.path,
      status: response.statusCode,
      durationMs: Number(durationMs.toFixed(1))
    });
  });
  next();
});

app.get("/api/health", (_request, response) => {
  response.json({ ok: true, githubConfigured: Boolean(process.env.GITHUB_TOKEN), owners: configuredOwners(process.env.GITHUB_OWNERS) });
});

app.get("/api/github/owners", (_request, response) => response.json({ owners: configuredOwners(process.env.GITHUB_OWNERS) }));

app.get("/api/local/repositories", async (_request, response) => {
  const paths = configuredLocalPaths(process.env.LOCAL_GIT_PATHS);
  if (!paths.length) return response.status(503).json({ error: "Local Git importer is not configured. Set LOCAL_GIT_PATHS on the server." });
  try {
    logger.info("local_git_import_started", { repositoryCount: paths.length });
    const repositories = await fetchLocalRepositories(paths);
    logger.info("local_git_import_completed", { repositoryCount: repositories.length });
    return response.json({ repositories, importedAt: new Date().toISOString() });
  } catch (error) {
    logger.error("local_git_import_failed", { message: error.message });
    return response.status(502).json({ error: "Local Git import failed. Check configured paths and container mounts." });
  }
});

app.get("/api/gitlab/repositories", async (_request, response) => {
  const token = process.env.GITLAB_TOKEN;
  if (!token) return response.status(503).json({ error: "GitLab importer is not configured. Set GITLAB_TOKEN on the server." });
  try {
    logger.info("gitlab_import_started", { baseUrl: gitlabBaseUrl(process.env.GITLAB_URL) });
    const repositories = await fetchGitLabProjects({ token, baseUrl: process.env.GITLAB_URL });
    logger.info("gitlab_import_completed", { repositoryCount: repositories.length });
    return response.json({ repositories, importedAt: new Date().toISOString() });
  } catch (error) {
    logger.error("gitlab_import_failed", { gitlabStatus: error.status ?? null, message: error.message });
    return response.status(502).json({ error: "GitLab import failed. Check the server token and URL." });
  }
});

app.get("/api/github/repositories", async (request, response) => {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    logger.warn("github_import_rejected", { reason: "github_token_missing" });
    response.status(503).json({ error: "GitHub importer is not configured. Set GITHUB_TOKEN on the server." });
    return;
  }

  const owner = typeof request.query.owner === "string" ? request.query.owner.trim() : "";
  if (owner.length > 39 || !/^[A-Za-z0-9-]*$/.test(owner)) {
    logger.warn("github_import_rejected", { owner, reason: "invalid_owner" });
    response.status(400).json({ error: "Owner must be a valid GitHub login." });
    return;
  }
  const allowedOwners = configuredOwners(process.env.GITHUB_OWNERS);
  if (allowedOwners.length && (!owner || !allowedOwners.some((allowed) => allowed.toLowerCase() === owner.toLowerCase()))) {
    logger.warn("github_import_rejected", { owner, reason: "owner_not_allowed" });
    response.status(400).json({ error: "Choose an owner configured on this server." });
    return;
  }

  try {
    const startedAt = process.hrtime.bigint();
    logger.info("github_import_started", { owner: owner || "all_owned_repositories" });
    const repositories = await fetchOwnedRepositories({ token, owner });
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    logger.info("github_import_completed", { owner: owner || "all_owned_repositories", repositoryCount: repositories.length, durationMs: Number(durationMs.toFixed(1)) });
    response.json({ repositories, importedAt: new Date().toISOString() });
  } catch (error) {
    logger.error("github_import_failed", { owner: owner || "all_owned_repositories", githubStatus: error.status ?? null, message: error.message });
    response.status(502).json({ error: "GitHub import failed. Check the server token scope and try again." });
  }
});

app.use(express.static(path.join(__dirname, "..", "dist"), { index: "index.html" }));
app.get("/{*path}", (_request, response) => response.sendFile(path.join(__dirname, "..", "dist", "index.html")));

const server = app.listen(port, "0.0.0.0", () => {
  logger.info("server_started", { port, githubConfigured: Boolean(process.env.GITHUB_TOKEN), owners: configuredOwners(process.env.GITHUB_OWNERS) });
});

server.on("error", (error) => logger.error("server_error", { message: error.message, code: error.code ?? null }));
process.on("unhandledRejection", (reason) => logger.error("unhandled_rejection", { message: reason instanceof Error ? reason.message : String(reason) }));
process.on("uncaughtException", (error) => {
  logger.error("uncaught_exception", { message: error.message });
  process.exit(1);
});
