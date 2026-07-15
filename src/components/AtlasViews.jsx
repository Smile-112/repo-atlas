import { useState } from "react";

const actions = ["all", "keep", "merge", "archive"];
const decisionText = { keep: "Keep separate", merge: "Move to monorepo", archive: "Archive" };
const targetName = (target, tr) => target?.kind === "archive" && ["Archive", "Archive monorepo"].includes(target.name) ? tr("Archive monorepo") : target?.name;

export function ScenarioToolbar({ scenarioName, onScenarioName, canUndo, canRedo, onUndo, onRedo, onExport, onImport, targets, onAddTarget, onUpdateTarget, onDeleteTarget, tr }) {
  return <section className="scenario-toolbar" aria-label={tr("Scenario tools")}>
    <label>{tr("Scenario name")}<input value={scenarioName} maxLength="80" onChange={(event) => onScenarioName(event.target.value)} /></label>
    <div className="history-actions"><button type="button" disabled={!canUndo} onClick={onUndo}>{tr("Undo")}</button><button type="button" disabled={!canRedo} onClick={onRedo}>{tr("Redo")}</button></div>
    <details className="workspace-menu"><summary>{tr("Workspace file")}</summary><div className="workspace-file-actions"><button type="button" onClick={onExport}>{tr("Export workspace")}</button><label className="file-button">{tr("Import workspace")}<input type="file" accept="application/json,.json" onChange={onImport} /></label></div></details>
    <details className="quick-guide"><summary>{tr("How to use Repo Atlas")}</summary><ol><li><b>{tr("Explore")}</b><span>{tr("Import repositories, search the catalog, and review the suggested decision.")}</span></li><li><b>{tr("Model")}</b><span>{tr("Accept a recommendation or drag repositories on the future map.")}</span></li><li><b>{tr("Review")}</b><span>{tr("Compare the scenario, then export a manifest for manual execution.")}</span></li></ol></details>
    <details className="target-manager"><summary>{tr("Manage target groups")} <span>{targets.length}</span></summary><div className="target-editor-list">{targets.map((target) => <fieldset key={target.id} className={target.kind === "archive" ? "archive-target" : ""}><legend>{target.name} {target.kind === "archive" && <small>{tr("Built-in archive")}</small>}</legend><label>{tr("Name")}<input value={target.name} onChange={(event) => onUpdateTarget(target.id, { name: event.target.value })} /></label><label>{tr("Description")}<input value={target.description} onChange={(event) => onUpdateTarget(target.id, { description: event.target.value })} /></label><label>{tr("History strategy")}<select value={target.strategy} onChange={(event) => onUpdateTarget(target.id, { strategy: event.target.value })}><option value="Full Git history">{tr("Full Git history")}</option><option value="Squashed imports">{tr("Squashed imports")}</option></select></label><label>{tr("Destination folder")}<input value={target.pathPrefix ?? "projects"} pattern="[a-zA-Z0-9/_-]+" onChange={(event) => onUpdateTarget(target.id, { pathPrefix: event.target.value })} /></label><label>{tr("Default branch")}<input value={target.defaultBranch ?? "main"} onChange={(event) => onUpdateTarget(target.id, { defaultBranch: event.target.value })} /></label><label>{tr("Remote URL")}<input value={target.remoteUrl ?? ""} placeholder="https://github.com/org/repository.git" onChange={(event) => onUpdateTarget(target.id, { remoteUrl: event.target.value })} /></label><button className="danger" type="button" disabled={targets.length <= 1 || target.kind === "archive"} onClick={() => onDeleteTarget(target.id)}>{tr("Delete group")}</button></fieldset>)}</div><button type="button" onClick={onAddTarget}>{tr("Add target group")}</button></details>
  </section>;
}

