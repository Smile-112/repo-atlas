import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import { clearWorkspace, loadWorkspace, saveWorkspace } from "./workspaceStorage";

const targets = [
  { id: "minecraft-addons", name: "minecraft-addons", description: "Mods, plugins and server tooling", strategy: "Full Git history" },
  { id: "personal-lab", name: "personal-lab", description: "Small utilities and experiments", strategy: "Squashed imports" },
  { id: "learning-archive", name: "learning-archive", description: "Finished learning projects", strategy: "Squashed imports" }
];

const initialRepositories = [
  { id: "minecraft_addons", domain: "Minecraft", status: "Active", language: "Java", updated: "2026-07-11", size: 84, score: 91, decision: "keep", description: "Mods, plugins and shared server tooling.", tags: ["minecraft", "steamcraft"], target: null, history: "full" },
  { id: "MM_Forge_mod", domain: "Minecraft", status: "Archived", language: "Java", updated: "2025-09-20", size: 18, score: 63, decision: "merge", description: "Forge chat-formatting mod.", tags: ["minecraft", "forge"], target: "minecraft-addons", history: "full" },
  { id: "tg_minecraft_bridge_forge", domain: "Minecraft", status: "Active", language: "Java", updated: "2025-10-02", size: 22, score: 76, decision: "merge", description: "Telegram to Minecraft bridge.", tags: ["minecraft", "forge", "telegram"], target: "minecraft-addons", history: "full" },
  { id: "whisper_bot", domain: "Automation", status: "Active", language: "Python", updated: "2026-06-28", size: 36, score: 86, decision: "keep", description: "Independent bot service and deployment.", tags: ["bot", "service"], target: null, history: "full" },
  { id: "VTI_System", domain: "Industrial", status: "Maintenance", language: "Python", updated: "2025-06-19", size: 41, score: 74, decision: "keep", description: "Rotating-equipment diagnostics.", tags: ["industrial", "portfolio"], target: null, history: "full" },
  { id: "Recommendation_system", domain: "Portfolio", status: "Complete", language: "Go", updated: "2025-04-17", size: 13, score: 81, decision: "keep", description: "Standalone public recommendation project.", tags: ["portfolio", "public"], target: null, history: "full" },
  { id: "new_site_for_kerosinka", domain: "Web", status: "Active", language: "TypeScript", updated: "2026-05-21", size: 57, score: 79, decision: "keep", description: "Client website with own deployment.", tags: ["client", "web"], target: null, history: "full" },
  { id: "django-sprint4", domain: "Learning", status: "Complete", language: "Python", updated: "2024-11-12", size: 9, score: 58, decision: "archive", description: "Completed learning project.", tags: ["learning", "django"], target: null, history: "squash" },
  { id: "homework-bot", domain: "Automation", status: "Archived", language: "Python", updated: "2024-07-01", size: 4, score: 48, decision: "merge", description: "Small utility bot.", tags: ["bot", "learning"], target: "personal-lab", history: "squash" }
];

const actions = ["all", "keep", "merge", "archive"];
const decisionText = { keep: "Keep separate", merge: "Move to monorepo", archive: "Archive" };

