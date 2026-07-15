import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import { clearWorkspace, loadWorkspace, parseWorkspace, saveWorkspace, serializeWorkspace } from "./workspaceStorage";
import { analyseRepository, DEFAULT_RULES } from "./analysis";
import { compareScenario } from "./compare";
import { buildMigrationManifest, manifestToMarkdown } from "./migrationPlan";
import { messages, translate } from "./i18n";
import { mergeImportedRepositories } from "./importWorkspace";
import { CompareView, Filter, Metric, ProposedMap, RepositoryCard, RepositoryDetail, ScenarioToolbar } from "./components/AtlasViews";
import { useScenarioHistory } from "./useScenarioHistory";
import { requestJson } from "./apiClient";

const initialTargets = [
  { id: "minecraft-addons", name: "minecraft-addons", description: "Mods, plugins and server tooling", strategy: "Full Git history", pathPrefix: "mods", defaultBranch: "main", remoteUrl: "" },
  { id: "personal-lab", name: "personal-lab", description: "Small utilities and experiments", strategy: "Squashed imports", pathPrefix: "projects", defaultBranch: "main", remoteUrl: "" },
  { id: "learning-archive", name: "learning-archive", description: "Finished learning projects", strategy: "Squashed imports", pathPrefix: "projects", defaultBranch: "main", remoteUrl: "" },
  { id: "archive", name: "Archive monorepo", description: "Completed and inactive projects preserved in one monorepo", strategy: "Full Git history", pathPrefix: "repositories", defaultBranch: "main", remoteUrl: "", kind: "archive" }
];

const initialRepositories = [
  { id: "minecraft_addons", domain: "Minecraft", status: "Active", language: "Java", updated: "2026-07-11", size: 84, score: 91, decision: "keep", description: "Mods, plugins and shared server tooling.", tags: ["minecraft", "steamcraft"], target: null, history: "full" },
  { id: "MM_Forge_mod", domain: "Minecraft", status: "Archived", language: "Java", updated: "2025-09-20", size: 18, score: 63, decision: "merge", description: "Forge chat-formatting mod.", tags: ["minecraft", "forge"], target: "minecraft-addons", history: "full" },
  { id: "tg_minecraft_bridge_forge", domain: "Minecraft", status: "Active", language: "Java", updated: "2025-10-02", size: 22, score: 76, decision: "merge", description: "Telegram to Minecraft bridge.", tags: ["minecraft", "forge", "telegram"], target: "minecraft-addons", history: "full" },
  { id: "whisper_bot", domain: "Automation", status: "Active", language: "Python", updated: "2026-06-28", size: 36, score: 86, decision: "keep", description: "Independent bot service and deployment.", tags: ["bot", "service"], target: null, history: "full" },
  { id: "VTI_System", domain: "Industrial", status: "Maintenance", language: "Python", updated: "2025-06-19", size: 41, score: 74, decision: "keep", description: "Rotating-equipment diagnostics.", tags: ["industrial", "portfolio"], target: null, history: "full" },
  { id: "Recommendation_system", domain: "Portfolio", status: "Complete", language: "Go", updated: "2025-04-17", size: 13, score: 81, decision: "keep", description: "Standalone public recommendation project.", tags: ["portfolio", "public"], target: null, history: "full" },
  { id: "new_site_for_kerosinka", domain: "Web", status: "Active", language: "TypeScript", updated: "2026-05-21", size: 57, score: 79, decision: "keep", description: "Client website with own deployment.", tags: ["client", "web"], target: null, history: "full" },
  { id: "django-sprint4", domain: "Learning", status: "Complete", language: "Python", updated: "2024-11-12", size: 9, score: 58, decision: "archive", description: "Completed learning project.", tags: ["learning", "django"], target: "archive", history: "full" },
  { id: "homework-bot", domain: "Automation", status: "Archived", language: "Python", updated: "2024-07-01", size: 4, score: 48, decision: "merge", description: "Small utility bot.", tags: ["bot", "learning"], target: "personal-lab", history: "squash" }
];