export function RepositoryCard({ repo, selected, checked, onToggle, onClick, tr }) {
  return <article className={`repo-card-shell ${checked ? "checked" : ""}`}>
    <label className="repo-select"><span className="sr-only">{tr("Select repository")} {repo.id}</span><input type="checkbox" checked={checked} onChange={() => onToggle(repo.id)} /></label>
    <button type="button" className={`repo-card ${selected ? "selected" : ""}`} aria-pressed={selected} onClick={onClick}>
    <div className="card-top"><span className={`status ${repo.status.toLowerCase()}`}>{tr(repo.status)}</span><span className="score">{repo.score}</span></div>
    <h3>{repo.id}</h3><p>{repo.description}</p>
    <div className="tags">{repo.tags.slice(0, 3).map((tag) => <span key={tag}>#{tag}</span>)}</div>
    {repo.technologies?.length > 0 && <div className="technologies">{repo.technologies.slice(0, 4).map((technology) => <span key={technology}>{technology}</span>)}</div>}
    <footer><span>{repo.domain}</span><span>{repo.language}</span><span className={`action ${repo.decision}`}>{tr(decisionText[repo.decision])}</span></footer>
    </button>
  </article>;
}

export function RepositoryDetail({ repo, targets, analysis, onUpdate, tagInput, setTagInput, onAddTag, onRemoveTag, tr }) {
  const target = targets.find((item) => item.id === analysis.target);
  const suggestedTargetName = targetName(target, tr);
  const archiveTarget = targets.find((item) => item.kind === "archive");
  const normalTargets = targets.filter((item) => item.kind !== "archive");
  const accept = () => onUpdate({ decision: analysis.action, target: ["merge", "archive"].includes(analysis.action) ? analysis.target : null, history: analysis.action === "archive" ? "full" : repo.history });
  return <aside className="detail">
    <p className="eyebrow">{tr("Repository profile")}</p><h2>{repo.id}</h2><p>{repo.description}</p>
    {repo.technologies?.length > 0 && <div className="detail-technologies"><span>{tr("Technology stack")}</span><div className="technologies">{repo.technologies.map((technology) => <span key={technology}>{technology}</span>)}</div></div>}
    <div className={`analysis ${analysis.action}`}>
      <div><strong>{tr("Recommendation:")} {tr(decisionText[analysis.action])}</strong><span>{tr(`${analysis.confidence}% confidence`)}</span></div>
      {target && <p>{tr("Suggested target:")} <b>{suggestedTargetName}</b></p>}
      <ul>{analysis.reasons.map((reason) => <li key={reason}>+ {tr(reason)}</li>)}{analysis.concerns.map((concern) => <li className="concern" key={concern}>! {tr(concern)}</li>)}</ul>
      <details className="analysis-criteria" open><summary>{tr("Criteria considered")} <span>{analysis.criteria?.length ?? 0}</span></summary><ul>{analysis.criteria?.map((criterion) => <li key={criterion}>{tr(criterion)}</li>)}</ul></details>
      <button type="button" onClick={accept}>{tr("Adopt recommendation")}</button>
    </div>
    <dl><div><dt>{tr("Domain")}</dt><dd>{repo.domain}</dd></div><div><dt>{tr("Health score")}</dt><dd>{repo.score}/100</dd></div><div><dt>{tr("Last updated")}</dt><dd>{repo.updated}</dd></div></dl>
    <label>{tr("Decision")}<select value={repo.decision} onChange={(event) => { const value = event.target.value; onUpdate({ decision: value, target: value === "merge" ? repo.target ?? normalTargets[0]?.id ?? null : value === "archive" ? archiveTarget?.id ?? null : null, history: value === "archive" ? "full" : repo.history }); }}>{actions.slice(1).map((item) => <option key={item} value={item}>{tr(decisionText[item])}</option>)}</select></label>
    {["merge", "archive"].includes(repo.decision) && <><label>{tr(repo.decision === "archive" ? "Archive monorepo" : "Target monorepo")}<select value={repo.target ?? (repo.decision === "archive" ? archiveTarget?.id : normalTargets[0]?.id)} onChange={(event) => onUpdate({ target: event.target.value })}>{(repo.decision === "archive" ? targets.filter((item) => item.kind === "archive") : normalTargets).map((targetItem) => <option key={targetItem.id} value={targetItem.id}>{targetName(targetItem, tr)}</option>)}</select></label><label>{tr("History strategy")}<select value={repo.history} onChange={(event) => onUpdate({ history: event.target.value })}><option value="full">{tr("Preserve full history")}</option><option value="squash">{tr("Squash into import commit")}</option></select></label></>}
    <div className="tag-editor"><span>{tr("Tags")}</span><div className="tags editable">{repo.tags.map((tag) => <button type="button" key={tag} onClick={() => onRemoveTag(tag)} title={`${tr("Remove")} ${tag}`}>#{tag} ×</button>)}</div><form onSubmit={onAddTag}><input value={tagInput} onChange={(event) => setTagInput(event.target.value)} placeholder={tr("Add custom tag")} /><button type="submit">{tr("Add")}</button></form></div>
  </aside>;
}

export function ProposedMap({ repositories, targets, scenarioName, onMove, onSelect, onCurrent, tr }) {
  const [draggedId, setDraggedId] = useState(null);
  const [activeDropZone, setActiveDropZone] = useState(null);
  const [announcement, setAnnouncement] = useState("");
  const independent = repositories.filter((repo) => repo.decision === "keep");

  function destinationLabel(destination) {
    if (destination === "keep") return tr("Keep separate");
    return targetName(targets.find((target) => target.id === destination), tr) ?? destination;
  }

  function move(repoId, destination) {
    if (!repoId) return;
    onMove(repoId, destination);
    setAnnouncement(tr(`${repoId} moved to ${destinationLabel(destination)}.`));
    setDraggedId(null);
    setActiveDropZone(null);
  }

  function dropProps(destination) {
    return {
      onDragEnter: (event) => { event.preventDefault(); setActiveDropZone(destination); },
      onDragOver: (event) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; },
      onDragLeave: (event) => { if (!event.currentTarget.contains(event.relatedTarget)) setActiveDropZone(null); },
      onDrop: (event) => { event.preventDefault(); move(event.dataTransfer.getData("text/repository-id") || draggedId, destination); }
    };
  }

  function renderRepositoryTile(repo) {
    const destination = ["merge", "archive"].includes(repo.decision) ? repo.target : repo.decision;
    return <article key={repo.id} className={`map-repository ${draggedId === repo.id ? "dragging" : ""}`} draggable="true" onDragStart={(event) => { setDraggedId(repo.id); event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/repository-id", repo.id); }} onDragEnd={() => { setDraggedId(null); setActiveDropZone(null); }}>
      <button type="button" onClick={() => onSelect(repo.id)} title={tr("Open repository details")}><span>{repo.id}</span>{repo.decision === "merge" && <small>{tr(repo.history === "full" ? "Full history" : "Squash")}</small>}</button>
      <label className="map-move">{tr("Move to")}<select value={destination ?? "keep"} onChange={(event) => move(repo.id, event.target.value)}>{targets.map((target) => <option key={target.id} value={target.id}>{targetName(target, tr)}</option>)}<option value="keep">{tr("Keep separate")}</option></select></label>
    </article>;
  }

  function renderGroup({ destination, className = "", kind, title, description, detail, members, empty }) {
    return <article key={destination} className={`map-group ${className} ${activeDropZone === destination ? "drop-active" : ""}`} {...dropProps(destination)}><span className="map-kind">{tr(kind)}</span><h3>{tr(title)}</h3><p>{tr(description)}</p>{detail && <small>{tr(detail)}</small>}<div>{members.length ? members.map(renderRepositoryTile) : <em>{tr(empty)}</em>}</div></article>;
  }

  return <section className="proposal">
    <div className="section-title"><div><p className="eyebrow">{tr("Scenario:")} {scenarioName}</p><h2>{tr("Proposed repository map")}</h2><p>{tr("Drag repositories between groups to update this reversible scenario. No repository is moved on a provider.")}</p></div><button className="secondary" onClick={onCurrent}>{tr("Edit decisions")}</button></div>
    <p className="drag-hint">{tr("Drag a card to another group, or use its “Move to” menu.")}</p>
    <div className="map-grid">
      {targets.map((target) => renderGroup({ destination: target.id, className: target.kind === "archive" ? "archive" : "", kind: target.kind === "archive" ? "Archive monorepo" : "Target monorepo", title: target.kind === "archive" ? "Archive monorepo" : target.name, description: target.description, detail: target.strategy, members: repositories.filter((repo) => repo.target === target.id && repo.decision === (target.kind === "archive" ? "archive" : "merge")), empty: target.kind === "archive" ? "No archive imports" : "No planned imports" }))}
      {renderGroup({ destination: "keep", className: "independent", kind: "Independent", title: "Keep separate", description: "Distinct product, deployment, client, or portfolio scope.", members: independent, empty: "No independent repositories" })}
    </div>
    <p className="sr-only" role="status" aria-live="polite">{announcement}</p>
  </section>;
}

export function CompareView({ comparison, targets, onCurrent, tr }) {
  const destination = (repository) => targetName(targets.find((target) => target.id === repository.target), tr) ?? tr("Unresolved target");
  return <section className="compare-view">
    <div className="section-title"><div><p className="eyebrow">{tr("Scenario diff")}</p><h2>{tr("Current → proposed")}</h2><p>{tr("Every row is a planned change, not a Git operation.")}</p></div><button className="secondary" onClick={onCurrent}>{tr("Resolve decisions")}</button></div>
    <div className="compare-summary"><Metric label={tr("Moves")} value={comparison.moves.length} hint={tr("Become subprojects")} tone="blue" /><Metric label={tr("Archives")} value={comparison.archives.length} hint={tr("Retain history and URL")} tone="warning" /><Metric label={tr("Unchanged")} value={comparison.unchanged.length} hint={tr("Stay standalone")} tone="accent" /><Metric label={tr("Conflicts")} value={comparison.conflicts.length} hint={tr("Must be resolved")} tone={comparison.conflicts.length ? "warning" : ""} /></div>
    <div className="change-list"><h3>{tr("Planned moves")}</h3>{comparison.moves.length ? comparison.moves.map((repository) => <article key={repository.id}><b>{repository.id}</b><span>{tr("standalone")}</span><strong>→</strong><span>{destination(repository)}</span><small>{tr(repository.history === "full" ? "Preserve full history" : "Squash import")}</small></article>) : <p>{tr("No moves accepted yet.")}</p>}</div>
    <div className="change-list archive-list"><h3>{tr("Archive imports")}</h3>{comparison.archives.length ? comparison.archives.map((repository) => <article key={repository.id}><b>{repository.id}</b><span>{tr("standalone")}</span><strong>→</strong><span>{destination(repository)}</span><small>{tr(repository.history === "full" ? "Preserve full history" : "Squash import")}</small></article>) : <p>{tr("No archive decisions.")}</p>}</div>
    {comparison.conflicts.length > 0 && <div className="conflicts"><h3>{tr("Blocking conflicts")}</h3>{comparison.conflicts.map(({ repository, message }) => <p key={repository.id}><b>{repository.id}:</b> {tr(message)}</p>)}</div>}
    <div className="review-list"><h3>{tr("Decisions worth reviewing")}</h3>{comparison.review.length ? comparison.review.map(({ repository, analysis }) => <p key={repository.id}><b>{repository.id}</b>: {tr("current decision is")} <em>{tr(decisionText[repository.decision])}</em>; {tr("current rules suggest")} <em>{tr(decisionText[analysis.action])}</em> ({analysis.confidence}%).</p>) : <p>{tr("Accepted decisions match the active recommendation rules.")}</p>}</div>
  </section>;
}

export function Metric({ label, value, hint, tone = "" }) {
  return <article className={`metric ${tone}`}><span>{label}</span><strong>{value}</strong><small>{hint}</small></article>;
}

export function Filter({ label, value, onChange, values, tr }) {
  return <label>{label}<select value={value} onChange={(event) => onChange(event.target.value)}>{values.map((item) => <option key={item} value={item}>{tr(item === "all" ? "All" : item)}</option>)}</select></label>;
}