function App() {
  const [workspace] = useState(() => loadWorkspace(initialRepositories));
  const [repositories, setRepositories] = useState(workspace.repositories);
  const [selectedId, setSelectedId] = useState(initialRepositories[1].id);
  const [mode, setMode] = useState("current");
  const [domain, setDomain] = useState("all");
  const [decision, setDecision] = useState("all");
  const [query, setQuery] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [prompt, setPrompt] = useState("");
  const [saveState, setSaveState] = useState(workspace.source === "local" ? "Restored from this browser" : "Demo workspace");

  useEffect(() => {
    try {
      saveWorkspace(repositories);
      setSaveState("Saved in this browser");
    } catch {
      setSaveState("Could not save locally");
    }
  }, [repositories]);

  const selected = repositories.find((repo) => repo.id === selectedId) ?? repositories[0];
  const domains = ["all", ...new Set(repositories.map((repo) => repo.domain))];
  const filtered = useMemo(() => repositories.filter((repo) =>
    (domain === "all" || repo.domain === domain) &&
    (decision === "all" || repo.decision === decision) &&
    `${repo.id} ${repo.description} ${repo.language} ${repo.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase())
  ), [repositories, domain, decision, query]);
  const mergeCount = repositories.filter((repo) => repo.decision === "merge").length;
  const activeCount = repositories.filter((repo) => repo.status === "Active").length;

  function updateSelected(patch) {
    setRepositories((items) => items.map((repo) => repo.id === selected.id ? { ...repo, ...patch } : repo));
  }
  function addTag(event) {
    event.preventDefault();
    const tag = tagInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (tag && !selected.tags.includes(tag)) updateSelected({ tags: [...selected.tags, tag] });
    setTagInput("");
  }
  function removeTag(tag) { updateSelected({ tags: selected.tags.filter((item) => item !== tag) }); }
  function makePrompt() {
    const moves = repositories.filter((repo) => repo.decision === "merge");
    const archives = repositories.filter((repo) => repo.decision === "archive");
    const targetLines = targets.map((target) => {
      const members = moves.filter((repo) => repo.target === target.id);
      return members.length ? `- ${target.name} (${target.strategy}): ${members.map((repo) => repo.id).join(", ")}` : null;
    }).filter(Boolean).join("\n");
    setPrompt(`You are a senior Git engineer. Review this repository consolidation plan.\n\nGoal\nKeep independent products separate; group related small projects into thematic monorepositories.\n\nProposed monorepos\n${targetLines || "- None"}\n\nArchives\n${archives.map((repo) => `- ${repo.id}`).join("\n") || "- None"}\n\nConstraints\n- Do not propose destructive commands without a safer alternative.\n- ${moves.some((repo) => repo.history === "full") ? "Preserve full Git history for items marked Full Git history." : "Use a documented import strategy."}\n- Original repositories are archived only after build and history verification.\n- Treat this as a review; do not execute changes.\n\nInspect likely path conflicts, CI implications, licensing, forks/upstreams, and rollback gaps. Ask concise questions where data is missing.`);
  }
  async function copyPrompt() {
    if (!prompt) makePrompt();
    if (navigator.clipboard && prompt) await navigator.clipboard.writeText(prompt);
  }
  function resetWorkspace() {
    clearWorkspace();
    setRepositories(initialRepositories);
    setSelectedId(initialRepositories[1].id);
    setPrompt("");
    setSaveState("Demo workspace restored");
  }

  return <main>
    <header className="hero">
      <div><p className="eyebrow">Repository intelligence, locally owned</p><h1>Repo Atlas</h1><p className="lede">Explore today’s repositories, model a safer tomorrow, then export a reviewable migration plan.</p></div>
      <div className="hero-controls"><div className="mode-switch" aria-label="Atlas mode"><button className={mode === "current" ? "active" : ""} onClick={() => setMode("current")}>Current map</button><button className={mode === "proposed" ? "active" : ""} onClick={() => setMode("proposed")}>Proposed map</button></div><span className="workspace-status">● {saveState}</span><button className="reset" onClick={resetWorkspace}>Reset demo</button></div>
    </header>

    <section className="metrics" aria-label="Portfolio summary"><Metric label="Repositories" value={repositories.length} hint="In this workspace" /><Metric label="Active" value={activeCount} hint="Updated or maintained" /><Metric label="Planned moves" value={mergeCount} hint="Reversible scenario decisions" tone="accent" /><Metric label="Target monorepos" value={targets.filter((target) => repositories.some((repo) => repo.target === target.id && repo.decision === "merge")).length} hint="Visible in proposed map" tone="blue" /></section>

    {mode === "current" ? <section className="workspace" id="catalog">
      <aside className="filters"><div><p className="eyebrow">Workspace</p><h2>Current portfolio</h2></div><label>Search<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Repository, tag, stack" /></label><Filter label="Domain" value={domain} onChange={setDomain} values={domains} /><Filter label="Decision" value={decision} onChange={setDecision} values={actions} /><div className="principle"><strong>Safe by design</strong><p>Decisions are stored as a scenario. They do not modify GitHub.</p></div></aside>
      <div className="content"><div className="section-title"><div><p className="eyebrow">Repository catalog</p><h2>{filtered.length} repositories in view</h2></div><span>Demo workspace</span></div><div className="repo-grid">{filtered.map((repo) => <RepositoryCard key={repo.id} repo={repo} selected={selected.id === repo.id} onClick={() => setSelectedId(repo.id)} />)}</div></div>
      <RepositoryDetail repo={selected} targets={targets} onUpdate={updateSelected} tagInput={tagInput} setTagInput={setTagInput} onAddTag={addTag} onRemoveTag={removeTag} />
    </section> : <ProposedMap repositories={repositories} targets={targets} onSelect={setSelectedId} onCurrent={() => setMode("current")} />}

    <section className="review-panel"><div><p className="eyebrow">External review, optional</p><h2>Generate an AI review prompt</h2><p>Atlas does not call a model or send data anywhere. It produces a copyable prompt from the active scenario; tokens and repository contents are never included.</p></div><div className="review-actions"><button className="primary" onClick={makePrompt}>Generate prompt</button>{prompt && <button className="secondary" onClick={copyPrompt}>Copy prompt</button>}</div>{prompt && <textarea className="prompt" value={prompt} onChange={(event) => setPrompt(event.target.value)} aria-label="Generated AI review prompt" />}</section>

    <section className="safety"><div><p className="eyebrow">Migration safety</p><h2>History is a decision, not an afterthought</h2></div><ol><li><b>Scenario first</b><span>Accept, edit, or discard recommendations without touching a repository.</span></li><li><b>Recorded strategy</b><span>Each move explicitly uses full history or a squashed import.</span></li><li><b>Manifest later</b><span>The future exporter records source SHA, branch, target path, and verification status.</span></li><li><b>Human execution</b><span>Atlas prepares commands and rollback checks; it does not run destructive Git actions.</span></li></ol></section>
  </main>;
}

function RepositoryCard({ repo, selected, onClick }) { return <button type="button" className={`repo-card ${selected ? "selected" : ""}`} onClick={onClick}><div className="card-top"><span className={`status ${repo.status.toLowerCase()}`}>{repo.status}</span><span className="score">{repo.score}</span></div><h3>{repo.id}</h3><p>{repo.description}</p><div className="tags">{repo.tags.slice(0, 3).map((tag) => <span key={tag}>#{tag}</span>)}</div><footer><span>{repo.domain}</span><span>{repo.language}</span><span className={`action ${repo.decision}`}>{decisionText[repo.decision]}</span></footer></button>; }

function RepositoryDetail({ repo, targets, onUpdate, tagInput, setTagInput, onAddTag, onRemoveTag }) { return <aside className="detail"><p className="eyebrow">Repository profile</p><h2>{repo.id}</h2><p>{repo.description}</p><dl><div><dt>Domain</dt><dd>{repo.domain}</dd></div><div><dt>Health score</dt><dd>{repo.score}/100</dd></div><div><dt>Last updated</dt><dd>{repo.updated}</dd></div></dl><label>Decision<select value={repo.decision} onChange={(event) => onUpdate({ decision: event.target.value, target: event.target.value === "merge" ? repo.target ?? targets[0].id : null })}>{actions.slice(1).map((item) => <option key={item} value={item}>{decisionText[item]}</option>)}</select></label>{repo.decision === "merge" && <><label>Target monorepo<select value={repo.target ?? targets[0].id} onChange={(event) => onUpdate({ target: event.target.value })}>{targets.map((target) => <option key={target.id} value={target.id}>{target.name}</option>)}</select></label><label>History strategy<select value={repo.history} onChange={(event) => onUpdate({ history: event.target.value })}><option value="full">Preserve full history</option><option value="squash">Squash into import commit</option></select></label></>}<div className="tag-editor"><span>Tags</span><div className="tags editable">{repo.tags.map((tag) => <button type="button" key={tag} onClick={() => onRemoveTag(tag)} title={`Remove ${tag}`}>#{tag} ×</button>)}</div><form onSubmit={onAddTag}><input value={tagInput} onChange={(event) => setTagInput(event.target.value)} placeholder="Add custom tag" /><button type="submit">Add</button></form></div></aside>; }

function ProposedMap({ repositories, targets, onSelect, onCurrent }) { const independent = repositories.filter((repo) => repo.decision === "keep"); const archived = repositories.filter((repo) => repo.decision === "archive"); return <section className="proposal"><div className="section-title"><div><p className="eyebrow">Scenario: consolidation 2026</p><h2>Proposed repository map</h2><p>This is a preview of accepted decisions. No repository has been moved.</p></div><button className="secondary" onClick={onCurrent}>Edit decisions</button></div><div className="map-grid">{targets.map((target) => { const members = repositories.filter((repo) => repo.decision === "merge" && repo.target === target.id); return <article className="map-group" key={target.id}><span className="map-kind">Target monorepo</span><h3>{target.name}</h3><p>{target.description}</p><small>{target.strategy}</small><div>{members.length ? members.map((repo) => <button key={repo.id} onClick={() => onSelect(repo.id)}>{repo.id}<span>{repo.history === "full" ? "Full history" : "Squash"}</span></button>) : <em>No planned imports</em>}</div></article>; })}<article className="map-group independent"><span className="map-kind">Independent</span><h3>Keep separate</h3><p>Distinct product, deployment, client, or portfolio scope.</p><div>{independent.map((repo) => <button key={repo.id} onClick={() => onSelect(repo.id)}>{repo.id}</button>)}</div></article><article className="map-group archive"><span className="map-kind">Archive</span><h3>Preserve, don’t delete</h3><p>Original URLs and history remain available.</p><div>{archived.map((repo) => <button key={repo.id} onClick={() => onSelect(repo.id)}>{repo.id}</button>)}</div></article></div></section>; }

function Metric({ label, value, hint, tone = "" }) { return <article className={`metric ${tone}`}><span>{label}</span><strong>{value}</strong><small>{hint}</small></article>; }
function Filter({ label, value, onChange, values }) { return <label>{label}<select value={value} onChange={(event) => onChange(event.target.value)}>{values.map((item) => <option key={item} value={item}>{item === "all" ? "All" : item}</option>)}</select></label>; }

createRoot(document.getElementById("root")).render(<App />);