const actions = ["all", "keep", "merge", "archive"];
const themes = new Set(["atlas", "claude", "elevenlabs", "ollama"]);
const languages = new Set(["en", "ru"]);

function loadPreference(key, allowed, fallback) {
  try {
    const value = window.localStorage.getItem(key);
    return allowed.has(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

function buildPrompt(repositories, targets) {
  const moves = repositories.filter((repo) => repo.decision === "merge");
  const archives = repositories.filter((repo) => repo.decision === "archive");
  const targetLines = targets.map((target) => {
    const members = [...moves, ...archives].filter((repo) => repo.target === target.id);
    return members.length ? `- ${target.name} (${target.kind === "archive" ? "archive" : "consolidation"}, ${target.strategy}): ${members.map((repo) => repo.id).join(", ")}` : null;
  }).filter(Boolean).join("\n");
  return `You are a senior Git engineer. Review this repository consolidation plan.\n\nGoal\nKeep independent products separate; group related small projects into thematic monorepositories and consolidate completed projects in one archive monorepo.\n\nProposed monorepos\n${targetLines || "- None"}\n\nArchive imports\n${archives.map((repo) => `- ${repo.id} → ${targets.find((target) => target.id === repo.target)?.name ?? "Archive"}`).join("\n") || "- None"}\n\nConstraints\n- Do not propose destructive commands without a safer alternative.\n- ${[...moves, ...archives].some((repo) => repo.history === "full") ? "Preserve full Git history for items marked Full Git history." : "Use a documented import strategy."}\n- Original repositories are archived only after build and history verification.\n- Treat this as a review; do not execute changes.\n\nInspect likely path conflicts, CI implications, licensing, forks/upstreams, and rollback gaps. Ask concise questions where data is missing.`;
}

function App() {
  const [workspace] = useState(() => loadWorkspace(initialRepositories, initialTargets));
  const scenarioHistory = useScenarioHistory({ repositories: workspace.repositories, targets: workspace.targets, scenarioName: workspace.scenarioName, savedViews: workspace.savedViews });
  const { repositories, targets, scenarioName, savedViews } = scenarioHistory.scenario;
  const setRepositories = scenarioHistory.updateRepositories;
  const setTargets = scenarioHistory.updateTargets;
  const [selectedId, setSelectedId] = useState(workspace.repositories[0]?.id ?? initialRepositories[0].id);
  const [selectedIds, setSelectedIds] = useState([]);
  const [mode, setMode] = useState("current");
  const [domain, setDomain] = useState("all");
  const [decision, setDecision] = useState("all");
  const [query, setQuery] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [prompt, setPrompt] = useState("");
  const [githubOwner, setGithubOwner] = useState("");
  const [githubOwners, setGithubOwners] = useState([]);
  const [importState, setImportState] = useState("");
  const [importBusy, setImportBusy] = useState("");
  const [lastImport, setLastImport] = useState(null);
  const [sortBy, setSortBy] = useState("updated-desc");
  const [savedViewName, setSavedViewName] = useState("");
  const [activeSavedView, setActiveSavedView] = useState("");
  const [toast, setToast] = useState(null);
  const [saveState, setSaveState] = useState(workspace.source === "local" ? "Restored from this browser" : "Demo workspace");
  const [rules, setRules] = useState(DEFAULT_RULES);
  const [theme, setTheme] = useState(() => loadPreference("repo-atlas.theme", themes, "atlas"));
  const [language, setLanguage] = useState(() => loadPreference("repo-atlas.language", languages, "en"));
  const t = messages[language];
  const tr = (value) => translate(language, value);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { window.localStorage.setItem("repo-atlas.theme", theme); } catch { /* The UI still works when storage is unavailable. */ }
  }, [theme]);
  useEffect(() => {
    document.documentElement.lang = language;
    try { window.localStorage.setItem("repo-atlas.language", language); } catch { /* The UI still works when storage is unavailable. */ }
  }, [language]);

  useEffect(() => {
    try {
      saveWorkspace(scenarioHistory.scenario);
      setSaveState("Saved in this browser");
    } catch {
      setSaveState("Could not save locally");
    }
  }, [scenarioHistory.scenario]);

  useEffect(() => {
    fetch("/api/github/owners")
      .then((response) => response.ok ? response.json() : { owners: [] })
      .then(({ owners }) => {
        if (Array.isArray(owners) && owners.length) {
          setGithubOwners(owners);
          setGithubOwner((current) => current || owners[0]);
        }
      })
      .catch(() => setGithubOwners([]));
  }, []);

  const selected = repositories.find((repo) => repo.id === selectedId) ?? repositories[0];
  const domains = ["all", ...new Set(repositories.map((repo) => repo.domain))];
  const filtered = useMemo(() => {
    const matches = repositories.filter((repo) =>
      (domain === "all" || repo.domain === domain) &&
      (decision === "all" || repo.decision === decision) &&
      `${repo.id} ${repo.description} ${repo.language} ${repo.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase())
    );
    const sorters = {
      "updated-desc": (a, b) => String(b.updated).localeCompare(String(a.updated)),
      "score-desc": (a, b) => b.score - a.score,
      "size-desc": (a, b) => b.size - a.size,
      "name-asc": (a, b) => a.id.localeCompare(b.id),
      "language-asc": (a, b) => a.language.localeCompare(b.language) || a.id.localeCompare(b.id)
    };
    return [...matches].sort(sorters[sortBy] ?? sorters["updated-desc"]);
  }, [repositories, domain, decision, query, sortBy]);
  const mergeCount = repositories.filter((repo) => repo.decision === "merge").length;
  const activeCount = repositories.filter((repo) => repo.status === "Active").length;
  const analysis = analyseRepository(selected, targets, rules);
  const comparison = compareScenario(repositories, targets, rules);
  const migrationManifest = useMemo(() => buildMigrationManifest(repositories, targets), [repositories, targets]);

  function download(filename, contents, type) {
    const url = URL.createObjectURL(new Blob([contents], { type }));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  function updateSelected(patch) {
    setRepositories((items) => items.map((repo) => repo.id === selected.id ? { ...repo, ...patch } : repo));
  }
  function notify(message, undoable = false) {
    setToast({ message, undoable });
  }
  function undoScenario() {
    scenarioHistory.undo();
    setToast(null);
  }
  function redoScenario() {
    scenarioHistory.redo();
    setToast(null);
  }
  function addTag(event) {
    event.preventDefault();
    const tag = tagInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (tag && !selected.tags.includes(tag)) updateSelected({ tags: [...selected.tags, tag] });
    setTagInput("");
  }
  function removeTag(tag) { updateSelected({ tags: selected.tags.filter((item) => item !== tag) }); }
  function moveRepository(repoId, destination) {
    setRepositories((items) => items.map((repo) => {
      if (repo.id !== repoId) return repo;
      if (destination === "keep") return { ...repo, decision: "keep", target: null };
      const target = targets.find((item) => item.id === destination);
      if (target?.kind === "archive" || destination === "archive") return { ...repo, decision: "archive", target: target?.id ?? targets.find((item) => item.kind === "archive")?.id ?? null, history: "full" };
      return { ...repo, decision: "merge", target: destination };
    }));
    notify(`${repoId} moved.`, true);
  }
  function toggleRepository(repoId) {
    setSelectedIds((items) => items.includes(repoId) ? items.filter((id) => id !== repoId) : [...items, repoId]);
  }
  function applyBulkDecision(nextDecision, target = null) {
    if (!selectedIds.length) return;
    const archiveTarget = targets.find((item) => item.kind === "archive")?.id ?? null;
    setRepositories((items) => items.map((repo) => selectedIds.includes(repo.id) ? { ...repo, decision: nextDecision, target: nextDecision === "merge" ? target ?? targets.find((item) => item.kind !== "archive")?.id ?? null : nextDecision === "archive" ? archiveTarget : null, history: nextDecision === "archive" ? "full" : repo.history } : repo));
    notify(`${selectedIds.length} repositories updated.`, true);
    setSelectedIds([]);
  }
  function addTarget() {
    const base = "new-group";
    let id = base;
    let index = 2;
    while (targets.some((target) => target.id === id)) id = `${base}-${index++}`;
    setTargets((items) => [...items, { id, name: id, description: "", strategy: "Full Git history", pathPrefix: "projects", defaultBranch: "main", remoteUrl: "" }]);
    notify("Target group added.", true);
  }
  function updateTarget(targetId, patch) {
    setTargets((items) => items.map((target) => target.id === targetId ? { ...target, ...patch } : target));
  }
  function deleteTarget(targetId) {
    if (targets.find((target) => target.id === targetId)?.kind === "archive") return;
    if (targets.length <= 1) return;
    scenarioHistory.updateScenario((current) => ({
      ...current,
      targets: current.targets.filter((target) => target.id !== targetId),
      repositories: current.repositories.map((repo) => repo.target === targetId ? { ...repo, decision: "keep", target: null } : repo),
    }));
    notify("Target group deleted; its repositories were kept separate.", true);
  }
  function exportWorkspace() {
    download("repo-atlas-workspace.json", serializeWorkspace(scenarioHistory.scenario), "application/json");
  }
  async function importWorkspaceFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const imported = parseWorkspace(JSON.parse(await file.text()), initialRepositories, initialTargets);
      scenarioHistory.replaceScenario({ repositories: imported.repositories, targets: imported.targets, scenarioName: imported.scenarioName, savedViews: imported.savedViews });
      setSelectedId(imported.repositories[0]?.id ?? initialRepositories[0].id);
      setSelectedIds([]);
      notify("Workspace imported.", true);
    } catch {
      notify("Workspace file is invalid.");
    }
  }
  function saveCurrentView() {
    const name = savedViewName.trim();
    if (!name) return;
    scenarioHistory.updateScenario((current) => ({ ...current, savedViews: [...current.savedViews.filter((view) => view.name !== name), { name, domain, decision, query, sortBy }].slice(-20) }));
    setActiveSavedView(name);
    setSavedViewName("");
    notify("View saved.", true);
  }
  function applySavedView(view) {
    setDomain(view.domain ?? "all"); setDecision(view.decision ?? "all"); setQuery(view.query ?? ""); setSortBy(view.sortBy ?? "updated-desc");
  }
  function deleteSavedView() {
    if (!activeSavedView) return;
    scenarioHistory.updateScenario((current) => ({ ...current, savedViews: current.savedViews.filter((view) => view.name !== activeSavedView) }));
    setActiveSavedView("");
    notify("Saved view deleted.", true);
  }
  function makePrompt() {
    setPrompt(buildPrompt(repositories, targets));
  }
  async function copyPrompt() {
    const value = prompt || buildPrompt(repositories, targets);
    if (!prompt) setPrompt(value);
    if (navigator.clipboard) await navigator.clipboard.writeText(value);
  }
  function resetWorkspace() {
    clearWorkspace();
    scenarioHistory.replaceScenario({ repositories: initialRepositories, targets: initialTargets, scenarioName: "Consolidation 2026", savedViews: [] });
    setSelectedId(initialRepositories[1].id);
    setSelectedIds([]);
    setDomain("all");
    setDecision("all");
    setQuery("");
    setImportState("");
    setPrompt("");
    setSaveState("Demo workspace restored");
    notify("Demo workspace restored.", true);
  }
  async function importGitHub() {
    if (importBusy) return;
    setImportBusy("github");
    setLastImport("github");
    setImportState("Importing repositories…");
    try {
      const owner = githubOwner.trim();
      const payload = await requestJson(`/api/github/repositories?owner=${encodeURIComponent(owner)}`);
      if (!payload.repositories.length) throw new Error("GitHub returned no repositories for this owner.");
      setRepositories((current) => mergeImportedRepositories(current, payload.repositories));
      setSelectedId(payload.repositories[0]?.id ?? initialRepositories[0].id);
      setImportState(`Imported ${payload.repositories.length} repositories.`);
    } catch (error) {
      setImportState(error.message);
    } finally {
      setImportBusy("");
    }
  }
  async function importLocalGit() {
    if (importBusy) return;
    setImportBusy("local");
    setLastImport("local");
    setImportState("Inspecting configured local repositories…");
    try {
      const payload = await requestJson("/api/local/repositories");
      if (!payload.repositories.length) throw new Error("No readable local Git repositories were found.");
      setRepositories((current) => mergeImportedRepositories(current, payload.repositories));
      setSelectedId(payload.repositories[0]?.id ?? initialRepositories[0].id);
      setImportState(`Imported ${payload.repositories.length} local repositories.`);
    } catch (error) {
      setImportState(error.message);
    } finally {
      setImportBusy("");
    }
  }
  async function importGitLab() {
    if (importBusy) return;
    setImportBusy("gitlab");
    setLastImport("gitlab");
    setImportState("Importing GitLab repositories…");
    try {
      const payload = await requestJson("/api/gitlab/repositories");
      if (!payload.repositories.length) throw new Error("GitLab returned no accessible repositories.");
      setRepositories((current) => mergeImportedRepositories(current, payload.repositories));
      setSelectedId(payload.repositories[0]?.id ?? initialRepositories[0].id);
      setImportState(`Imported ${payload.repositories.length} GitLab repositories.`);
    } catch (error) {
      setImportState(error.message);
    } finally {
      setImportBusy("");
    }
  }
  function retryLastImport() {
    if (lastImport === "github") importGitHub();
    if (lastImport === "gitlab") importGitLab();
    if (lastImport === "local") importLocalGit();
  }

  return <><a className="skip-link" href="#catalog">{tr("Skip to repository catalog")}</a><main>
    <header className="hero">
      <div><p className="eyebrow">{tr("Repository intelligence, locally owned")}</p><h1>Repo Atlas</h1><p className="lede">{tr("Explore today’s repositories, model a safer tomorrow, then export a reviewable migration plan.")}</p></div>
      <div className="hero-controls"><div className="mode-switch" aria-label="Atlas mode"><button aria-pressed={mode === "current"} className={mode === "current" ? "active" : ""} onClick={() => setMode("current")}>{t.current}</button><button aria-pressed={mode === "proposed"} className={mode === "proposed" ? "active" : ""} onClick={() => setMode("proposed")}>{t.proposed}</button><button aria-pressed={mode === "compare"} className={mode === "compare" ? "active" : ""} onClick={() => setMode("compare")}>{t.compare}</button></div><label className="appearance">{t.theme}<select value={theme} onChange={(event) => setTheme(event.target.value)}><option value="atlas">Atlas</option><option value="claude">Claude</option><option value="elevenlabs">ElevenLabs</option><option value="ollama">Ollama</option></select></label><label className="appearance">{t.language}<select value={language} onChange={(event) => setLanguage(event.target.value)}><option value="en">English</option><option value="ru">Русский</option></select></label><span className="workspace-status">● {tr(saveState)}</span><button className="reset" onClick={resetWorkspace}>{t.reset}</button></div>
    </header>

    <section className="metrics" aria-label={tr("Portfolio summary")}><Metric label={tr("Repositories")} value={repositories.length} hint={tr("In this workspace")} /><Metric label={tr("Active")} value={activeCount} hint={tr("Updated or maintained")} /><Metric label={tr("Planned moves")} value={mergeCount} hint={tr("Reversible scenario decisions")} tone="accent" /><Metric label={tr("Target monorepos")} value={targets.length} hint={tr("Visible in proposed map")} tone="blue" /></section>

    <ScenarioToolbar scenarioName={scenarioName} onScenarioName={(value) => scenarioHistory.updateScenario((current) => ({ ...current, scenarioName: value }))} canUndo={scenarioHistory.canUndo} canRedo={scenarioHistory.canRedo} onUndo={undoScenario} onRedo={redoScenario} onExport={exportWorkspace} onImport={importWorkspaceFile} targets={targets} onAddTarget={addTarget} onUpdateTarget={updateTarget} onDeleteTarget={deleteTarget} tr={tr} />

    {mode === "current" ? <section className="workspace" id="catalog">
      <aside className="filters">
        <div><p className="eyebrow">{tr("Workspace")}</p><h2>{tr("Current portfolio")}</h2></div>
        <label>{tr("Search")}<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={tr("Repository, tag, stack")} /></label>
        <Filter label={tr("Domain")} value={domain} onChange={setDomain} values={domains} tr={tr} />
        <Filter label={tr("Decision")} value={decision} onChange={setDecision} values={actions} tr={tr} />
        <details className="control-section"><summary>{tr("Data sources")}</summary><div className="control-section-body">
          <div className="importer"><strong>{tr("Import GitHub")}</strong><p>{tr("One selected owner is displayed at a time.")}</p>{githubOwners.length ? <label>{tr("Repository owner")}<select value={githubOwner} onChange={(event) => setGithubOwner(event.target.value)}>{githubOwners.map((owner) => <option key={owner} value={owner}>{owner}</option>)}</select></label> : <input value={githubOwner} onChange={(event) => setGithubOwner(event.target.value)} placeholder={tr("Owner, e.g. Smile-112")} />}<button type="button" disabled={Boolean(importBusy)} onClick={importGitHub}>{importBusy === "github" ? tr("Importing…") : tr("Import repositories")}</button></div>
          <div className="importer"><strong>{tr("Import GitLab")}</strong><p>{tr("Uses the server-side read-only API token.")}</p><button type="button" disabled={Boolean(importBusy)} onClick={importGitLab}>{importBusy === "gitlab" ? tr("Importing…") : tr("Import GitLab repositories")}</button></div>
          <div className="importer"><strong>{tr("Import local Git")}</strong><p>{tr("Reads only explicitly configured, read-only container mounts.")}</p><button type="button" disabled={Boolean(importBusy)} onClick={importLocalGit}>{importBusy === "local" ? tr("Importing…") : tr("Import local repositories")}</button></div>
          {importState && <div className="import-status" role="status"><span>{importBusy && <i className="spinner" aria-hidden="true" />} {tr(importState)}</span>{!importBusy && lastImport && <button type="button" onClick={retryLastImport}>{tr("Retry")}</button>}</div>}
        </div></details>
        <details className="rule-editor"><summary>{tr("Recommendation rules")}</summary><label>{tr("Merge threshold")} <output>{rules.mergeThreshold}%</output><input type="range" min="40" max="90" value={rules.mergeThreshold} onChange={(event) => setRules({ ...rules, mergeThreshold: Number(event.target.value) })} /></label><small>{tr("Hard stops:")} {rules.hardStopTags.map((tag) => `#${tag}`).join(", ")}</small></details>
        <div className="principle"><strong>{tr("Safe by design")}</strong><p>{tr("Decisions are stored as a scenario. They do not modify GitHub.")}</p></div>
      </aside>
      <div className="content"><div className="section-title"><div><p className="eyebrow">{tr("Repository catalog")}</p><h2>{tr(`${filtered.length} repositories in view`)}</h2></div><span>{scenarioName}</span></div><div className="catalog-toolbar"><label>{tr("Sort by")}<select value={sortBy} onChange={(event) => setSortBy(event.target.value)}><option value="updated-desc">{tr("Recently updated")}</option><option value="score-desc">{tr("Highest health score")}</option><option value="size-desc">{tr("Largest first")}</option><option value="name-asc">{tr("Name A–Z")}</option><option value="language-asc">{tr("Language")}</option></select></label><button type="button" onClick={() => setSelectedIds(filtered.map((repo) => repo.id))}>{tr("Select visible")}</button><button type="button" onClick={() => setSelectedIds([])} disabled={!selectedIds.length}>{tr("Clear selection")}</button><details className="saved-view-tools"><summary>{tr("Saved views")}{savedViews.length ? ` (${savedViews.length})` : ""}</summary><div><label>{tr("Saved view name")}<input value={savedViewName} maxLength="48" onChange={(event) => setSavedViewName(event.target.value)} /></label><button type="button" disabled={!savedViewName.trim()} onClick={saveCurrentView}>{tr("Save view")}</button>{savedViews.length > 0 && <><label>{tr("Saved views")}<select value={activeSavedView} onChange={(event) => { setActiveSavedView(event.target.value); const view = savedViews.find((item) => item.name === event.target.value); if (view) applySavedView(view); }}><option value="">—</option>{savedViews.map((view) => <option key={view.name} value={view.name}>{view.name}</option>)}</select></label><button type="button" disabled={!activeSavedView} onClick={deleteSavedView}>{tr("Delete view")}</button></>}</div></details></div>{selectedIds.length > 0 && <div className="bulk-actions" role="toolbar" aria-label={tr("Bulk actions")}><strong>{selectedIds.length} {tr("selected")}</strong><button type="button" onClick={() => applyBulkDecision("keep")}>{tr("Keep separate")}</button><button type="button" onClick={() => applyBulkDecision("archive")}>{tr("Archive")}</button>{targets.some((target) => target.kind !== "archive") && <label>{tr("Move to")}<select value="" onChange={(event) => event.target.value && applyBulkDecision("merge", event.target.value)}><option value="">—</option>{targets.filter((target) => target.kind !== "archive").map((target) => <option key={target.id} value={target.id}>{target.name}</option>)}</select></label>}</div>}<div className="repo-grid">{filtered.map((repo) => <RepositoryCard key={repo.id} repo={repo} selected={selected.id === repo.id} checked={selectedIds.includes(repo.id)} onToggle={toggleRepository} onClick={() => setSelectedId(repo.id)} tr={tr} />)}</div></div>
      <RepositoryDetail repo={selected} targets={targets} analysis={analysis} onUpdate={updateSelected} tagInput={tagInput} setTagInput={setTagInput} onAddTag={addTag} onRemoveTag={removeTag} tr={tr} />
    </section> : mode === "proposed" ? <ProposedMap repositories={repositories} targets={targets} scenarioName={scenarioName} onMove={moveRepository} onSelect={(id) => { setSelectedId(id); setMode("current"); }} onCurrent={() => setMode("current")} tr={tr} /> : <CompareView comparison={comparison} targets={targets} onCurrent={() => setMode("current")} tr={tr} />}

    <section className="review-panel"><div><p className="eyebrow">{tr("External review, optional")}</p><h2>{tr("Export the migration plan")}</h2><p>{tr("Download a JSON manifest and Markdown plan for human review. The files never contain tokens or repository contents, and they never execute Git operations.")}</p></div><div className="review-actions"><button className="primary" onClick={() => download("repo-atlas-migration-manifest.json", JSON.stringify(migrationManifest, null, 2), "application/json")}>{tr("Download manifest")}</button><button className="secondary" onClick={() => download("repo-atlas-migration-plan.md", manifestToMarkdown(migrationManifest), "text/markdown")}>{tr("Download Markdown")}</button><button className="secondary" onClick={makePrompt}>{tr("Generate AI prompt")}</button>{prompt && <button className="secondary" onClick={copyPrompt}>{tr("Copy prompt")}</button>}</div>{prompt && <textarea className="prompt" value={prompt} onChange={(event) => setPrompt(event.target.value)} aria-label={tr("Generated AI review prompt")} />}</section>

    <section className="safety"><div><p className="eyebrow">{tr("Migration safety")}</p><h2>{tr("History is a decision, not an afterthought")}</h2></div><ol><li><b>{tr("Scenario first")}</b><span>{tr("Accept, edit, or discard recommendations without touching a repository.")}</span></li><li><b>{tr("Recorded strategy")}</b><span>{tr("Each move explicitly uses full history or a squashed import.")}</span></li><li><b>{tr("Exact state")}</b><span>{tr("Imports include the source branch and commit SHA when GitHub metadata is available.")}</span></li><li><b>{tr("Human execution")}</b><span>{tr("Atlas exports a review plan; it never runs destructive Git actions.")}</span></li></ol></section>
    {toast && <div className="toast" role="status"><span>{tr(toast.message)}</span>{toast.undoable && scenarioHistory.canUndo && <button type="button" onClick={undoScenario}>{tr("Undo")}</button>}<button type="button" aria-label={tr("Dismiss notification")} onClick={() => setToast(null)}>×</button></div>}
  </main></>;
}

createRoot(document.getElementById("root")).render(<App />);
