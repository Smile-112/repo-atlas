import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchOwnedRepositories } from "./github.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT ?? 8080);

app.disable("x-powered-by");
app.use(express.json({ limit: "32kb" }));

app.get("/api/health", (_request, response) => {
  response.json({ ok: true, githubConfigured: Boolean(process.env.GITHUB_TOKEN) });
});

app.get("/api/github/repositories", async (request, response) => {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    response.status(503).json({ error: "GitHub importer is not configured. Set GITHUB_TOKEN on the server." });
    return;
  }

  const owner = typeof request.query.owner === "string" ? request.query.owner.trim() : "";
  if (owner.length > 39 || !/^[A-Za-z0-9-]*$/.test(owner)) {
    response.status(400).json({ error: "Owner must be a valid GitHub login." });
    return;
  }

  try {
    const repositories = await fetchOwnedRepositories({ token, owner });
    response.json({ repositories, importedAt: new Date().toISOString() });
  } catch (error) {
    const status = error.status === 401 || error.status === 403 ? 502 : 502;
    response.status(status).json({ error: "GitHub import failed. Check the server token scope and try again." });
  }
});

app.use(express.static(path.join(__dirname, "..", "dist"), { index: "index.html" }));
app.get("/{*path}", (_request, response) => response.sendFile(path.join(__dirname, "..", "dist", "index.html")));

app.listen(port, "0.0.0.0", () => console.log(`Repo Atlas listening on port ${port}`));
